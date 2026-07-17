from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from . import proposals_bp
from ..models import Proposal, Job, User
from ..database import db
from ..auth import require_auth, require_role
from ..utils import generate_id, parse_float

@proposals_bp.route('/', methods=['GET'])
@jwt_required()
def get_proposals():
    user_id = get_jwt_identity()
    job_id = request.args.get('jobId')
    status = request.args.get('status')
    
    query = Proposal.query
    
    if job_id:
        query = query.filter_by(job_id=job_id)
    if status:
        query = query.filter_by(status=status)
    
    # Users can only see their own proposals, or proposals for their jobs
    user = User.query.get(user_id)
    if user.role == 'freelancer':
        query = query.filter_by(freelancer_id=user_id)
    elif user.role == 'client':
        user_job_ids = [j.id for j in user.jobs]
        if user_job_ids:
            query = query.filter(Proposal.job_id.in_(user_job_ids))
        else:
            return jsonify([]), 200
    
    proposals = query.all()
    return jsonify([p.to_dict() for p in proposals]), 200

@proposals_bp.route('/', methods=['POST'])
@jwt_required()
@require_role('freelancer')
def create_proposal(user):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    job_id = data.get('jobId')
    amount = parse_float(data.get('amount'), 0)
    message = data.get('message', '')
    timeline = data.get('timeline', '')
    
    if not job_id:
        return jsonify({'error': 'jobId is required'}), 400
    if amount <= 0:
        return jsonify({'error': 'Amount must be greater than 0'}), 400
    if not message:
        return jsonify({'error': 'Message is required'}), 400
    
    job = Job.query.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    if job.owner_id == user.id:
        return jsonify({'error': 'You cannot propose on your own job'}), 400
    
    # Check if already proposed
    existing = Proposal.query.filter_by(job_id=job_id, freelancer_id=user.id).first()
    if existing:
        return jsonify({'error': 'You already have a proposal for this job'}), 400
    
    proposal = Proposal(
        id=generate_id('p'),
        job_id=job_id,
        freelancer_id=user.id,
        amount=amount,
        timeline=timeline,
        message=message,
        status='pending'
    )
    
    db.session.add(proposal)
    db.session.commit()
    
    return jsonify({'message': 'Proposal created', 'proposal': proposal.to_dict()}), 201

@proposals_bp.route('/<proposal_id>', methods=['PUT'])
@jwt_required()
def update_proposal(proposal_id):
    user_id = get_jwt_identity()
    proposal = Proposal.query.get(proposal_id)
    
    if not proposal:
        return jsonify({'error': 'Proposal not found'}), 404
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Freelancer can update their own proposal
    if proposal.freelancer_id == user_id:
        allowed_fields = ['amount', 'timeline', 'message']
        for field in allowed_fields:
            if field in data:
                if field == 'amount':
                    proposal.amount = parse_float(data[field], proposal.amount)
                else:
                    setattr(proposal, field, data[field])
        
        db.session.commit()
        return jsonify({'message': 'Proposal updated', 'proposal': proposal.to_dict()}), 200
    
    # Job owner can accept/reject
    job = Job.query.get(proposal.job_id)
    if job and job.owner_id == user_id:
        status = data.get('status')
        if status not in ['accepted', 'rejected']:
            return jsonify({'error': 'Invalid status. Must be "accepted" or "rejected"'}), 400
        
        proposal.status = status
        
        # If accepted, update job status
        if status == 'accepted':
            job.status = 'in_progress'
        
        db.session.commit()
        return jsonify({'message': f'Proposal {status}', 'proposal': proposal.to_dict()}), 200
    
    return jsonify({'error': 'You do not have permission to update this proposal'}), 403

@proposals_bp.route('/<proposal_id>', methods=['DELETE'])
@jwt_required()
def delete_proposal(proposal_id):
    user_id = get_jwt_identity()
    proposal = Proposal.query.get(proposal_id)
    
    if not proposal:
        return jsonify({'error': 'Proposal not found'}), 404
    
    if proposal.freelancer_id != user_id:
        return jsonify({'error': 'You can only delete your own proposals'}), 403
    
    db.session.delete(proposal)
    db.session.commit()
    
    return jsonify({'message': 'Proposal deleted'}), 200
