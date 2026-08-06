# from flask import Blueprint, jsonify
# from flask_jwt_extended import jwt_required
# from controllers.task_controller import TaskController

# task_bp = Blueprint('tasks', __name__)

# @task_bp.route('/', methods=['GET'])
# @jwt_required()
# def get_tasks():
#     """Get all tasks with filters"""
#     result, status = TaskController.get_all_tasks()
#     return jsonify(result), status

# @task_bp.route('/', methods=['POST'])
# @jwt_required()
# def create_task():
#     """Create a new task"""
#     result, status = TaskController.create_task()
#     return jsonify(result), status

# @task_bp.route('/my-tasks', methods=['GET'])
# @jwt_required()
# def get_my_tasks():
#     """Get tasks assigned to current user"""
#     result, status = TaskController.get_my_tasks()
#     return jsonify(result), status

# @task_bp.route('/stats', methods=['GET'])
# @jwt_required()
# def get_task_stats():
#     """Get task statistics"""
#     result, status = TaskController.get_task_stats()
#     return jsonify(result), status

# @task_bp.route('/<task_id>', methods=['GET'])
# @jwt_required()
# def get_task(task_id):
#     """Get a single task"""
#     result, status = TaskController.get_task(task_id)
#     return jsonify(result), status

# @task_bp.route('/<task_id>', methods=['PUT'])
# @jwt_required()
# def update_task(task_id):
#     """Update a task"""
#     result, status = TaskController.update_task(task_id)
#     return jsonify(result), status

# @task_bp.route('/<task_id>', methods=['DELETE'])
# @jwt_required()
# def delete_task(task_id):
#     """Delete a task"""
#     result, status = TaskController.delete_task(task_id)
#     return jsonify(result), status

# @task_bp.route('/<task_id>/status', methods=['PATCH'])
# @jwt_required()
# def update_task_status(task_id):
#     """Update task status"""
#     result, status = TaskController.update_task_status(task_id)
#     return jsonify(result), status

# @task_bp.route('/<task_id>/assign', methods=['PATCH'])
# @jwt_required()
# def assign_task(task_id):
#     """Assign task to a user"""
#     result, status = TaskController.assign_task(task_id)
#     return jsonify(result), status

# @task_bp.route('/<task_id>/comments', methods=['POST'])
# @jwt_required()
# def add_comment(task_id):
#     """Add a comment to task"""
#     result, status = TaskController.add_comment(task_id)
#     return jsonify(result), status

# @task_bp.route('/<task_id>/time', methods=['PATCH'])
# @jwt_required()
# def update_time(task_id):
#     """Update time spent on task"""
#     result, status = TaskController.update_time_spent(task_id)
#     return jsonify(result), status

# @task_bp.route('/project/<project_id>', methods=['GET'])
# @jwt_required()
# def get_tasks_by_project(project_id):
#     """Get all tasks in a project"""
#     result, status = TaskController.get_tasks_by_project(project_id)
#     return jsonify(result), status




from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from controllers.task_controller import TaskController

task_bp = Blueprint('tasks', __name__)

# Handle OPTIONS requests for CORS
@task_bp.route('/', methods=['OPTIONS'])
@task_bp.route('/<task_id>', methods=['OPTIONS'])
@task_bp.route('/<task_id>/status', methods=['OPTIONS'])
@task_bp.route('/<task_id>/assign', methods=['OPTIONS'])
@task_bp.route('/<task_id>/comments', methods=['OPTIONS'])
@task_bp.route('/<task_id>/time', methods=['OPTIONS'])
@task_bp.route('/project/<project_id>', methods=['OPTIONS'])
def handle_options(task_id=None, project_id=None):
    """Handle OPTIONS requests for CORS preflight"""
    from flask import make_response
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Max-Age', '86400')
    return response

@task_bp.route('/', methods=['GET'])
@jwt_required()
def get_tasks():
    """Get all tasks with filters"""
    result, status = TaskController.get_all_tasks()
    return jsonify(result), status

@task_bp.route('/', methods=['POST'])
@jwt_required()
def create_task():
    """Create a new task"""
    result, status = TaskController.create_task()
    return jsonify(result), status

@task_bp.route('/my-tasks', methods=['GET'])
@jwt_required()
def get_my_tasks():
    """Get tasks assigned to current user"""
    result, status = TaskController.get_my_tasks()
    return jsonify(result), status

@task_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_task_stats():
    """Get task statistics"""
    result, status = TaskController.get_task_stats()
    return jsonify(result), status

@task_bp.route('/<task_id>', methods=['GET'])
@jwt_required()
def get_task(task_id):
    """Get a single task"""
    result, status = TaskController.get_task(task_id)
    return jsonify(result), status

@task_bp.route('/<task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    """Update a task"""
    result, status = TaskController.update_task(task_id)
    return jsonify(result), status

@task_bp.route('/<task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    """Delete a task"""
    result, status = TaskController.delete_task(task_id)
    return jsonify(result), status

@task_bp.route('/<task_id>/status', methods=['PATCH'])
@jwt_required()
def update_task_status(task_id):
    """Update task status"""
    result, status = TaskController.update_task_status(task_id)
    return jsonify(result), status

@task_bp.route('/<task_id>/assign', methods=['PATCH', 'POST'])
@jwt_required()
def assign_task(task_id):
    """Assign task to a user"""
    result, status = TaskController.assign_task(task_id)
    return jsonify(result), status

@task_bp.route('/<task_id>/comments', methods=['POST'])
@jwt_required()
def add_comment(task_id):
    """Add a comment to task"""
    result, status = TaskController.add_comment(task_id)
    return jsonify(result), status

@task_bp.route('/<task_id>/time', methods=['PATCH'])
@jwt_required()
def update_time(task_id):
    """Update time spent on task"""
    result, status = TaskController.update_time_spent(task_id)
    return jsonify(result), status

@task_bp.route('/project/<project_id>', methods=['GET'])
@jwt_required()
def get_tasks_by_project(project_id):
    """Get all tasks in a project"""
    result, status = TaskController.get_tasks_by_project(project_id)
    return jsonify(result), status