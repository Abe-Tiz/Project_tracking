# from datetime import datetime
# from bson import ObjectId
# from database import get_collection

# class TaskModel:
#     """Task Model - Complete CRUD operations"""
#     collection_name = 'tasks'
    
#     @classmethod
#     def get_collection(cls):
#         """Get the tasks collection"""
#         return get_collection(cls.collection_name)
    
#     # ============ CREATE ============
#     @classmethod
#     def create(cls, task_data):
#         """Create a new task"""
#         task_data['created_at'] = datetime.utcnow()
#         task_data['updated_at'] = datetime.utcnow()
#         task_data['status'] = task_data.get('status', 'Todo')
#         task_data['priority'] = task_data.get('priority', 'Medium')
#         task_data['comments'] = task_data.get('comments', [])
#         task_data['attachments'] = task_data.get('attachments', [])
#         task_data['time_spent'] = task_data.get('time_spent', 0)
        
#         result = cls.get_collection().insert_one(task_data)
#         task_id = str(result.inserted_id)
        
#         # Update project task counts
#         if task_data.get('project_id'):
#             from models.project_model import ProjectModel
#             ProjectModel.update_task_counts(task_data['project_id'])
        
#         return task_id
    
#     # ============ READ ============
#     @classmethod
#     def find_by_id(cls, task_id):
#         """Find task by ID"""
#         try:
#             return cls.get_collection().find_one({'_id': ObjectId(task_id)})
#         except:
#             return None
    
#     @classmethod
#     def find_by_project(cls, project_id):
#         """Find tasks by project"""
#         return list(cls.get_collection().find({'project_id': project_id}))
    
#     @classmethod
#     def find_by_assignee(cls, user_id):
#         """Find tasks assigned to user"""
#         return list(cls.get_collection().find({'assigned_to': user_id}))
    
#     @classmethod
#     def find_by_status(cls, status, project_id=None):
#         """Find tasks by status"""
#         filter_query = {'status': status}
#         if project_id:
#             filter_query['project_id'] = project_id
#         return list(cls.get_collection().find(filter_query))
    
#     @classmethod
#     def find_all(cls, filter_query=None, skip=0, limit=100, sort=None):
#         """Find multiple tasks"""
#         if filter_query is None:
#             filter_query = {}
        
#         cursor = cls.get_collection().find(filter_query).skip(skip).limit(limit)
        
#         if sort:
#             cursor = cursor.sort(sort)
        
#         return list(cursor)
    
#     @classmethod
#     def count(cls, filter_query=None):
#         """Count tasks"""
#         if filter_query is None:
#             filter_query = {}
#         return cls.get_collection().count_documents(filter_query)
    
#     # ============ UPDATE ============
#     @classmethod
#     def update(cls, task_id, update_data):
#         """Update task"""
#         update_data['updated_at'] = datetime.utcnow()
#         result = cls.get_collection().update_one(
#             {'_id': ObjectId(task_id)},
#             {'$set': update_data}
#         )
        
#         if result.modified_count > 0:
#             # Update project task counts if status changed
#             task = cls.find_by_id(task_id)
#             if task and task.get('project_id'):
#                 from models.project_model import ProjectModel
#                 ProjectModel.update_task_counts(task['project_id'])
        
#         return result.modified_count > 0
    
#     @classmethod
#     def update_status(cls, task_id, status):
#         """Update task status"""
#         return cls.update(task_id, {'status': status})
    
#     @classmethod
#     def assign_task(cls, task_id, user_id):
#         """Assign task to user"""
#         return cls.update(task_id, {'assigned_to': user_id})
    
#     @classmethod
#     def add_comment(cls, task_id, comment_data):
#         """Add a comment to task"""
#         comment_data['created_at'] = datetime.utcnow()
#         result = cls.get_collection().update_one(
#             {'_id': ObjectId(task_id)},
#             {'$push': {'comments': comment_data}}
#         )
#         return result.modified_count > 0
    
#     @classmethod
#     def add_attachment(cls, task_id, attachment_data):
#         """Add an attachment to task"""
#         attachment_data['uploaded_at'] = datetime.utcnow()
#         result = cls.get_collection().update_one(
#             {'_id': ObjectId(task_id)},
#             {'$push': {'attachments': attachment_data}}
#         )
#         return result.modified_count > 0
    
#     @classmethod
#     def update_time_spent(cls, task_id, hours):
#         """Update time spent on task"""
#         return cls.update(task_id, {'time_spent': hours})
    
