from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from . import messages_bp
from ..models import Message, User
from ..database import db
from ..auth import require_auth
from ..utils import generate_id

@messages_bp.route('/', methods=['GET'])
@jwt_required()
def get_messages():
    user_id = get_jwt_identity()
    peer_id = request.args.get('peerId')
    
    query = Message.query.filter(
        (Message.from_user_id == user_id) | (Message.to_user_id == user_id)
    )
    
    if peer_id:
        query = query.filter(
            (Message.from_user_id == peer_id) | (Message.to_user_id == peer_id)
        )
    
    messages = query.order_by(Message.created_at.asc()).all()
    
    # Mark messages as read
    if peer_id:
        unread = [m for m in messages if m.to_user_id == user_id and not m.read]
        for m in unread:
            m.read = True
        db.session.commit()
    
    return jsonify([m.to_dict() for m in messages]), 200

@messages_bp.route('/', methods=['POST'])
@jwt_required()
def send_message():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    to_user_id = data.get('to')
    text = data.get('text', '').strip()
    
    if not to_user_id:
        return jsonify({'error': 'Recipient required'}), 400
    if not text:
        return jsonify({'error': 'Message text required'}), 400
    
    recipient = User.query.get(to_user_id)
    if not recipient:
        return jsonify({'error': 'Recipient not found'}), 404
    
    if to_user_id == user_id:
        return jsonify({'error': 'Cannot send message to yourself'}), 400
    
    message = Message(
        id=generate_id('m'),
        from_user_id=user_id,
        to_user_id=to_user_id,
        text=text,
        read=False
    )
    
    db.session.add(message)
    db.session.commit()
    
    return jsonify({'message': 'Message sent', 'message_data': message.to_dict()}), 201

@messages_bp.route('/unread', methods=['GET'])
@jwt_required()
def get_unread_count():
    user_id = get_jwt_identity()
    count = Message.query.filter_by(to_user_id=user_id, read=False).count()
    return jsonify({'unread': count}), 200

@messages_bp.route('/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    user_id = get_jwt_identity()
    
    # Get all messages for this user
    messages = Message.query.filter(
        (Message.from_user_id == user_id) | (Message.to_user_id == user_id)
    ).order_by(Message.created_at.desc()).all()
    
    # Get unique peer IDs
    peer_ids = set()
    for m in messages:
        if m.from_user_id == user_id:
            peer_ids.add(m.to_user_id)
        else:
            peer_ids.add(m.from_user_id)
    
    # Get last message for each peer
    conversations = []
    for peer_id in peer_ids:
        last_msg = Message.query.filter(
            (Message.from_user_id == user_id) | (Message.to_user_id == user_id),
            (Message.from_user_id == peer_id) | (Message.to_user_id == peer_id)
        ).order_by(Message.created_at.desc()).first()
        
        if last_msg:
            peer = User.query.get(peer_id)
            conversations.append({
                'peerId': peer_id,
                'peerName': f"{peer.first_name} {peer.last_name}" if peer else 'Unknown',
                'lastMessage': last_msg.text,
                'lastMessageAt': last_msg.created_at.isoformat(),
                'unread': Message.query.filter_by(to_user_id=user_id, from_user_id=peer_id, read=False).count()
            })
    
    # Sort by last message time
    conversations.sort(key=lambda x: x['lastMessageAt'], reverse=True)
    
    return jsonify(conversations), 200
