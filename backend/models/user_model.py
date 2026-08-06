from datetime import datetime
from bson import ObjectId
from database import get_collection

class UserModel:
    """User Model - Complete CRUD operations"""
    collection_name = 'users'
    
    @classmethod
    def get_collection(cls):
        """Get the users collection"""
        return get_collection(cls.collection_name)
    
    # ============ CREATE OPERATIONS ============
    
    @classmethod
    def create(cls, user_data):
        """Create a new user"""
        # Add default values
        user_data['created_at'] = datetime.utcnow()
        user_data['updated_at'] = datetime.utcnow()
        user_data['is_active'] = True
        user_data['login_attempts'] = 0
        user_data['locked_until'] = None
        user_data['role'] = user_data.get('role', 'Team Member')
        user_data['preferences'] = user_data.get('preferences', {})
        user_data['avatar'] = user_data.get('avatar', None)
        
        result = cls.get_collection().insert_one(user_data)
        return str(result.inserted_id)
    
    # ============ READ OPERATIONS ============
    
    @classmethod
    def find_by_id(cls, user_id):
        """Find user by ID"""
        try:
            return cls.get_collection().find_one({'_id': ObjectId(user_id)})
        except:
            return None
    
    @classmethod
    def find_by_email(cls, email):
        """Find user by email (active only)"""
        return cls.get_collection().find_one({
            'email': email.lower().strip(),
            'is_active': True
        })
    
    @classmethod
    def find_by_email_including_inactive(cls, email):
        """Find user by email including inactive"""
        return cls.get_collection().find_one({
            'email': email.lower().strip()
        })
    
    @classmethod
    def find_all(cls, filter_query=None, skip=0, limit=100, sort=None):
        """Find multiple users"""
        if filter_query is None:
            filter_query = {}
        
        cursor = cls.get_collection().find(filter_query).skip(skip).limit(limit)
        
        if sort:
            cursor = cursor.sort(sort)
        
        return list(cursor)
    
    @classmethod
    def find_active_users(cls, skip=0, limit=100):
        """Find all active users"""
        return cls.find_all(
            filter_query={'is_active': True},
            skip=skip,
            limit=limit,
            sort=[('created_at', -1)]
        )
    
    @classmethod
    def count(cls, filter_query=None):
        """Count users"""
        if filter_query is None:
            filter_query = {}
        return cls.get_collection().count_documents(filter_query)
    
    @classmethod
    def get_user_stats(cls):
        """Get user statistics"""
        total = cls.count({'is_active': True})
        by_role = cls.get_collection().aggregate([
            {'$match': {'is_active': True}},
            {'$group': {'_id': '$role', 'count': {'$sum': 1}}}
        ])
        return {
            'total_active_users': total,
            'roles': list(by_role)
        }
    
    @classmethod
    def exists(cls, email):
        """Check if user exists"""
        return cls.find_by_email(email) is not None
    
    # ============ UPDATE OPERATIONS ============
    
    @classmethod
    def update(cls, user_id, update_data):
        """Update user data"""
        update_data['updated_at'] = datetime.utcnow()
        result = cls.get_collection().update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    @classmethod
    def update_profile(cls, user_id, update_data):
        """Update user profile (allowed fields only)"""
        allowed_fields = ['name', 'avatar', 'preferences']
        filtered_data = {k: v for k, v in update_data.items() if k in allowed_fields}
        
        if not filtered_data:
            return False
        
        return cls.update(user_id, filtered_data)
    
    @classmethod
    def update_password(cls, user_id, new_password):
        """Update user password"""
        return cls.update(user_id, {'password': new_password})
    
    @classmethod
    def update_role(cls, user_id, role):
        """Update user role"""
        return cls.update(user_id, {'role': role})
    
    @classmethod
    def increment_login_attempts(cls, email):
        """Increment login attempts"""
        cls.get_collection().update_one(
            {'email': email.lower().strip()},
            {'$inc': {'login_attempts': 1}}
        )
    
    @classmethod
    def reset_login_attempts(cls, email):
        """Reset login attempts"""
        cls.get_collection().update_one(
            {'email': email.lower().strip()},
            {'$set': {'login_attempts': 0, 'locked_until': None}}
        )
    
    @classmethod
    def lock_account(cls, email, minutes=15):
        """Lock user account"""
        from datetime import timedelta
        locked_until = datetime.utcnow() + timedelta(minutes=minutes)
        cls.get_collection().update_one(
            {'email': email.lower().strip()},
            {'$set': {'locked_until': locked_until}}
        )
    
    # ============ DELETE OPERATIONS ============
    
    @classmethod
    def soft_delete(cls, user_id):
        """Soft delete user (set inactive)"""
        return cls.update(user_id, {'is_active': False})
    
    @classmethod
    def hard_delete(cls, user_id):
        """Permanently delete user"""
        result = cls.get_collection().delete_one({'_id': ObjectId(user_id)})
        return result.deleted_count > 0
    
    @classmethod
    def delete_by_email(cls, email):
        """Delete user by email"""
        result = cls.get_collection().delete_one({'email': email.lower().strip()})
        return result.deleted_count > 0
    
    # ============ UTILITY METHODS ============
    
    @staticmethod
    def to_dict(user):
        """Convert MongoDB document to dict with string ID"""
        if not user:
            return None
        user_dict = dict(user)
        if '_id' in user_dict:
            user_dict['_id'] = str(user_dict['_id'])
        return user_dict
    
    @staticmethod
    def to_list(users):
        """Convert multiple users to list of dicts"""
        return [UserModel.to_dict(user) for user in users]
    
    @classmethod
    def get_schema(cls):
        """Return the user schema definition"""
        return {
            'email': {'type': 'string', 'required': True, 'unique': True},
            'password': {'type': 'string', 'required': True},
            'name': {'type': 'string', 'required': True},
            'role': {'type': 'string', 'default': 'Team Member'},
            'avatar': {'type': 'string', 'default': None},
            'preferences': {'type': 'dict', 'default': {}},
            'is_active': {'type': 'bool', 'default': True},
            'login_attempts': {'type': 'int', 'default': 0},
            'locked_until': {'type': 'datetime', 'default': None},
            'created_at': {'type': 'datetime'},
            'updated_at': {'type': 'datetime'}
        }