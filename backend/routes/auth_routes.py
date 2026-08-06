from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token, create_refresh_token
from extensions import bcrypt
from models.user_model import UserModel
from controllers.user_controller import UserController

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    result, status = UserController.register_user()
    if status != 201:
        return jsonify(result), status
    
    password = request.get_json()['password']
    hashed = bcrypt.generate_password_hash(password).decode('utf-8')
    result['password'] = hashed
    
    try:
        user_id = UserModel.create(result)
        return jsonify({
            'message': 'User registered successfully',
            'user_id': user_id,
            'user': {
                'id': user_id,
                'email': result['email'],
                'name': result['name']
            }
        }), 201
    except Exception as e:
        return jsonify({'error': 'Registration failed. Please try again.'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    result, status = UserController.login_user()
    if status != 200:
        return jsonify(result), status
    
    user = result
    password = request.get_json()['password']
    
    if not bcrypt.check_password_hash(user['password'], password):
        UserModel.increment_login_attempts(user['email'])
        updated_user = UserModel.find_by_email(user['email'])
        if updated_user and updated_user.get('login_attempts', 0) >= 5:
            UserModel.lock_account(user['email'])
            return jsonify({
                'error': 'Account locked. Try again in 15 minutes.'
            }), 401
        return jsonify({'error': 'Invalid credentials'}), 401
    
    UserModel.reset_login_attempts(user['email'])
    
    access_token = create_access_token(identity=str(user['_id']))
    refresh_token = create_refresh_token(identity=str(user['_id']))
    
    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': {
            'id': str(user['_id']),
            'email': user['email'],
            'name': user['name'],
            'role': user.get('role', 'Team Member')
        }
    }), 200

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data.get('current_password') or not data.get('new_password'):
        return jsonify({'error': 'Current password and new password are required'}), 400
    
    user = UserModel.find_by_id(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if not bcrypt.check_password_hash(user['password'], data['current_password']):
        return jsonify({'error': 'Current password is incorrect'}), 401
    
    if len(data['new_password']) < 8:
        return jsonify({'error': 'New password must be at least 8 characters'}), 400
    
    hashed_password = bcrypt.generate_password_hash(data['new_password']).decode('utf-8')
    UserModel.update(user_id, {'password': hashed_password})
    
    return jsonify({'message': 'Password changed successfully'}), 200

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    result, status = UserController.get_profile()
    return jsonify(result), status

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    result, status = UserController.update_profile()
    return jsonify(result), status

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    result, status = UserController.refresh_token()
    return jsonify(result), status

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user"""
    result, status = UserController.logout()
    return jsonify(result), status

@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    """Get all users (admin only)"""
    result, status = UserController.get_all_users()
    return jsonify(result), status