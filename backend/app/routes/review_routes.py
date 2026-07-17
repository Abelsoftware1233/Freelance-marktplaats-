from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from . import reviews_bp
from ..models import Review, Job, User
from ..database import db
from ..auth import require_auth
from ..utils import generate_id, parse_int

@reviews_bp.route('/', methods=['GET'])
def get_reviews():
    target_id = request.args.get('targetId')
    author_id = request.args.get('authorId')
    job_id = request.args.get('jobId')
    
    query = Review.query
    
    if target_id:
        query = query.filter_by(target_id=target_id)
    if author_id:
        query = query.filter_by(author_id=author_id)
    if job_id:
        query = query.filter_by(job_id=job_id)
    
    reviews = query.order_by(Review.created_at.desc()).all()
    return jsonify([r.to_dict() for r in reviews]), 200

@reviews_bp.route('/', methods=['POST'])
@jwt_required()
def create_review():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    target_id = data.get('targetId')
    job_id = data.get('jobId')
    rating = parse_int(data.get('rating'), 0)
    text = data.get('text', '').strip()
    
    if not target_id:
        return jsonify({'error': 'targetId is required'}), 400
    if not job_id:
        return jsonify({'error': 'jobId is required'}), 400
    if rating < 1 or rating > 5:
        return jsonify({'error': 'Rating must be between 1 and 5'}), 400
    if not text:
        return jsonify({'error': 'Review text is required'}), 400
    
    target = User.query.get(target_id)
    if not target:
        return jsonify({'error': 'Target user not found'}), 404
    
    job = Job.query.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    # Check if user is allowed to review
    if user_id == target_id:
        return jsonify({'error': 'Cannot review yourself'}), 400
    
    # Check if review already exists
    existing = Review.query.filter_by(job_id=job_id, author_id=user_id).first()
    if existing:
        return jsonify({'error': 'You already reviewed this job'}), 400
    
    review = Review(
        id=generate_id('r'),
        target_id=target_id,
        author_id=user_id,
        job_id=job_id,
        rating=rating,
        text=text
    )
    
    db.session.add(review)
    db.session.commit()
    
    return jsonify({'message': 'Review created', 'review': review.to_dict()}), 201

@reviews_bp.route('/<review_id>', methods=['DELETE'])
@jwt_required()
def delete_review(review_id):
    user_id = get_jwt_identity()
    review = Review.query.get(review_id)
    
    if not review:
        return jsonify({'error': 'Review not found'}), 404
    
    if review.author_id != user_id:
        return jsonify({'error': 'You can only delete your own reviews'}), 403
    
    db.session.delete(review)
    db.session.commit()
    
    return jsonify({'message': 'Review deleted'}), 200
