from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from . import users_bp
from ..models import User, Review
from ..database import db
from ..auth import require_auth, require_role, hash_password

@users_bp.route('/', methods=['GET'])
def get_users():
    role = request.args.get('role')
    category = request.args.get('category')
    search = request.args.get('search', '').strip().lower()
    
    query = User.query
    
    if role:
        query = query.filter_by(role=role)
    if category:
        query = query.filter_by(category=category)
    if search:
        query = query.filter(
            (User.first_name.ilike(f'%{search}%')) |
            (User.last_name.ilike(f'%{search}%')) |
            (User.role_title.ilike(f'%{search}%'))
        )
    
    users = query.all()
    return jsonify([u.to_dict() for u in users]), 200

@users_bp.route('/<user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict()), 200

@users_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Update allowed fields
    allowed_fields = ['firstName', 'lastName', 'roleTitle', 'company', 'location', 'bio', 'skills', 'hourlyRate']
    for field in allowed_fields:
        if field in data:
            if field == 'skills':
                user.skills = json.dumps(data[field]) if isinstance(data[field], list) else data[field]
            elif field == 'hourlyRate':
                user.hourly_rate = float(data[field]) if data[field] else 0
            else:
                setattr(user, field, data[field])
    
    # Password update
    if 'password' in data and data['password']:
        if len(data['password']) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        user.password_hash = hash_password(data['password'])
    
    db.session.commit()
    return jsonify({'message': 'Profile updated', 'user': user.to_dict()}), 200

@users_bp.route('/<user_id>/reviews', methods=['GET'])
def get_user_reviews(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    reviews = Review.query.filter_by(target_id=user_id).all()
    return jsonify([r.to_dict() for r in reviews]), 200
