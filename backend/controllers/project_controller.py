from flask import request, current_app
from flask_jwt_extended import get_jwt_identity
from models.project_model import ProjectModel
from models.task_model import TaskModel
from models.user_model import UserModel
import logging
from datetime import datetime
import os
import uuid
from werkzeug.utils import secure_filename

# Set up logger
logger = logging.getLogger(__name__)

class ProjectController:
    """Project Controller - Handles project operations"""
    
    # Allowed file extensions
    ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'}
    ALLOWED_FILE_EXTENSIONS = {'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'zip', 'rar'}
    
    @staticmethod
    def allowed_file(filename, allowed_extensions):
        """Check if file extension is allowed"""
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions
    
    @staticmethod
    def save_file(file, upload_type='images'):
        """Save uploaded file and return file info"""
        try:
            # Generate unique filename
            original_filename = secure_filename(file.filename)
            file_extension = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else ''
            unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
            
            # Determine upload directory
            upload_dir = os.path.join('uploads', upload_type)
            os.makedirs(upload_dir, exist_ok=True)
            
            # Save file
            file_path = os.path.join(upload_dir, unique_filename)
            file.save(file_path)
            
            # Get file size
            file_size = os.path.getsize(file_path)
            
            return {
                'filename': original_filename,
                'saved_filename': unique_filename,
                'path': file_path,
                'url': f'/uploads/{upload_type}/{unique_filename}',
                'size': file_size,
                'type': file.content_type
            }
        except Exception as e:
            logger.error(f"Error saving file: {str(e)}")
            return None
    
    # # ============ CREATE ============
    # @staticmethod
    # def create_project():
    #     """Create a new project with file uploads"""
    #     try:
    #         user_id = get_jwt_identity()
    #         logger.info(f"Create project request from user: {user_id}")
            
    #         # Check if request has files or JSON
    #         if request.files:
    #             # Handle multipart form data with files
    #             data = request.form
    #             files = request.files
    #             logger.info(f"Multipart request with {len(files)} files")
    #         else:
    #             # Handle JSON request
    #             data = request.get_json()
    #             files = {}
    #             logger.info(f"JSON request")
            
    #         # Validate required fields
    #         required = ['name']
    #         for field in required:
    #             if not data.get(field):
    #                 logger.warning(f"Missing required field: {field} for user: {user_id}")
    #                 return {'error': f'{field} is required'}, 400
            
    #         # Check if user exists
    #         user = UserModel.find_by_id(user_id)
    #         if not user:
    #             logger.error(f"User not found: {user_id}")
    #             return {'error': 'User not found'}, 404
            
    #         # Process tags from JSON or form data
    #         tags = []
    #         if data.get('tags'):
    #             if isinstance(data.get('tags'), str):
    #                 # Parse tags from JSON string
    #                 import json
    #                 try:
    #                     tags = json.loads(data.get('tags'))
    #                 except:
    #                     tags = data.get('tags').split(',')
    #             else:
    #                 tags = data.get('tags', [])
            
    #         # Process links from JSON or form data
    #         links = []
    #         if data.get('links'):
    #             if isinstance(data.get('links'), str):
    #                 import json
    #                 try:
    #                     links = json.loads(data.get('links'))
    #                 except:
    #                     pass
    #             else:
    #                 links = data.get('links', [])
            
    #         # Prepare project data
    #         project_data = {
    #             'name': data['name'].strip(),
    #             'description': data.get('description', '').strip(),
    #             'owner_id': user_id,
    #             'owner_name': user.get('name', 'Unknown'),
    #             'status': data.get('status', 'Planning'),
    #             'priority': data.get('priority', 'Medium'),
    #             'start_date': data.get('start_date'),
    #             'end_date': data.get('end_date'),
    #             'members': [user_id],  # Owner is automatically a member
    #             'tags': tags,
    #             'links': links,
    #             'images': [],
    #             'files': [],
    #             'created_at': datetime.utcnow(),
    #             'updated_at': datetime.utcnow()
    #         }
            
    #         # Process uploaded images
    #         if 'images' in files:
    #             image_files = files.getlist('images')
    #             logger.info(f"Processing {len(image_files)} images")
    #             for file in image_files:
    #                 if file and file.filename:
    #                     if ProjectController.allowed_file(file.filename, ProjectController.ALLOWED_IMAGE_EXTENSIONS):
    #                         saved_file = ProjectController.save_file(file, 'images')
    #                         if saved_file:
    #                             project_data['images'].append(saved_file)
    #                             logger.info(f"Saved image: {saved_file['filename']}")
    #                     else:
    #                         logger.warning(f"Invalid image format: {file.filename}")
            
    #         # Process uploaded files
    #         if 'files' in files:
    #             file_uploads = files.getlist('files')
    #             logger.info(f"Processing {len(file_uploads)} files")
    #             for file in file_uploads:
    #                 if file and file.filename:
    #                     if ProjectController.allowed_file(file.filename, ProjectController.ALLOWED_FILE_EXTENSIONS):
    #                         saved_file = ProjectController.save_file(file, 'files')
    #                         if saved_file:
    #                             project_data['files'].append(saved_file)
    #                             logger.info(f"Saved file: {saved_file['filename']}")
    #                     else:
    #                         logger.warning(f"Invalid file format: {file.filename}")
            
    #         # Create project
    #         project_id = ProjectModel.create(project_data)
    #         logger.info(f"Project created successfully: {project_id} by user: {user_id}")
            
    #         project = ProjectModel.find_by_id(project_id)
    #         return {
    #             'message': 'Project created successfully',
    #             'project_id': project_id,
    #             'project': ProjectModel.to_dict(project)
    #         }, 201
            
    #     except Exception as e:
    #         logger.error(f"Error in create_project: {str(e)}", exc_info=True)
    #         return {'error': f'Failed to create project: {str(e)}'}, 500
    
    @staticmethod
    def create_project():
        """Create a new project with file uploads"""
        try:
            user_id = get_jwt_identity()
            logger.info(f"Create project request from user: {user_id}")
            
            # Check if request has files or JSON
            if request.files:
                # Handle multipart form data with files
                data = request.form
                files = request.files
                logger.info(f"Multipart request with {len(files)} files")
            else:
                # Handle JSON request
                data = request.get_json()
                files = {}
                logger.info(f"JSON request")
            
            # Validate required fields
            required = ['name']
            for field in required:
                if not data.get(field):
                    logger.warning(f"Missing required field: {field} for user: {user_id}")
                    return {'error': f'{field} is required'}, 400
            
            # Check if user exists
            user = UserModel.find_by_id(user_id)
            if not user:
                logger.error(f"User not found: {user_id}")
                return {'error': 'User not found'}, 404
            
            # Process tags from JSON or form data
            tags = []
            if data.get('tags'):
                if isinstance(data.get('tags'), str):
                    import json
                    try:
                        tags = json.loads(data.get('tags'))
                    except:
                        tags = data.get('tags').split(',')
                else:
                    tags = data.get('tags', [])
            
            # Process links from JSON or form data
            links = []
            if data.get('links'):
                if isinstance(data.get('links'), str):
                    import json
                    try:
                        links = json.loads(data.get('links'))
                    except:
                        pass
                else:
                    links = data.get('links', [])
            
            # Prepare project data
            project_data = {
                'name': data['name'].strip(),
                'description': data.get('description', '').strip(),
                'owner_id': user_id,
                'owner_name': user.get('name', 'Unknown'),
                'status': data.get('status', 'Planning'),
                'priority': data.get('priority', 'Medium'),
                'start_date': data.get('start_date'),
                'end_date': data.get('end_date'),
                'members': [user_id],
                'tags': tags,
                'links': links,
                'images': [],
                'files': [],
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            # Process uploaded images
            if 'images' in files:
                image_files = files.getlist('images')
                logger.info(f"Processing {len(image_files)} images")
                for file in image_files:
                    if file and file.filename:
                        saved_file = ProjectController.save_file(file, 'images')
                        if saved_file:
                            project_data['images'].append(saved_file)
                            logger.info(f"Saved image: {saved_file['filename']}")
            
            # Process uploaded files
            if 'files' in files:
                file_uploads = files.getlist('files')
                logger.info(f"Processing {len(file_uploads)} files")
                for file in file_uploads:
                    if file and file.filename:
                        saved_file = ProjectController.save_file(file, 'files')
                        if saved_file:
                            project_data['files'].append(saved_file)
                            logger.info(f"Saved file: {saved_file['filename']}")
            
            # Create project
            project_id = ProjectModel.create(project_data)
            logger.info(f"Project created successfully: {project_id} by user: {user_id}")
            
            project = ProjectModel.find_by_id(project_id)
            return {
                'message': 'Project created successfully',
                'project_id': project_id,
                'project': ProjectModel.to_dict(project)
            }, 201
            
        except Exception as e:
            logger.error(f"Error in create_project: {str(e)}", exc_info=True)
            return {'error': f'Failed to create project: {str(e)}'}, 500 


    # ============ READ ============
    @staticmethod
    def get_all_projects():
        """Get all projects with pagination and filters"""
        try:
            user_id = get_jwt_identity()
            logger.info(f"Fetching projects for user: {user_id}")
            
            page = request.args.get('page', 1, type=int)
            per_page = min(request.args.get('per_page', 20, type=int), 100)
            skip = (page - 1) * per_page
            
            # Get filter parameters
            status = request.args.get('status')
            search = request.args.get('search')
            priority = request.args.get('priority')
            
            logger.debug(f"Filters - Status: {status}, Search: {search}, Priority: {priority}")
            
            # Build filter query
            filter_query = {
                '$or': [
                    {'owner_id': user_id},
                    {'members': user_id}
                ]
            }
            
            # Add status filter if provided
            if status:
                filter_query['status'] = status
                logger.debug(f"Applied status filter: {status}")
            
            # Add priority filter if provided
            if priority:
                filter_query['priority'] = priority
                logger.debug(f"Applied priority filter: {priority}")
            
            # Add search filter if provided
            if search:
                logger.debug(f"Applied search filter: {search}")
                search_conditions = [
                    {'name': {'$regex': search, '$options': 'i'}},
                    {'description': {'$regex': search, '$options': 'i'}}
                ]
                
                filter_query = {
                    '$and': [
                        {
                            '$or': [
                                {'owner_id': user_id},
                                {'members': user_id}
                            ]
                        },
                        {
                            '$or': search_conditions
                        }
                    ]
                }
                
                if status:
                    filter_query['$and'].append({'status': status})
                if priority:
                    filter_query['$and'].append({'priority': priority})
                
                logger.debug(f"Combined filter query with search: {filter_query}")
            
            logger.debug(f"Final filter query: {filter_query}")
            
            projects = ProjectModel.find_all(
                filter_query=filter_query,
                skip=skip,
                limit=per_page,
                sort=[('created_at', -1)]
            )
            total = ProjectModel.count(filter_query)
            
            logger.info(f"Found {len(projects)} projects, total: {total} for user: {user_id}")
            
            # Get stats for each project
            for project in projects:
                try:
                    stats = ProjectModel.get_project_stats(str(project['_id']))
                    project['stats'] = stats
                except Exception as e:
                    logger.warning(f"Failed to get stats for project {project.get('_id')}: {str(e)}")
                    project['stats'] = {'total_tasks': 0, 'completed_tasks': 0, 'completion_rate': 0}
            
            return {
                'projects': ProjectModel.to_list(projects),
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total,
                    'pages': (total + per_page - 1) // per_page
                }
            }, 200
            
        except Exception as e:
            logger.error(f"Error in get_all_projects: {str(e)}", exc_info=True)
            return {'error': f'Failed to fetch projects: {str(e)}'}, 500
    
    @staticmethod
    def get_project(project_id):
        """Get a single project by ID"""
        try:
            user_id = get_jwt_identity()
            logger.info(f"Fetching project {project_id} for user: {user_id}")
            
            project = ProjectModel.find_by_id(project_id)
            if not project:
                logger.warning(f"Project not found: {project_id}")
                return {'error': 'Project not found'}, 404
            
            # Check if user has access
            if project['owner_id'] != user_id and user_id not in project.get('members', []):
                logger.warning(f"Access denied for user {user_id} on project {project_id}")
                return {'error': 'Access denied'}, 403
            
            # Get project stats
            stats = ProjectModel.get_project_stats(project_id)
            project['stats'] = stats
            
            # Get tasks
            tasks = TaskModel.find_by_project(project_id)
            project['tasks'] = TaskModel.to_list(tasks)
            
            logger.info(f"Project {project_id} fetched successfully for user: {user_id}")
            return ProjectModel.to_dict(project), 200
            
        except Exception as e:
            logger.error(f"Error in get_project: {str(e)}", exc_info=True)
            return {'error': f'Failed to fetch project: {str(e)}'}, 500
    
    @staticmethod
    def get_project_stats(project_id):
        """Get project statistics"""
        try:
            user_id = get_jwt_identity()
            logger.info(f"Fetching stats for project {project_id} for user: {user_id}")
            
            project = ProjectModel.find_by_id(project_id)
            if not project:
                logger.warning(f"Project not found: {project_id}")
                return {'error': 'Project not found'}, 404
            
            # Check if user has access
            if project['owner_id'] != user_id and user_id not in project.get('members', []):
                logger.warning(f"Access denied for user {user_id} on project {project_id}")
                return {'error': 'Access denied'}, 403
            
            stats = ProjectModel.get_project_stats(project_id)
            logger.info(f"Stats fetched for project {project_id}")
            return stats, 200
            
        except Exception as e:
            logger.error(f"Error in get_project_stats: {str(e)}", exc_info=True)
            return {'error': f'Failed to fetch project stats: {str(e)}'}, 500
    
    # ============ UPDATE ============
    @staticmethod
    def update_project(project_id):
        """Update a project with file uploads"""
        try:
            user_id = get_jwt_identity()
            logger.info(f"Update project {project_id} request from user: {user_id}")
            
            # Check if request has files or JSON
            if request.files:
                data = request.form
                files = request.files
                logger.info(f"Multipart update with {len(files)} files")
            else:
                data = request.get_json()
                files = {}
                logger.info(f"JSON update request")
            
            project = ProjectModel.find_by_id(project_id)
            if not project:
                logger.warning(f"Project not found: {project_id}")
                return {'error': 'Project not found'}, 404
            
            # Check if user is owner
            if project['owner_id'] != user_id:
                logger.warning(f"Non-owner {user_id} tried to update project {project_id}")
                return {'error': 'Only project owner can update'}, 403
            
            update_data = {}
            
            # Allowed fields to update
            allowed_fields = ['name', 'description', 'status', 'start_date', 'end_date', 'priority']
            for field in allowed_fields:
                if field in data:
                    update_data[field] = data[field]
            
            # Process tags
            if data.get('tags'):
                if isinstance(data.get('tags'), str):
                    import json
                    try:
                        update_data['tags'] = json.loads(data.get('tags'))
                    except:
                        update_data['tags'] = data.get('tags').split(',')
                else:
                    update_data['tags'] = data.get('tags')
            
            # Process links
            if data.get('links'):
                if isinstance(data.get('links'), str):
                    import json
                    try:
                        update_data['links'] = json.loads(data.get('links'))
                    except:
                        pass
                else:
                    update_data['links'] = data.get('links')
            
            # Process uploaded images
            if 'images' in files:
                image_files = files.getlist('images')
                logger.info(f"Processing {len(image_files)} new images")
                new_images = []
                for file in image_files:
                    if file and file.filename:
                        if ProjectController.allowed_file(file.filename, ProjectController.ALLOWED_IMAGE_EXTENSIONS):
                            saved_file = ProjectController.save_file(file, 'images')
                            if saved_file:
                                new_images.append(saved_file)
                if new_images:
                    # Append new images to existing ones
                    existing_images = project.get('images', [])
                    update_data['images'] = existing_images + new_images
            
            # Process uploaded files
            if 'files' in files:
                file_uploads = files.getlist('files')
                logger.info(f"Processing {len(file_uploads)} new files")
                new_files = []
                for file in file_uploads:
                    if file and file.filename:
                        if ProjectController.allowed_file(file.filename, ProjectController.ALLOWED_FILE_EXTENSIONS):
                            saved_file = ProjectController.save_file(file, 'files')
                            if saved_file:
                                new_files.append(saved_file)
                if new_files:
                    # Append new files to existing ones
                    existing_files = project.get('files', [])
                    update_data['files'] = existing_files + new_files
            
            if not update_data:
                logger.info(f"No fields to update for project {project_id}")
                return {'message': 'No fields to update'}, 200
            
            update_data['updated_at'] = datetime.utcnow()
            success = ProjectModel.update(project_id, update_data)
            
            if success:
                logger.info(f"Project {project_id} updated by user {user_id}. Fields: {list(update_data.keys())}")
                return {
                    'message': 'Project updated successfully',
                    'updated_fields': list(update_data.keys())
                }, 200
            
            logger.error(f"Failed to update project {project_id}")
            return {'error': 'Failed to update project'}, 500
            
        except Exception as e:
            logger.error(f"Error in update_project: {str(e)}", exc_info=True)
            return {'error': f'Failed to update project: {str(e)}'}, 500
    
    @staticmethod
    def update_project_status(project_id):
        """Update project status"""
        try:
            user_id = get_jwt_identity()
            data = request.get_json()
            
            logger.info(f"Update status for project {project_id} from user: {user_id}")
            
            if not data.get('status'):
                logger.warning(f"Missing status field for project {project_id}")
                return {'error': 'Status is required'}, 400
            
            project = ProjectModel.find_by_id(project_id)
            if not project:
                logger.warning(f"Project not found: {project_id}")
                return {'error': 'Project not found'}, 404
            
            # Check if user is owner
            if project['owner_id'] != user_id:
                logger.warning(f"Non-owner {user_id} tried to update status for project {project_id}")
                return {'error': 'Only project owner can update status'}, 403
            
            valid_statuses = ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled']
            if data['status'] not in valid_statuses:
                logger.warning(f"Invalid status {data['status']} for project {project_id}")
                return {'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}, 400
            
            success = ProjectModel.update_status(project_id, data['status'])
            
            if success:
                logger.info(f"Project {project_id} status updated to {data['status']} by user {user_id}")
                return {'message': f'Project status updated to {data["status"]}'}, 200
            
            logger.error(f"Failed to update status for project {project_id}")
            return {'error': 'Failed to update status'}, 500
            
        except Exception as e:
            logger.error(f"Error in update_project_status: {str(e)}", exc_info=True)
            return {'error': f'Failed to update status: {str(e)}'}, 500
    
    # @staticmethod
    # def add_member(project_id):
    #     """Add a member to project"""
    #     try:
    #         user_id = get_jwt_identity()
    #         data = request.get_json()
            
    #         logger.info(f"Add member to project {project_id} from user: {user_id}")
            
    #         if not data.get('user_id'):
    #             logger.warning(f"Missing user_id for project {project_id}")
    #             return {'error': 'User ID is required'}, 400
            
    #         project = ProjectModel.find_by_id(project_id)
    #         if not project:
    #             logger.warning(f"Project not found: {project_id}")
    #             return {'error': 'Project not found'}, 404
            
    #         # Check if user is owner
    #         if project['owner_id'] != user_id:
    #             logger.warning(f"Non-owner {user_id} tried to add member to project {project_id}")
    #             return {'error': 'Only project owner can add members'}, 403
            
    #         # Check if user exists
    #         user_to_add = UserModel.find_by_id(data['user_id'])
    #         if not user_to_add:
    #             logger.warning(f"User not found: {data['user_id']}")
    #             return {'error': 'User not found'}, 404
            
    #         # Check if already a member
    #         if data['user_id'] in project.get('members', []):
    #             logger.info(f"User {data['user_id']} is already a member of project {project_id}")
    #             return {'error': 'User is already a member'}, 400
            
    #         success = ProjectModel.add_member(project_id, data['user_id'])
            
    #         if success:
    #             logger.info(f"User {data['user_id']} added to project {project_id} by {user_id}")
    #             return {'message': 'Member added successfully'}, 200
            
    #         logger.error(f"Failed to add member to project {project_id}")
    #         return {'error': 'Failed to add member'}, 500
            
    #     except Exception as e:
    #         logger.error(f"Error in add_member: {str(e)}", exc_info=True)
    #         return {'error': f'Failed to add member: {str(e)}'}, 500
    


    # @staticmethod
    # def remove_member(project_id):
    #     """Remove a member from project"""
    #     try:
    #         user_id = get_jwt_identity()
    #         data = request.get_json()
            
    #         logger.info(f"Remove member from project {project_id} from user: {user_id}")
            
    #         if not data.get('user_id'):
    #             logger.warning(f"Missing user_id for project {project_id}")
    #             return {'error': 'User ID is required'}, 400
            
    #         project = ProjectModel.find_by_id(project_id)
    #         if not project:
    #             logger.warning(f"Project not found: {project_id}")
    #             return {'error': 'Project not found'}, 404
            
    #         # Check if user is owner
    #         if project['owner_id'] != user_id:
    #             logger.warning(f"Non-owner {user_id} tried to remove member from project {project_id}")
    #             return {'error': 'Only project owner can remove members'}, 403
            
    #         # Cannot remove owner
    #         if data['user_id'] == project['owner_id']:
    #             logger.warning(f"Attempt to remove owner {data['user_id']} from project {project_id}")
    #             return {'error': 'Cannot remove project owner'}, 400
            
    #         success = ProjectModel.remove_member(project_id, data['user_id'])
            
    #         if success:
    #             logger.info(f"User {data['user_id']} removed from project {project_id} by {user_id}")
    #             return {'message': 'Member removed successfully'}, 200
            
    #         logger.error(f"Failed to remove member from project {project_id}")
    #         return {'error': 'Failed to remove member'}, 500
            
    #     except Exception as e:
    #         logger.error(f"Error in remove_member: {str(e)}", exc_info=True)
    #         return {'error': f'Failed to remove member: {str(e)}'}, 500
    
    # ============ DELETE ============
    @staticmethod
    def delete_project(project_id):
        """Delete a project"""
        try:
            user_id = get_jwt_identity()
            logger.info(f"Delete project {project_id} request from user: {user_id}")
            
            project = ProjectModel.find_by_id(project_id)
            if not project:
                logger.warning(f"Project not found: {project_id}")
                return {'error': 'Project not found'}, 404
            
            # Check if user is owner
            if project['owner_id'] != user_id:
                logger.warning(f"Non-owner {user_id} tried to delete project {project_id}")
                return {'error': 'Only project owner can delete'}, 403
            
            # Delete all tasks in project
            tasks_deleted = TaskModel.delete_by_project(project_id)
            logger.info(f"Deleted {tasks_deleted} tasks from project {project_id}")
            
            # Delete project
            success = ProjectModel.delete(project_id)
            
            if success:
                logger.info(f"Project {project_id} deleted by user {user_id}")
                return {'message': 'Project deleted successfully'}, 200
            
            logger.error(f"Failed to delete project {project_id}")
            return {'error': 'Failed to delete project'}, 500
            
        except Exception as e:
            logger.error(f"Error in delete_project: {str(e)}", exc_info=True)
            return {'error': f'Failed to delete project: {str(e)}'}, 500


    @staticmethod
    def get_project_members(project_id):
        """Get all members of a project (including external members)"""
        try:
            # Check if project exists
            project = ProjectModel.find_by_id(project_id)
            if not project:
                return {'error': 'Project not found'}, 404
            
            members = []
            
            # 1. Get external members from member_details
            if 'member_details' in project and project['member_details']:
                for member in project['member_details']:
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
            
            # 2. Get internal users from members array
            if 'members' in project and project['members']:
                # Get IDs of already added external members
                external_ids = [m.get('_id') for m in members if m.get('_id')]
                
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
                            # User not found in UserModel, add as unknown
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
            
            return {
                'members': members,
                'total': len(members)
            }, 200
            
        except Exception as e:
            logger.error(f"Error getting project members: {str(e)}")
            return {'error': f'Failed to get project members: {str(e)}'}, 500

    
    @staticmethod
    def add_member(project_id):
        """Add a member to project (supports both user_id and external member data)"""
        try:
            user_id = get_jwt_identity()
            data = request.get_json()
            
            logger.info(f"Add member to project {project_id} from user: {user_id}")
            logger.info(f"Request data: {data}")
            
            if not data:
                return {'error': 'No data provided'}, 400
            
            project = ProjectModel.find_by_id(project_id)
            if not project:
                logger.warning(f"Project not found: {project_id}")
                return {'error': 'Project not found'}, 404
            
            # Check if user is owner
            if project['owner_id'] != user_id:
                logger.warning(f"Non-owner {user_id} tried to add member to project {project_id}")
                return {'error': 'Only project owner can add members'}, 403
            
            # Case 1: Adding existing user by ID
            if 'user_id' in data:
                user_to_add_id = data['user_id']
                logger.info(f"Adding user {user_to_add_id} to project {project_id}")
                
                # Check if it's an external member (starts with 'member_')
                if str(user_to_add_id).startswith('member_'):
                    logger.info(f"Adding external member with ID: {user_to_add_id}")
                    # This is an external member, check if they exist in member_details
                    existing_members = project.get('member_details', [])
                    for member in existing_members:
                        if member.get('_id') == user_to_add_id:
                            return {'error': 'Member already exists'}, 400
                    
                    # Since we don't have the full details, we need to get them from somewhere
                    # The frontend should send the full details for external members
                    return {'error': 'External member must be added with full details (name and email)'}, 400
                
                # Check if user exists in UserModel (only for internal users)
                user_to_add = UserModel.find_by_id(user_to_add_id)
                if not user_to_add:
                    logger.warning(f"User not found: {user_to_add_id}")
                    return {'error': 'User not found'}, 404
                
                # Check if already a member
                if user_to_add_id in project.get('members', []):
                    logger.info(f"User {user_to_add_id} is already a member")
                    return {'error': 'User is already a member'}, 400
                
                success = ProjectModel.add_member(project_id, user_to_add_id)
                
                if success:
                    return {
                        'message': 'Member added successfully',
                        'member': {
                            '_id': user_to_add_id,
                            'name': user_to_add.get('name', 'Unknown'),
                            'email': user_to_add.get('email', ''),
                            'role': 'Team Member',
                            'is_external': False
                        }
                    }, 200
                else:
                    return {'error': 'Failed to add member'}, 500
            
            # Case 2: Adding external member with full details
            elif 'name' in data and 'email' in data:
                logger.info(f"Adding external member {data['name']} to project {project_id}")
                
                # Check if member already exists with same email
                existing_members = project.get('member_details', [])
                for member in existing_members:
                    if member.get('email') == data['email']:
                        return {'error': 'Member with this email already exists'}, 400
                
                member_data = {
                    'name': data['name'],
                    'email': data['email'],
                    'department': data.get('department', ''),
                    'role': data.get('role', 'Team Member'),
                    'phone': data.get('phone', ''),
                    'location': data.get('location', ''),
                    'title': data.get('title', ''),
                    'skills': data.get('skills', []),
                    'join_date': data.get('join_date', datetime.utcnow().isoformat()),
                    'is_external': True
                }
                
                success = ProjectModel.add_member_details(project_id, member_data)
                
                if success:
                    # Get the added member from the project
                    updated_project = ProjectModel.find_by_id(project_id)
                    added_member = None
                    if updated_project and 'member_details' in updated_project:
                        for member in updated_project['member_details']:
                            if member.get('email') == data['email']:
                                added_member = member
                                break
                    
                    if added_member:
                        return {
                            'message': 'External member added successfully',
                            'member': added_member
                        }, 200
                    else:
                        return {
                            'message': 'External member added successfully',
                            'member': member_data
                        }, 200
                else:
                    return {'error': 'Failed to add external member'}, 500
            
            else:
                return {'error': 'Invalid request. Provide user_id or member details (name and email)'}, 400
            
        except Exception as e:
            logger.error(f"Error in add_member: {str(e)}", exc_info=True)
            return {'error': f'Failed to add member: {str(e)}'}, 500


    
    @staticmethod
    def update_member(project_id, member_id):
        """Update a project member's details"""
        try:
            user_id = get_jwt_identity()
            data = request.get_json()
            
            logger.info(f"Update member {member_id} in project {project_id} from user: {user_id}")
            
            if not data:
                return {'error': 'No data provided'}, 400
            
            project = ProjectModel.find_by_id(project_id)
            if not project:
                return {'error': 'Project not found'}, 404
            
            # Check if user is owner
            if project['owner_id'] != user_id:
                return {'error': 'Only project owner can update members'}, 403
            
            # Check if member exists in member_details
            member_exists = False
            if 'member_details' in project:
                for member in project['member_details']:
                    if member.get('_id') == member_id:
                        member_exists = True
                        break
            
            if not member_exists:
                return {'error': 'Member not found or is not an external member'}, 404
            
            # Update member details
            success = ProjectModel.update_member_details(project_id, member_id, data)
            
            if success:
                return {'message': 'Member updated successfully'}, 200
            else:
                return {'error': 'Failed to update member'}, 500
                
        except Exception as e:
            logger.error(f"Error in update_member: {str(e)}", exc_info=True)
            return {'error': f'Failed to update member: {str(e)}'}, 500



    @staticmethod
    def remove_member(project_id, member_id):
        """Remove a member from project"""
        try:
            user_id = get_jwt_identity()
            
            logger.info(f"Remove member {member_id} from project {project_id} from user: {user_id}")
            
            project = ProjectModel.find_by_id(project_id)
            if not project:
                return {'error': 'Project not found'}, 404
            
            # Check if user is owner
            if project['owner_id'] != user_id:
                return {'error': 'Only project owner can remove members'}, 403
            
            # Don't allow removing the owner
            if member_id == project.get('owner_id'):
                return {'error': 'Cannot remove project owner'}, 400
            
            # Check if member exists
            member_found = False
            
            # Check in members array
            if member_id in project.get('members', []):
                member_found = True
            
            # Check in member_details
            if not member_found and 'member_details' in project:
                for member in project['member_details']:
                    if member.get('_id') == member_id:
                        member_found = True
                        break
            
            if not member_found:
                return {'error': 'Member not found'}, 404
            
            # Remove member
            success = ProjectModel.remove_member(project_id, member_id)
            
            if success:
                return {'message': 'Member removed successfully'}, 200
            else:
                return {'error': 'Failed to remove member'}, 500
                
        except Exception as e:
            logger.error(f"Error in remove_member: {str(e)}", exc_info=True)
            return {'error': f'Failed to remove member: {str(e)}'}, 500
    

# from flask import request
# from flask_jwt_extended import get_jwt_identity
# from models.project_model import ProjectModel
# from models.task_model import TaskModel
# from models.user_model import UserModel

# class ProjectController:
#     """Project Controller - Handles project operations"""
    
#     # ============ CREATE ============
#     @staticmethod
#     def create_project():
#         """Create a new project"""
#         data = request.get_json()
#         user_id = get_jwt_identity()
        
#         # Validate required fields
#         required = ['name']
#         for field in required:
#             if not data.get(field):
#                 return {'error': f'{field} is required'}, 400
        
#         # Check if user exists
#         user = UserModel.find_by_id(user_id)
#         if not user:
#             return {'error': 'User not found'}, 404
        
#         # Prepare project data
#         project_data = {
#             'name': data['name'].strip(),
#             'description': data.get('description', '').strip(),
#             'owner_id': user_id,
#             'owner_name': user.get('name'),
#             'status': data.get('status', 'Planning'),
#             'priority': data.get('priority', 'Medium'),
#             'start_date': data.get('start_date'),
#             'end_date': data.get('end_date'),
#             'members': [user_id],  # Owner is automatically a member
#             'tags': data.get('tags', [])
#         }
        
#         # Create project
#         project_id = ProjectModel.create(project_data)
        
#         return {
#             'message': 'Project created successfully',
#             'project_id': project_id,
#             'project': ProjectModel.to_dict(ProjectModel.find_by_id(project_id))
#         }, 201
    
#     # ============ READ ============
#     @staticmethod
#     def get_all_projects():
#         """Get all projects with pagination and filters"""
#         user_id = get_jwt_identity()
#         page = request.args.get('page', 1, type=int)
#         per_page = min(request.args.get('per_page', 20, type=int), 100)
#         skip = (page - 1) * per_page
        
#         # Get filter parameters
#         status = request.args.get('status')
#         search = request.args.get('search')
#         priority = request.args.get('priority')
        
#         # Build filter query
#         filter_query = {
#             '$or': [
#                 {'owner_id': user_id},
#                 {'members': user_id}
#             ]
#         }
        
#         if status:
#             filter_query['status'] = status
        
#         if priority:
#             filter_query['priority'] = priority
        
#         if search:
#             # Search in name and description
#             filter_query['$or'] = [
#                 {'name': {'$regex': search, '$options': 'i'}},
#                 {'description': {'$regex': search, '$options': 'i'}}
#             ]
        
#         projects = ProjectModel.find_all(
#             filter_query=filter_query,
#             skip=skip,
#             limit=per_page,
#             sort=[('created_at', -1)]
#         )
#         total = ProjectModel.count(filter_query)
        
#         # Get stats for each project
#         for project in projects:
#             stats = ProjectModel.get_project_stats(str(project['_id']))
#             project['stats'] = stats
        
#         return {
#             'projects': ProjectModel.to_list(projects),
#             'pagination': {
#                 'page': page,
#                 'per_page': per_page,
#                 'total': total,
#                 'pages': (total + per_page - 1) // per_page
#             }
#         }, 200
    
#     @staticmethod
#     def get_project(project_id):
#         """Get a single project by ID"""
#         user_id = get_jwt_identity()
        
#         project = ProjectModel.find_by_id(project_id)
#         if not project:
#             return {'error': 'Project not found'}, 404
        
#         # Check if user has access
#         if project['owner_id'] != user_id and user_id not in project.get('members', []):
#             return {'error': 'Access denied'}, 403
        
#         # Get project stats
#         stats = ProjectModel.get_project_stats(project_id)
#         project['stats'] = stats
        
#         # Get tasks
#         tasks = TaskModel.find_by_project(project_id)
#         project['tasks'] = TaskModel.to_list(tasks)
        
#         return ProjectModel.to_dict(project), 200
    
#     @staticmethod
#     def get_project_stats(project_id):
#         """Get project statistics"""
#         user_id = get_jwt_identity()
        
#         project = ProjectModel.find_by_id(project_id)
#         if not project:
#             return {'error': 'Project not found'}, 404
        
#         # Check if user has access
#         if project['owner_id'] != user_id and user_id not in project.get('members', []):
#             return {'error': 'Access denied'}, 403
        
#         stats = ProjectModel.get_project_stats(project_id)
#         return stats, 200
    
#     # ============ UPDATE ============
#     @staticmethod
#     def update_project(project_id):
#         """Update a project"""
#         user_id = get_jwt_identity()
#         data = request.get_json()
        
#         project = ProjectModel.find_by_id(project_id)
#         if not project:
#             return {'error': 'Project not found'}, 404
        
#         # Check if user is owner
#         if project['owner_id'] != user_id:
#             return {'error': 'Only project owner can update'}, 403
        
#         update_data = {}
        
#         # Allowed fields to update
#         allowed_fields = ['name', 'description', 'status', 'start_date', 'end_date', 'priority', 'tags']
#         for field in allowed_fields:
#             if field in data:
#                 update_data[field] = data[field]
        
#         if not update_data:
#             return {'message': 'No fields to update'}, 200
        
#         success = ProjectModel.update(project_id, update_data)
        
#         if success:
#             return {
#                 'message': 'Project updated successfully',
#                 'updated_fields': list(update_data.keys())
#             }, 200
        
#         return {'error': 'Failed to update project'}, 500
    
#     @staticmethod
#     def update_project_status(project_id):
#         """Update project status"""
#         user_id = get_jwt_identity()
#         data = request.get_json()
        
#         if not data.get('status'):
#             return {'error': 'Status is required'}, 400
        
#         project = ProjectModel.find_by_id(project_id)
#         if not project:
#             return {'error': 'Project not found'}, 404
        
#         # Check if user is owner
#         if project['owner_id'] != user_id:
#             return {'error': 'Only project owner can update status'}, 403
        
#         valid_statuses = ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled']
#         if data['status'] not in valid_statuses:
#             return {'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}, 400
        
#         success = ProjectModel.update_status(project_id, data['status'])
        
#         if success:
#             return {'message': f'Project status updated to {data["status"]}'}, 200
        
#         return {'error': 'Failed to update status'}, 500
    
#     @staticmethod
#     def add_member(project_id):
#         """Add a member to project"""
#         user_id = get_jwt_identity()
#         data = request.get_json()
        
#         if not data.get('user_id'):
#             return {'error': 'User ID is required'}, 400
        
#         project = ProjectModel.find_by_id(project_id)
#         if not project:
#             return {'error': 'Project not found'}, 404
        
#         # Check if user is owner
#         if project['owner_id'] != user_id:
#             return {'error': 'Only project owner can add members'}, 403
        
#         # Check if user exists
#         user_to_add = UserModel.find_by_id(data['user_id'])
#         if not user_to_add:
#             return {'error': 'User not found'}, 404
        
#         # Check if already a member
#         if data['user_id'] in project.get('members', []):
#             return {'error': 'User is already a member'}, 400
        
#         success = ProjectModel.add_member(project_id, data['user_id'])
        
#         if success:
#             return {'message': 'Member added successfully'}, 200
        
#         return {'error': 'Failed to add member'}, 500
    
#     @staticmethod
#     def remove_member(project_id):
#         """Remove a member from project"""
#         user_id = get_jwt_identity()
#         data = request.get_json()
        
#         if not data.get('user_id'):
#             return {'error': 'User ID is required'}, 400
        
#         project = ProjectModel.find_by_id(project_id)
#         if not project:
#             return {'error': 'Project not found'}, 404
        
#         # Check if user is owner
#         if project['owner_id'] != user_id:
#             return {'error': 'Only project owner can remove members'}, 403
        
#         # Cannot remove owner
#         if data['user_id'] == project['owner_id']:
#             return {'error': 'Cannot remove project owner'}, 400
        
#         success = ProjectModel.remove_member(project_id, data['user_id'])
        
#         if success:
#             return {'message': 'Member removed successfully'}, 200
        
#         return {'error': 'Failed to remove member'}, 500
    
#     # ============ DELETE ============
#     @staticmethod
#     def delete_project(project_id):
#         """Delete a project"""
#         user_id = get_jwt_identity()
        
#         project = ProjectModel.find_by_id(project_id)
#         if not project:
#             return {'error': 'Project not found'}, 404
        
#         # Check if user is owner
#         if project['owner_id'] != user_id:
#             return {'error': 'Only project owner can delete'}, 403
        
#         # Delete all tasks in project
#         TaskModel.delete_by_project(project_id)
        
#         # Delete project
#         success = ProjectModel.delete(project_id)
        
#         if success:
#             return {'message': 'Project deleted successfully'}, 200
        
#         return {'error': 'Failed to delete project'}, 500