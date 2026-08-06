from flask import request
from flask_jwt_extended import get_jwt_identity, create_access_token, create_refresh_token
from models.user_model import UserModel
from utils.validators import validate_email, validate_password, validate_name, validate_role
from datetime import datetime
import logging  # Add this import

# Initialize logger
logger = logging.getLogger(__name__)  # Add this line

class UserController:
    """User Controller - Handles all business logic"""
    
    # ============ AUTHENTICATION ============
    
    @staticmethod
    def register_user():
        """Register a new user"""
        data = request.get_json()
        
        # Validate required fields
        required = ['email', 'password', 'name']
        for field in required:
            if not data.get(field):
                return {'error': f'{field} is required'}, 400
        
        # Validate email
        if not validate_email(data['email']):
            return {'error': 'Invalid email format'}, 400
        
        # Validate password
        is_valid, message = validate_password(data['password'])
        if not is_valid:
            return {'error': message}, 400
        
        # Validate name
        is_valid, message = validate_name(data['name'])
        if not is_valid:
            return {'error': message}, 400
        
        # Validate role if provided
        if data.get('role'):
            is_valid, message = validate_role(data['role'])
            if not is_valid:
                return {'error': message}, 400
        
        # Check if user exists
        if UserModel.exists(data['email']):
            return {'error': 'Email already registered'}, 400
        
        # Prepare user data
        user_data = {
            'email': data['email'].lower().strip(),
            'name': data['name'].strip(),
            'role': data.get('role', 'Team Member'),
            'preferences': data.get('preferences', {})
        }
        
        return user_data, 201
    
    @staticmethod
    def login_user():
        """Login user"""
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return {'error': 'Email and password are required'}, 400
        
        user = UserModel.find_by_email(data['email'])
        
        if not user:
            return {'error': 'Invalid credentials'}, 401
        
        # Check if account is locked
        if user.get('locked_until'):
            locked_until = user['locked_until']
            if isinstance(locked_until, datetime):
                if locked_until > datetime.utcnow():
                    remaining = (locked_until - datetime.utcnow()).seconds // 60
                    return {
                        'error': f'Account locked. Try again in {remaining} minutes'
                    }, 401
        
        return user, 200
    
    # ============ PROFILE OPERATIONS ============
    
    @staticmethod
    def get_profile():
        """Get current user profile"""
        user_id = get_jwt_identity()
        user = UserModel.find_by_id(user_id)
        
        if not user:
            return {'error': 'User not found'}, 404
        
        # Remove sensitive fields
        user_dict = UserModel.to_dict(user)
        user_dict.pop('password', None)
        user_dict.pop('login_attempts', None)
        user_dict.pop('locked_until', None)
        
        return user_dict, 200
    
    @staticmethod
    def update_profile():
        """Update user profile"""
        try:
            user_id = get_jwt_identity()
            data = request.get_json()
            
            logger.info(f"Profile update request for user: {user_id}")
            logger.debug(f"Update data: {data}")
            
            user = UserModel.find_by_id(user_id)
            if not user:
                logger.warning(f"User not found: {user_id}")
                return {'error': 'User not found'}, 404
            
            update_data = {}
            
            # Allowed fields to update
            allowed_fields = ['name', 'preferences', 'notification_settings', 'avatar', 'bio', 'phone']
            for field in allowed_fields:
                if field in data:
                    update_data[field] = data[field]
            
            if not update_data:
                logger.info(f"No fields to update for user: {user_id}")
                return {'message': 'No fields to update'}, 200
            
            # Update user
            success = UserModel.update(user_id, update_data)
            
            if success:
                # Get updated user data
                updated_user = UserModel.find_by_id(user_id)
                logger.info(f"Profile updated for user: {user_id}")
                
                # Return the updated user data
                return {
                    'message': 'Profile updated successfully',
                    'updated_fields': list(update_data.keys()),
                    'user': {
                        'id': str(updated_user['_id']),
                        'name': updated_user.get('name'),
                        'email': updated_user.get('email'),
                        'preferences': updated_user.get('preferences', {}),
                        'notification_settings': updated_user.get('notification_settings', {}),
                        'avatar': updated_user.get('avatar'),
                        'bio': updated_user.get('bio'),
                        'phone': updated_user.get('phone'),
                        'created_at': updated_user.get('created_at'),
                        'updated_at': updated_user.get('updated_at')
                    }
                }, 200
            
            logger.error(f"Failed to update profile for user: {user_id}")
            return {'error': 'Failed to update profile'}, 500
            
        except Exception as e:
            logger.error(f"Error in update_profile: {str(e)}", exc_info=True)
            return {'error': f'Failed to update profile: {str(e)}'}, 500

    @staticmethod
    def change_password():
        """Change user password"""
        try:
            user_id = get_jwt_identity()
            data = request.get_json()
            
            logger.info(f"Password change request for user: {user_id}")
            
            if not data.get('current_password') or not data.get('new_password'):
                return {'error': 'Current password and new password are required'}, 400
            
            user = UserModel.find_by_id(user_id)
            
            if not user:
                return {'error': 'User not found'}, 404
            
            # Validate new password
            is_valid, message = validate_password(data['new_password'])
            if not is_valid:
                return {'error': message}, 400
            
            # Verify current password
            from extensions import bcrypt
            if not bcrypt.check_password_hash(user['password'], data['current_password']):
                return {'error': 'Current password is incorrect'}, 401
            
            # Hash new password
            hashed_password = bcrypt.generate_password_hash(data['new_password']).decode('utf-8')
            
            # Update password
            success = UserModel.update(user_id, {'password': hashed_password})
            
            if success:
                logger.info(f"Password changed for user: {user_id}")
                return {'message': 'Password changed successfully'}, 200
            
            return {'error': 'Failed to change password'}, 500
            
        except Exception as e:
            logger.error(f"Error in change_password: {str(e)}", exc_info=True)
            return {'error': f'Failed to change password: {str(e)}'}, 500
    
    # ============ ADMIN OPERATIONS ============
    
    @staticmethod
    def get_all_users():
        """Get all users with pagination"""
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        skip = (page - 1) * per_page
        
        users = UserModel.find_active_users(skip=skip, limit=per_page)
        total = UserModel.count({'is_active': True})
        
        # Remove sensitive fields
        users_list = []
        for user in users:
            user_dict = UserModel.to_dict(user)
            user_dict.pop('password', None)
            user_dict.pop('login_attempts', None)
            user_dict.pop('locked_until', None)
            users_list.append(user_dict)
        
        return {
            'users': users_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        }, 200
    
    @staticmethod
    def get_user_by_id(user_id):
        """Get user by ID"""
        user = UserModel.find_by_id(user_id)
        
        if not user:
            return {'error': 'User not found'}, 404
        
        user_dict = UserModel.to_dict(user)
        user_dict.pop('password', None)
        user_dict.pop('login_attempts', None)
        user_dict.pop('locked_until', None)
        
        return user_dict, 200
    
    @staticmethod
    def update_user_by_admin(user_id):
        """Update user by admin"""
        data = request.get_json()
        
        user = UserModel.find_by_id(user_id)
        if not user:
            return {'error': 'User not found'}, 404
        
        update_data = {}
        
        # Update name
        if data.get('name'):
            is_valid, message = validate_name(data['name'])
            if not is_valid:
                return {'error': message}, 400
            update_data['name'] = data['name'].strip()
        
        # Update role
        if data.get('role'):
            is_valid, message = validate_role(data['role'])
            if not is_valid:
                return {'error': message}, 400
            update_data['role'] = data['role']
        
        # Update active status
        if data.get('is_active') is not None:
            update_data['is_active'] = data['is_active']
        
        if not update_data:
            return {'message': 'No fields to update'}, 200
        
        success = UserModel.update(user_id, update_data)
        
        if success:
            return {
                'message': 'User updated successfully',
                'updated_fields': list(update_data.keys())
            }, 200
        
        return {'error': 'Failed to update user'}, 500
    
    @staticmethod
    def delete_user(user_id):
        """Soft delete user"""
        user = UserModel.find_by_id(user_id)
        
        if not user:
            return {'error': 'User not found'}, 404
        
        success = UserModel.soft_delete(user_id)
        
        if success:
            return {'message': 'User deleted successfully'}, 200
        
        return {'error': 'Failed to delete user'}, 500
    
    @staticmethod
    def hard_delete_user(user_id):
        """Permanently delete user"""
        user = UserModel.find_by_id(user_id)
        
        if not user:
            return {'error': 'User not found'}, 404
        
        success = UserModel.hard_delete(user_id)
        
        if success:
            return {'message': 'User permanently deleted'}, 200
        
        return {'error': 'Failed to delete user'}, 500
    
    @staticmethod
    def get_user_stats():
        """Get user statistics"""
        stats = UserModel.get_user_stats()
        return stats, 200
    
    # ============ TOKEN OPERATIONS ============
    
    @staticmethod
    def refresh_token():
        """Refresh access token"""
        user_id = get_jwt_identity()
        user = UserModel.find_by_id(user_id)
        
        if not user:
            return {'error': 'User not found'}, 404
        
        access_token = create_access_token(identity=str(user['_id']))
        return {'access_token': access_token}, 200
    
    @staticmethod
    def logout():
        """Logout user"""
        return {'message': 'Logged out successfully'}, 200