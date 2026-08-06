# routes/project_routes.py
from flask import Blueprint, jsonify, request, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from controllers.project_controller import ProjectController
import logging

logger = logging.getLogger(__name__)

project_bp = Blueprint('projects', __name__)

# Handle OPTIONS requests for CORS preflight
@project_bp.route('/', methods=['OPTIONS'])
@project_bp.route('/<project_id>', methods=['OPTIONS'])
@project_bp.route('/<project_id>/status', methods=['OPTIONS'])
@project_bp.route('/<project_id>/stats', methods=['OPTIONS'])
@project_bp.route('/<project_id>/members', methods=['OPTIONS'])
@project_bp.route('/<project_id>/members/<member_id>', methods=['OPTIONS'])
def handle_options(project_id=None, member_id=None):
    """Handle OPTIONS requests for CORS preflight"""
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Max-Age', '86400')
    return response

# ============ PROJECT CRUD ROUTES ============

@project_bp.route('/', methods=['GET'])
@jwt_required()
def get_projects():
    """Get all projects"""
    logger.info(f"GET /projects - Request received")
    result, status = ProjectController.get_all_projects()
    return jsonify(result), status

@project_bp.route('/', methods=['POST'])
@jwt_required()
def create_project():
    """Create a new project"""
    logger.info("POST /projects - Request received")
    result, status = ProjectController.create_project()
    return jsonify(result), status

@project_bp.route('/<project_id>', methods=['GET'])
@jwt_required()
def get_project(project_id):
    """Get a single project"""
    logger.info(f"GET /projects/{project_id} - Request received")
    result, status = ProjectController.get_project(project_id)
    return jsonify(result), status

@project_bp.route('/<project_id>', methods=['PUT'])
@jwt_required()
def update_project(project_id):
    """Update a project"""
    logger.info(f"PUT /projects/{project_id} - Request received")
    result, status = ProjectController.update_project(project_id)
    return jsonify(result), status

@project_bp.route('/<project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    """Delete a project"""
    logger.info(f"DELETE /projects/{project_id} - Request received")
    result, status = ProjectController.delete_project(project_id)
    return jsonify(result), status

@project_bp.route('/<project_id>/status', methods=['PATCH'])
@jwt_required()
def update_project_status(project_id):
    """Update project status"""
    logger.info(f"PATCH /projects/{project_id}/status - Request received")
    result, status = ProjectController.update_project_status(project_id)
    return jsonify(result), status

@project_bp.route('/<project_id>/stats', methods=['GET'])
@jwt_required()
def get_project_stats(project_id):
    """Get project statistics"""
    logger.info(f"GET /projects/{project_id}/stats - Request received")
    result, status = ProjectController.get_project_stats(project_id)
    return jsonify(result), status

# ============ MEMBER MANAGEMENT ROUTES ============

@project_bp.route('/<project_id>/members', methods=['GET'])
@jwt_required()
def get_project_members(project_id):
    """Get all project members with details"""
    logger.info(f"GET /projects/{project_id}/members - Request received")
    result, status = ProjectController.get_project_members(project_id)
    return jsonify(result), status

@project_bp.route('/<project_id>/members', methods=['POST'])
@jwt_required()
def add_project_member(project_id):
    """Add a member to project (can be user ID or full member details)"""
    logger.info(f"POST /projects/{project_id}/members - Request received")
    logger.info(f"Request data: {request.json}")
    result, status = ProjectController.add_member(project_id)
    logger.info(f"Response status: {status}")
    return jsonify(result), status

@project_bp.route('/<project_id>/members/<member_id>', methods=['PUT'])
@jwt_required()
def update_project_member(project_id, member_id):
    """Update a project member's details"""
    logger.info(f"PUT /projects/{project_id}/members/{member_id} - Request received")
    result, status = ProjectController.update_member(project_id, member_id)
    return jsonify(result), status

@project_bp.route('/<project_id>/members/<member_id>', methods=['DELETE'])
@jwt_required()
def remove_project_member(project_id, member_id):
    """Remove a member from project"""
    logger.info(f"DELETE /projects/{project_id}/members/{member_id} - Request received")
    result, status = ProjectController.remove_member(project_id, member_id)
    return jsonify(result), status