#     # ============ DELETE ============
#     @classmethod
#     def delete(cls, task_id):
#         """Delete a task"""
#         task = cls.find_by_id(task_id)
#         result = cls.get_collection().delete_one({'_id': ObjectId(task_id)})
        
#         if result.deleted_count > 0 and task and task.get('project_id'):
#             from models.project_model import ProjectModel
#             ProjectModel.update_task_counts(task['project_id'])
        
#         return result.deleted_count > 0
    
#     @classmethod
#     def delete_by_project(cls, project_id):
#         """Delete all tasks in a project"""
#         result = cls.get_collection().delete_many({'project_id': project_id})
#         return result.deleted_count
    
#     # ============ UTILITY ============
#     @staticmethod
#     def to_dict(task):
#         """Convert MongoDB document to dict"""
#         if not task:
#             return None
#         task_dict = dict(task)
#         if '_id' in task_dict:
#             task_dict['_id'] = str(task_dict['_id'])
#         return task_dict
    
#     @staticmethod
#     def to_list(tasks):
#         """Convert multiple tasks to list"""
#         return [TaskModel.to_dict(t) for t in tasks]


















from datetime import datetime
from bson import ObjectId
from database import get_collection

class TaskModel:
    """Task Model - Complete CRUD operations"""
    collection_name = 'tasks'
    
    @classmethod
    def get_collection(cls):
        """Get the tasks collection"""
        return get_collection(cls.collection_name)
    
    # ============ CREATE ============
    @classmethod
    def create(cls, task_data):
        """Create a new task"""
        task_data['created_at'] = datetime.utcnow()
        task_data['updated_at'] = datetime.utcnow()
        task_data['status'] = task_data.get('status', 'Todo')
        task_data['priority'] = task_data.get('priority', 'Medium')
        task_data['comments'] = task_data.get('comments', [])
        task_data['attachments'] = task_data.get('attachments', [])
        task_data['links'] = task_data.get('links', [])
        task_data['labels'] = task_data.get('labels', [])
        task_data['subtasks'] = task_data.get('subtasks', [])
        task_data['time_spent'] = task_data.get('time_spent', 0)
        
        # Ensure labels is a list of strings, not null
        if task_data['labels'] is None:
            task_data['labels'] = []
        
        result = cls.get_collection().insert_one(task_data)
        task_id = str(result.inserted_id)
        
        # Update project task counts
        if task_data.get('project_id'):
            from models.project_model import ProjectModel
            ProjectModel.update_task_counts(task_data['project_id'])
        
        return task_id
    
    # ============ READ ============
    @classmethod
    def find_by_id(cls, task_id):
        """Find task by ID"""
        try:
            return cls.get_collection().find_one({'_id': ObjectId(task_id)})
        except:
            return None
    
    @classmethod
    def find_by_project(cls, project_id):
        """Find tasks by project"""
        return list(cls.get_collection().find({'project_id': project_id}))
    
    @classmethod
    def find_by_assignee(cls, user_id):
        """Find tasks assigned to user"""
        return list(cls.get_collection().find({'assigned_to': user_id}))
    
    @classmethod
    def find_by_status(cls, status, project_id=None):
        """Find tasks by status"""
        filter_query = {'status': status}
        if project_id:
            filter_query['project_id'] = project_id
        return list(cls.get_collection().find(filter_query))
    
    @classmethod
    def find_all(cls, filter_query=None, skip=0, limit=100, sort=None):
        """Find multiple tasks"""
        if filter_query is None:
            filter_query = {}
        
        cursor = cls.get_collection().find(filter_query).skip(skip).limit(limit)
        
        if sort:
            cursor = cursor.sort(sort)
        
        return list(cursor)
    
    @classmethod
    def count(cls, filter_query=None):
        """Count tasks"""
        if filter_query is None:
            filter_query = {}
        return cls.get_collection().count_documents(filter_query)
    
    # ============ UPDATE ============
    @classmethod
    def update(cls, task_id, update_data):
        """Update task"""
        update_data['updated_at'] = datetime.utcnow()
        
        # Ensure labels is properly handled
        if 'labels' in update_data and update_data['labels'] is None:
            update_data['labels'] = []
        
        # Ensure attachments is properly handled
        if 'attachments' in update_data and update_data['attachments'] is None:
            update_data['attachments'] = []
        
        # Ensure links is properly handled
        if 'links' in update_data and update_data['links'] is None:
            update_data['links'] = []
        
        # Ensure subtasks is properly handled
        if 'subtasks' in update_data and update_data['subtasks'] is None:
            update_data['subtasks'] = []
        
        result = cls.get_collection().update_one(
            {'_id': ObjectId(task_id)},
            {'$set': update_data}
        )
        
        if result.modified_count > 0:
            # Update project task counts if status changed
            task = cls.find_by_id(task_id)
            if task and task.get('project_id'):
                from models.project_model import ProjectModel
                ProjectModel.update_task_counts(task['project_id'])
        
        return result.modified_count > 0
    
    @classmethod
    def update_status(cls, task_id, status):
        """Update task status"""
        return cls.update(task_id, {'status': status})
    
    @classmethod
    def assign_task(cls, task_id, user_id):
        """Assign task to user"""
        # Get user name
        from models.user_model import UserModel
        user = UserModel.find_by_id(user_id) if user_id else None
        user_name = user.get('name', 'Unknown') if user else ''
        
        update_data = {
            'assigned_to': user_id,
            'assigned_to_name': user_name
        }
        return cls.update(task_id, update_data)
    
    @classmethod
    def add_comment(cls, task_id, comment_data):
        """Add a comment to task"""
        comment_data['created_at'] = datetime.utcnow()
        result = cls.get_collection().update_one(
            {'_id': ObjectId(task_id)},
            {'$push': {'comments': comment_data}}
        )
        return result.modified_count > 0
    
    @classmethod
    def add_attachment(cls, task_id, attachment_data):
        """Add an attachment to task"""
        attachment_data['uploaded_at'] = datetime.utcnow()
        result = cls.get_collection().update_one(
            {'_id': ObjectId(task_id)},
            {'$push': {'attachments': attachment_data}}
        )
        return result.modified_count > 0
    
    @classmethod
    def add_link(cls, task_id, link_data):
        """Add a link to task"""
        result = cls.get_collection().update_one(
            {'_id': ObjectId(task_id)},
            {'$push': {'links': link_data}}
        )
        return result.modified_count > 0
    
    @classmethod
    def add_label(cls, task_id, label):
        """Add a label to task"""
        result = cls.get_collection().update_one(
            {'_id': ObjectId(task_id)},
            {'$addToSet': {'labels': label}}
        )
        return result.modified_count > 0
    
    @classmethod
    def remove_label(cls, task_id, label):
        """Remove a label from task"""
        result = cls.get_collection().update_one(
            {'_id': ObjectId(task_id)},
            {'$pull': {'labels': label}}
        )
        return result.modified_count > 0
    
    @classmethod
    def update_time_spent(cls, task_id, hours):
        """Update time spent on task"""
        return cls.update(task_id, {'time_spent': hours})
    
    # ============ DELETE ============
    @classmethod
    def delete(cls, task_id):
        """Delete a task"""
        task = cls.find_by_id(task_id)
        result = cls.get_collection().delete_one({'_id': ObjectId(task_id)})
        
        if result.deleted_count > 0 and task and task.get('project_id'):
            from models.project_model import ProjectModel
            ProjectModel.update_task_counts(task['project_id'])
        
        return result.deleted_count > 0
    
    @classmethod
    def delete_by_project(cls, project_id):
        """Delete all tasks in a project"""
        result = cls.get_collection().delete_many({'project_id': project_id})
        return result.deleted_count
    
    # ============ UTILITY ============
    @staticmethod
    def to_dict(task):
        """Convert MongoDB document to dict with populated user names"""
        if not task:
            return None
        task_dict = dict(task)
        if '_id' in task_dict:
            task_dict['_id'] = str(task_dict['_id'])
        
        # Populate assigned_to_name if not present
        if task_dict.get('assigned_to') and not task_dict.get('assigned_to_name'):
            from models.user_model import UserModel
            user = UserModel.find_by_id(task_dict['assigned_to'])
            if user:
                task_dict['assigned_to_name'] = user.get('name', 'Unknown')
        
        # Ensure labels is a list
        if 'labels' not in task_dict or task_dict['labels'] is None:
            task_dict['labels'] = []
        
        # Ensure attachments is a list
        if 'attachments' not in task_dict or task_dict['attachments'] is None:
            task_dict['attachments'] = []
        
        # Ensure links is a list
        if 'links' not in task_dict or task_dict['links'] is None:
            task_dict['links'] = []
        
        # Ensure subtasks is a list
        if 'subtasks' not in task_dict or task_dict['subtasks'] is None:
            task_dict['subtasks'] = []
        
        return task_dict
    
    @staticmethod
    def to_list(tasks):
        """Convert multiple tasks to list"""
        return [TaskModel.to_dict(t) for t in tasks]