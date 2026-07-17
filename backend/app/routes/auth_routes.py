from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from . import auth_bp
from ..auth import create_user, login_user, get_current_user
from ..models import User
from ..database import db

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    user, error = create_user(data)
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'message': 'User created successfully',
        'user': user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400
    
    access_token, error = login_user(email, password)
    if error:
        return jsonify({'error': error}), 401
    
    user = User.query.filter_by(email=email.lower()).first()
    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user_route():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict()), 200

@auth_bp.route('/verify', methods=['GET'])
@jwt_required()
def verify_token():
    return jsonify({'valid': True}), 200

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    # JWT is stateless, we just return a success message
    return jsonify({'message': 'Logged out successfully'}), 200
