from flask import request, jsonify
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, verify_jwt_in_request
from functools import wraps
import bcrypt
from datetime import datetime
import re

from .models import User
from .database import db

def hash_password(password):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password, password_hash):
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def generate_user_id():
    from .utils import generate_id
    return generate_id('u')

def authenticate_user(email, password):
    user = User.query.filter_by(email=email.lower()).first()
    if not user:
        return None
    if verify_password(password, user.password_hash):
        return user
    return None

def create_user(data):
    # Validate required fields
    required = ['firstName', 'lastName', 'email', 'password', 'role', 'category', 'location']
    for field in required:
        if field not in data or not data[field]:
            return None, f"Missing required field: {field}"
    
    # Validate email
    if not validate_email(data['email']):
        return None, "Invalid email address"
    
    # Check if user exists
    if User.query.filter_by(email=data['email'].lower()).first():
        return None, "Email already registered"
    
    # Validate password
    if len(data['password']) < 6:
        return None, "Password must be at least 6 characters"
    
    user = User(
        id=generate_user_id(),
        email=data['email'].lower(),
        password_hash=hash_password(data['password']),
        role=data['role'],
        first_name=data['firstName'],
        last_name=data['lastName'],
        role_title=data.get('roleTitle', ''),
        company=data.get('company', ''),
        category=data['category'],
        location=data['location'],
        bio=data.get('bio', ''),
        skills=json.dumps(data.get('skills', [])),
        hourly_rate=data.get('hourlyRate', 0),
        verified=False,
        created_at=datetime.utcnow()
    )
    
    db.session.add(user)
    db.session.commit()
    return user, None

def login_user(email, password):
    user = authenticate_user(email, password)
    if not user:
        return None, "Invalid email or password"
    
    access_token = create_access_token(identity=user.id)
    return access_token, None

def get_current_user():
    try:
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        return User.query.get(user_id)
    except:
        return None

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        return f(user, *args, **kwargs)
    return decorated

def require_role(role):
    def decorator(f):
        @wraps(f)
        def decorated(user, *args, **kwargs):
            if user.role != role:
                return jsonify({'error': f'Requires {role} role'}), 403
            return f(user, *args, **kwargs)
        return decorated
    return decorator
