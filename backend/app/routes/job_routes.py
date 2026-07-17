from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from . import jobs_bp
from ..models import Job, Proposal, User
from ..database import db
from ..auth import require_auth, require_role
from ..utils import generate_id, parse_float, parse_int

@jobs_bp.route('/', methods=['GET'])
def get_jobs():
    category = request.args.get('category')
    status = request.args.get('status', 'open')
    type_filter = request.args.get('type')
    remote = request.args.get('remote')
    search = request.args.get('search', '').strip().lower()
    min_budget = parse_float(request.args.get('minBudget'), 0)
    max_budget = parse_float(request.args.get('maxBudget'), 999999999)
    
    query = Job.query
    
    if category:
        query = query.filter_by(category=category)
    if status:
        query = query.filter_by(status=status)
    if type_filter:
        query = query.filter_by(type=type_filter)
    if remote:
        query = query.filter_by(remote=remote)
    if min_budget > 0:
        query = query.filter(Job.budget >= min_budget)
    if max_budget < 999999999:
        query = query.filter(Job.budget <= max_budget)
    if search:
        query = query.filter(
            (Job.title.ilike(f'%{search}%')) |
            (Job.description.ilike(f'%{search}%'))
        )
    
    jobs = query.order_by(Job.created_at.desc()).all()
    return jsonify([j.to_dict() for j in jobs]), 200

@jobs_bp.route('/', methods=['POST'])
@jwt_required()
def create_job():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    required = ['title', 'category', 'subcategory', 'description', 'type', 'budget', 'location', 'remote']
    for field in required:
        if field not in data or not data[field]:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    if data['type'] not in ['fixed', 'hourly']:
        return jsonify({'error': 'Invalid type. Must be "fixed" or "hourly"'}), 400
    
    if data['remote'] not in ['remote', 'onsite', 'hybrid']:
        return jsonify({'error': 'Invalid remote. Must be "remote", "onsite", or "hybrid"'}), 400
    
    job = Job(
        id=generate_id('j'),
        owner_id=user_id,
        title=data['title'],
        category=data['category'],
        subcategory=data['subcategory'],
        description=data['description'],
        type=data['type'],
        budget=parse_float(data['budget'], 0),
        location=data['location'],
        remote=data['remote'],
        skills=json.dumps(data.get('skills', [])),
        deadline=data.get('deadline', ''),
        status='open'
    )
    
    db.session.add(job)
    db.session.commit()
    
    return jsonify({'message': 'Job created', 'job': job.to_dict()}), 201

@jobs_bp.route('/<job_id>', methods=['GET'])
def get_job(job_id):
    job = Job.query.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    return jsonify(job.to_dict()), 200

@jobs_bp.route('/<job_id>', methods=['PUT'])
@jwt_required()
def update_job(job_id):
    user_id = get_jwt_identity()
    job = Job.query.get(job_id)
    
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    if job.owner_id != user_id:
        return jsonify({'error': 'You can only update your own jobs'}), 403
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    allowed_fields = ['title', 'category', 'subcategory', 'description', 'type', 'budget', 'location', 'remote', 'skills', 'deadline', 'status']
    for field in allowed_fields:
        if field in data:
            if field == 'skills':
                job.skills = json.dumps(data[field]) if isinstance(data[field], list) else data[field]
            else:
                setattr(job, field, data[field])
    
    db.session.commit()
    return jsonify({'message': 'Job updated', 'job': job.to_dict()}), 200

@jobs_bp.route('/<job_id>', methods=['DELETE'])
@jwt_required()
def delete_job(job_id):
    user_id = get_jwt_identity()
    job = Job.query.get(job_id)
    
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    if job.owner_id != user_id:
        return jsonify({'error': 'You can only delete your own jobs'}), 403
    
    db.session.delete(job)
    db.session.commit()
    
    return jsonify({'message': 'Job deleted'}), 200

@jobs_bp.route('/<job_id>/proposals', methods=['GET'])
def get_job_proposals(job_id):
    job = Job.query.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    proposals = Proposal.query.filter_by(job_id=job_id).all()
    return jsonify([p.to_dict() for p in proposals]), 200
