from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from .database import db
import json

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(50), primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'freelancer' or 'client'
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    role_title = db.Column(db.String(100), nullable=False)
    company = db.Column(db.String(100))
    category = db.Column(db.String(50), nullable=False)
    location = db.Column(db.String(100), nullable=False)
    bio = db.Column(db.Text)
    skills = db.Column(db.Text, default='[]')  # JSON array
    hourly_rate = db.Column(db.Float, default=0)
    verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    jobs = db.relationship('Job', backref='owner', lazy='dynamic')
    proposals = db.relationship('Proposal', foreign_keys='Proposal.freelancer_id', backref='freelancer', lazy='dynamic')
    received_proposals = db.relationship('Proposal', foreign_keys='Proposal.job_id', viewonly=True)
    sent_messages = db.relationship('Message', foreign_keys='Message.from_user_id', backref='sender', lazy='dynamic')
    received_messages = db.relationship('Message', foreign_keys='Message.to_user_id', backref='recipient', lazy='dynamic')
    given_reviews = db.relationship('Review', foreign_keys='Review.author_id', backref='author', lazy='dynamic')
    received_reviews = db.relationship('Review', foreign_keys='Review.target_id', backref='target', lazy='dynamic')
    
    @property
    def skills_list(self):
        return json.loads(self.skills) if self.skills else []
    
    @skills_list.setter
    def skills_list(self, value):
        self.skills = json.dumps(value)
    
    def to_dict(self, include_sensitive=False):
        data = {
            'id': self.id,
            'email': self.email if include_sensitive else None,
            'role': self.role,
            'firstName': self.first_name,
            'lastName': self.last_name,
            'roleTitle': self.role_title,
            'company': self.company,
            'category': self.category,
            'location': self.location,
            'bio': self.bio,
            'skills': self.skills_list,
            'hourlyRate': self.hourly_rate,
            'verified': self.verified,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }
        return {k: v for k, v in data.items() if v is not None}
    
    def __repr__(self):
        return f'<User {self.email}>'


class Job(db.Model):
    __tablename__ = 'jobs'
    
    id = db.Column(db.String(50), primary_key=True)
    owner_id = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(50), nullable=False, index=True)
    subcategory = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(20), nullable=False)  # 'fixed' or 'hourly'
    budget = db.Column(db.Float, nullable=False)
    location = db.Column(db.String(100), nullable=False)
    remote = db.Column(db.String(20), nullable=False)  # 'remote', 'onsite', 'hybrid'
    skills = db.Column(db.Text, default='[]')  # JSON array
    deadline = db.Column(db.String(20))
    status = db.Column(db.String(20), default='open', index=True)  # 'open', 'in_progress', 'completed', 'closed'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    proposals = db.relationship('Proposal', backref='job', lazy='dynamic')
    reviews = db.relationship('Review', backref='job', lazy='dynamic')
    
    @property
    def skills_list(self):
        return json.loads(self.skills) if self.skills else []
    
    @skills_list.setter
    def skills_list(self, value):
        self.skills = json.dumps(value)
    
    def to_dict(self):
        return {
            'id': self.id,
            'ownerId': self.owner_id,
            'title': self.title,
            'category': self.category,
            'subcategory': self.subcategory,
            'description': self.description,
            'type': self.type,
            'budget': self.budget,
            'location': self.location,
            'remote': self.remote,
            'skills': self.skills_list,
            'deadline': self.deadline,
            'status': self.status,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Job {self.title}>'


class Proposal(db.Model):
    __tablename__ = 'proposals'
    
    id = db.Column(db.String(50), primary_key=True)
    job_id = db.Column(db.String(50), db.ForeignKey('jobs.id'), nullable=False, index=True)
    freelancer_id = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=False, index=True)
    amount = db.Column(db.Float, nullable=False)
    timeline = db.Column(db.String(100))
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='pending', index=True)  # 'pending', 'accepted', 'rejected'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        db.UniqueConstraint('job_id', 'freelancer_id', name='unique_proposal'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'jobId': self.job_id,
            'freelancerId': self.freelancer_id,
            'amount': self.amount,
            'timeline': self.timeline,
            'message': self.message,
            'status': self.status,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Proposal {self.id}>'


class Message(db.Model):
    __tablename__ = 'messages'
    
    id = db.Column(db.String(50), primary_key=True)
    from_user_id = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=False, index=True)
    to_user_id = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=False, index=True)
    text = db.Column(db.Text, nullable=False)
    read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'from': self.from_user_id,
            'to': self.to_user_id,
            'text': self.text,
            'read': self.read,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Message {self.id}>'


class Review(db.Model):
    __tablename__ = 'reviews'
    
    id = db.Column(db.String(50), primary_key=True)
    target_id = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=False, index=True)
    author_id = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=False, index=True)
    job_id = db.Column(db.String(50), db.ForeignKey('jobs.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'targetId': self.target_id,
            'authorId': self.author_id,
            'jobId': self.job_id,
            'rating': self.rating,
            'text': self.text,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Review {self.id}>'
