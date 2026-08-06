# models/project_model.py
from datetime import datetime
from bson import ObjectId
from database import get_collection
import logging

logger = logging.getLogger(__name__)

class ProjectModel:
    """Project Model - Complete CRUD operations"""
    collection_name = 'projects'
    
    @classmethod
    def get_collection(cls):
        """Get the projects collection"""
        return get_collection(cls.collection_name)
    
    # ============ CREATE ============
    @classmethod
    def create(cls, project_data):
        """Create a new project"""
        project_data['created_at'] = datetime.utcnow()
        project_data['updated_at'] = datetime.utcnow()
        project_data['status'] = project_data.get('status', 'Planning')
        project_data['tasks_count'] = 0
        project_data['completed_tasks'] = 0
        project_data['members'] = project_data.get('members', [])  # Keep for backward compatibility
        project_data['member_details'] = project_data.get('member_details', [])  # New: detailed member info
        project_data['tags'] = project_data.get('tags', [])
        project_data['links'] = project_data.get('links', [])
        project_data['images'] = project_data.get('images', [])
        project_data['files'] = project_data.get('files', [])
        
        result = cls.get_collection().insert_one(project_data)
        return str(result.inserted_id)
    
    # ============ READ ============
    @classmethod
    def find_by_id(cls, project_id):
        """Find project by ID"""
        try:
            return cls.get_collection().find_one({'_id': ObjectId(project_id)})
        except:
            return None
    
    @classmethod
    def find_by_owner(cls, owner_id):
        """Find projects by owner"""
        return list(cls.get_collection().find({'owner_id': owner_id}))
    
    @classmethod
    def find_by_member(cls, user_id):
        """Find projects where user is a member (by user ID)"""
        return list(cls.get_collection().find({'members': user_id}))
    
    @classmethod
    def find_all(cls, filter_query=None, skip=0, limit=100, sort=None):
        """Find multiple projects"""
        if filter_query is None:
            filter_query = {}
        
        cursor = cls.get_collection().find(filter_query).skip(skip).limit(limit)
        
        if sort:
            cursor = cursor.sort(sort)
        
        return list(cursor)
    
    @classmethod
    def find_by_status(cls, status, skip=0, limit=100):
        """Find projects by status"""
        return cls.find_all(
            filter_query={'status': status},
            skip=skip,
            limit=limit,
            sort=[('created_at', -1)]
        )
    
    @classmethod
    def count(cls, filter_query=None):
        """Count projects"""
        if filter_query is None:
            filter_query = {}
        return cls.get_collection().count_documents(filter_query)
    
    @classmethod
    def get_project_stats(cls, project_id):
        """Get project statistics"""
        from models.task_model import TaskModel
        
        project = cls.find_by_id(project_id)
        if not project:
            return None
        
        tasks = TaskModel.find_by_project(project_id)
        total_tasks = len(tasks)
        completed_tasks = len([t for t in tasks if t.get('status') == 'Done'])
        in_progress = len([t for t in tasks if t.get('status') == 'In Progress'])
        todo_tasks = len([t for t in tasks if t.get('status') == 'Todo'])
        
        return {
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'in_progress': in_progress,
            'todo_tasks': todo_tasks,
            'completion_rate': (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        }
    
    # ============ UPDATE ============
    @classmethod
    def update(cls, project_id, update_data):
        """Update project"""
        update_data['updated_at'] = datetime.utcnow()
        result = cls.get_collection().update_one(
            {'_id': ObjectId(project_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    @classmethod
    def update_status(cls, project_id, status):
        """Update project status"""
        return cls.update(project_id, {'status': status})
    
    # ============ MEMBER MANAGEMENT ============
    @classmethod
    def add_member(cls, project_id, user_id):
        """Add a member to project (backward compatibility - keeps user ID in members array)"""
        result = cls.get_collection().update_one(
            {'_id': ObjectId(project_id)},
            {'$addToSet': {'members': user_id}}
        )
        return result.modified_count > 0
    
    @classmethod
    def add_member_details(cls, project_id, member_data):
        """Add detailed member information"""
        try:
            # Generate a unique ID for the member
            member_id = f"member_{int(datetime.utcnow().timestamp())}_{ObjectId()}"
            member_data['_id'] = member_id
            member_data['added_at'] = datetime.utcnow()
            member_data['is_external'] = member_data.get('is_external', True)
            
            # Also add to members array for backward compatibility
            result = cls.get_collection().update_one(
                {'_id': ObjectId(project_id)},
                {
                    '$push': {'member_details': member_data},
                    '$addToSet': {'members': member_id}
                }
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error adding member details: {str(e)}")
            return False
    
    @classmethod
    def update_member_details(cls, project_id, member_id, update_data):
        """Update a specific member's details"""
        try:
            update_data['updated_at'] = datetime.utcnow()
            result = cls.get_collection().update_one(
                {
                    '_id': ObjectId(project_id),
                    'member_details._id': member_id
                },
                {'$set': {
                    'member_details.$.name': update_data.get('name'),
                    'member_details.$.email': update_data.get('email'),
                    'member_details.$.department': update_data.get('department'),
                    'member_details.$.role': update_data.get('role'),
                    'member_details.$.phone': update_data.get('phone'),
                    'member_details.$.location': update_data.get('location'),
                    'member_details.$.title': update_data.get('title'),
                    'member_details.$.skills': update_data.get('skills', []),
                    'member_details.$.join_date': update_data.get('join_date'),
                    'member_details.$.updated_at': datetime.utcnow()
                }}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating member details: {str(e)}")
            return False
    
    @classmethod
    def remove_member(cls, project_id, member_id):
        """Remove a member from project"""
        try:
            # Remove from members array
            result1 = cls.get_collection().update_one(
                {'_id': ObjectId(project_id)},
                {'$pull': {'members': member_id}}
            )
            
            # Remove from member_details array
            result2 = cls.get_collection().update_one(
                {'_id': ObjectId(project_id)},
                {'$pull': {'member_details': {'_id': member_id}}}
            )
            
            return result1.modified_count > 0 or result2.modified_count > 0
        except Exception as e:
            logger.error(f"Error removing member: {str(e)}")
            return False
    
    @classmethod
    def get_members(cls, project_id):
        """Get all members (both user IDs and detailed members) with consistent format"""
        try:
            project = cls.find_by_id(project_id)
            if not project:
                return []
            
            members = []
            external_ids = set()
            
            # 1. Add detailed members from member_details
            if 'member_details' in project and project['member_details']:
                for member in project['member_details']:
                    # Store the ID to avoid duplicates
                    if member.get('_id'):
                        external_ids.add(member.get('_id'))
                    
                    members.append({
                        '_id': member.get('_id'),
                        'name': member.get('name', 'Unknown'),
                        'email': member.get('email', ''),
                        'role': member.get('role', 'Team Member'),
                        'department': member.get('department', ''),
                        'phone': member.get('phone', ''),
                        'location': member.get('location', ''),
                        'title': member.get('title', ''),
                        'skills': member.get('skills', []),
                        'joinDate': member.get('join_date', ''),
                        'is_external': True,
                        'isNew': False
                    })
            
            # 2. Add simple members (user IDs) that don't have details
            if 'members' in project and project['members']:
                for member_id in project['members']:
                    # Skip if already added as external member
                    if member_id in external_ids:
                        continue
                    
                    # Try to get user details from UserModel
                    try:
                        from models.user_model import UserModel
                        user = UserModel.find_by_id(member_id)
                        if user:
                            members.append({
                                '_id': str(user['_id']),
                                'name': user.get('name', 'Unknown'),
                                'email': user.get('email', ''),
                                'role': user.get('role', 'Team Member'),
                                'department': user.get('department', ''),
                                'phone': user.get('phone', ''),
                                'location': user.get('location', ''),
                                'title': user.get('title', ''),
                                'skills': user.get('skills', []),
                                'joinDate': user.get('join_date', ''),
                                'is_external': False,
                                'isNew': False
                            })
                        else:
                            members.append({
                                '_id': member_id,
                                'name': 'Unknown User',
                                'email': '',
                                'role': 'Team Member',
                                'department': '',
                                'phone': '',
                                'location': '',
                                'title': '',
                                'skills': [],
                                'joinDate': '',
                                'is_external': False,
                                'isNew': False
                            })
                    except Exception as e:
                        logger.error(f"Error fetching user {member_id}: {str(e)}")
                        members.append({
                            '_id': member_id,
                            'name': 'Unknown User',
                            'email': '',
                            'role': 'Team Member',
                            'department': '',
                            'phone': '',
                            'location': '',
                            'title': '',
                            'skills': [],
                            'joinDate': '',
                            'is_external': False,
                            'isNew': False
                        })
            
            return members
        except Exception as e:
            logger.error(f"Error getting members: {str(e)}")
            return []
        

     
    # ============ TASK COUNTS ============
    @classmethod
    def update_task_counts(cls, project_id):
        """Update task counts for a project"""
        from models.task_model import TaskModel
        
        tasks = TaskModel.find_by_project(project_id)
        total = len(tasks)
        completed = len([t for t in tasks if t.get('status') == 'Done'])
        
        return cls.update(project_id, {
            'tasks_count': total,
            'completed_tasks': completed
        })
    
    # ============ UTILITY ============
    @classmethod
    def add_image(cls, project_id, image_data):
        """Add an image to project"""
        result = cls.get_collection().update_one(
            {'_id': ObjectId(project_id)},
            {'$push': {'images': image_data}}
        )
        return result.modified_count > 0
    
    @classmethod
    def add_file(cls, project_id, file_data):
        """Add a file to project"""
        result = cls.get_collection().update_one(
            {'_id': ObjectId(project_id)},
            {'$push': {'files': file_data}}
        )
        return result.modified_count > 0
    
    @classmethod
    def add_link(cls, project_id, link_data):
        """Add a link to project"""
        result = cls.get_collection().update_one(
            {'_id': ObjectId(project_id)},
            {'$push': {'links': link_data}}
        )
        return result.modified_count > 0
    
    @classmethod
    def remove_image(cls, project_id, image_index):
        """Remove an image from project by index"""
        project = cls.find_by_id(project_id)
        if project and 'images' in project:
            images = project['images']
            if 0 <= image_index < len(images):
                images.pop(image_index)
                return cls.update(project_id, {'images': images})
        return False
    
    @classmethod
    def remove_file(cls, project_id, file_index):
        """Remove a file from project by index"""
        project = cls.find_by_id(project_id)
        if project and 'files' in project:
            files = project['files']
            if 0 <= file_index < len(files):
                files.pop(file_index)
                return cls.update(project_id, {'files': files})
        return False
    
    @classmethod
    def remove_link(cls, project_id, link_index):
        """Remove a link from project by index"""
        project = cls.find_by_id(project_id)
        if project and 'links' in project:
            links = project['links']
            if 0 <= link_index < len(links):
                links.pop(link_index)
                return cls.update(project_id, {'links': links})
        return False
    
    # ============ DELETE ============
    @classmethod
    def delete(cls, project_id):
        """Delete a project"""
        result = cls.get_collection().delete_one({'_id': ObjectId(project_id)})
        return result.deleted_count > 0
    
    # ============ UTILITY ============
    @staticmethod
    def to_dict(project):
        """Convert MongoDB document to dict"""
        if not project:
            return None
        project_dict = dict(project)
        if '_id' in project_dict:
            project_dict['_id'] = str(project_dict['_id'])
        return project_dict
    
    @staticmethod
    def to_list(projects):
        """Convert multiple projects to list"""
        return [ProjectModel.to_dict(p) for p in projects]