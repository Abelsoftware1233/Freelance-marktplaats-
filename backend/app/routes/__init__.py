from flask import Blueprint

# Create blueprints
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
users_bp = Blueprint('users', __name__, url_prefix='/api/users')
jobs_bp = Blueprint('jobs', __name__, url_prefix='/api/jobs')
proposals_bp = Blueprint('proposals', __name__, url_prefix='/api/proposals')
messages_bp = Blueprint('messages', __name__, url_prefix='/api/messages')
reviews_bp = Blueprint('reviews', __name__, url_prefix='/api/reviews')

# Import routes (to register them)
from . import auth_routes, user_routes, job_routes, proposal_routes, message_routes, review_routes
