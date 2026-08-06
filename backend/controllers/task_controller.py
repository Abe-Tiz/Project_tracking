# from flask import request
# from flask_jwt_extended import get_jwt_identity
# from models.task_model import TaskModel
# from models.project_model import ProjectModel
# from models.user_model import UserModel

# class TaskController:
#     """Task Controller - Handles task operations"""
    
#     # ============ CREATE ============
#     @staticmethod
#     def create_task():
#         """Create a new task"""
#         data = request.get_json()
#         user_id = get_jwt_identity()
        
#         # Validate required fields
#         required = ['title', 'project_id']
#         for field in required:
#             if not data.get(field):
#                 return {'error': f'{field} is required'}, 400
        
#         # Check if project exists and user has access
#         project = ProjectModel.find_by_id(data['project_id'])
#         if not project:
#             return {'error': 'Project not found'}, 404
        
#         if project['owner_id'] != user_id and user_id not in project.get('members', []):
#             return {'error': 'Access denied'}, 403
        
#         # Prepare task data
#         task_data = {
#             'title': data['title'].strip(),
#             'description': data.get('description', '').strip(),
#             'project_id': data['project_id'],
#             'project_name': project.get('name'),
#             'created_by': user_id,
#             'created_by_name': UserModel.find_by_id(user_id).get('name'),
#             'assigned_to': data.get('assigned_to'),
#             'status': data.get('status', 'Todo'),
#             'priority': data.get('priority', 'Medium'),
#             'due_date': data.get('due_date'),
#             'estimated_hours': data.get('estimated_hours', 0),
#             'labels': data.get('labels', [])
#         }
        
#         # Create task
#         task_id = TaskModel.create(task_data)
        
#         return {
#             'message': 'Task created successfully',
#             'task_id': task_id,
#             'task': TaskModel.to_dict(TaskModel.find_by_id(task_id))
#         }, 201
    
#     # ============ READ ============
#     @staticmethod
#     def get_all_tasks():
#         """Get all tasks with filters"""
#         user_id = get_jwt_identity()
#         page = request.args.get('page', 1, type=int)
#         per_page = min(request.args.get('per_page', 20, type=int), 100)
#         skip = (page - 1) * per_page
        
#         # Get filter parameters
#         project_id = request.args.get('project_id')
#         status = request.args.get('status')
#         assigned_to = request.args.get('assigned_to')
#         priority = request.args.get('priority')
        
#         # Build filter query
#         filter_query = {}
        
#         if project_id:
#             filter_query['project_id'] = project_id
#         if status:
#             filter_query['status'] = status
#         if assigned_to:
#             filter_query['assigned_to'] = assigned_to
#         if priority:
#             filter_query['priority'] = priority
        
#         tasks = TaskModel.find_all(
#             filter_query=filter_query,
#             skip=skip,
#             limit=per_page,
#             sort=[('created_at', -1)]
#         )
#         total = TaskModel.count(filter_query)
        
#         return {
#             'tasks': TaskModel.to_list(tasks),
#             'pagination': {
#                 'page': page,
#                 'per_page': per_page,
#                 'total': total,
#                 'pages': (total + per_page - 1) // per_page
#             }
#         }, 200
    
#     @staticmethod
#     def get_task(task_id):
#         """Get a single task by ID"""
#         user_id = get_jwt_identity()
        
#         task = TaskModel.find_by_id(task_id)
#         if not task:
#             return {'error': 'Task not found'}, 404
        
#         # Check if user has access
#         project = ProjectModel.find_by_id(task['project_id'])
#         if project and project['owner_id'] != user_id and user_id not in project.get('members', []):
#             return {'error': 'Access denied'}, 403
        
#         return TaskModel.to_dict(task), 200
    
#     @staticmethod
#     def get_tasks_by_project(project_id):
#         """Get all tasks in a project"""
#         user_id = get_jwt_identity()
        
#         project = ProjectModel.find_by_id(project_id)
#         if not project:
#             return {'error': 'Project not found'}, 404
        
#         if project['owner_id'] != user_id and user_id not in project.get('members', []):
#             return {'error': 'Access denied'}, 403
        
#         tasks = TaskModel.find_by_project(project_id)
#         return {
#             'tasks': TaskModel.to_list(tasks),
#             'total': len(tasks)
#         }, 200
    
#     @staticmethod
#     def get_my_tasks():
#         """Get tasks assigned to current user"""
#         user_id = get_jwt_identity()
        
#         tasks = TaskModel.find_by_assignee(user_id)
#         return {
#             'tasks': TaskModel.to_list(tasks),
#             'total': len(tasks)
#         }, 200
    
#     @staticmethod
#     def get_task_stats():
#         """Get task statistics for current user"""
#         user_id = get_jwt_identity()
        
#         tasks = TaskModel.find_by_assignee(user_id)
#         total = len(tasks)
#         todo = len([t for t in tasks if t.get('status') == 'Todo'])
#         in_progress = len([t for t in tasks if t.get('status') == 'In Progress'])
#         review = len([t for t in tasks if t.get('status') == 'Review'])
#         done = len([t for t in tasks if t.get('status') == 'Done'])
        
#         return {
#             'total': total,
#             'todo': todo,
#             'in_progress': in_progress,
#             'review': review,
#             'done': done,
#             'completion_rate': (done / total * 100) if total > 0 else 0
#         }, 200
    
#     # ============ UPDATE ============
#     @staticmethod
#     def update_task(task_id):
#         """Update a task"""
#         user_id = get_jwt_identity()
#         data = request.get_json()
        
#         task = TaskModel.find_by_id(task_id)
#         if not task:
#             return {'error': 'Task not found'}, 404
        
#         # Check if user has access
#         project = ProjectModel.find_by_id(task['project_id'])
#         if project and project['owner_id'] != user_id and user_id not in project.get('members', []):
#             return {'error': 'Access denied'}, 403
        
#         update_data = {}
        
#         # Allowed fields to update
#         allowed_fields = ['title', 'description', 'status', 'priority', 'assigned_to', 'due_date', 'estimated_hours', 'labels']
#         for field in allowed_fields:
#             if field in data:
#                 update_data[field] = data[field]
        
#         if not update_data:
#             return {'message': 'No fields to update'}, 200
        
#         success = TaskModel.update(task_id, update_data)
        
#         if success:
#             return {
#                 'message': 'Task updated successfully',
#                 'updated_fields': list(update_data.keys())
#             }, 200
        
#         return {'error': 'Failed to update task'}, 500
    
#     @staticmethod
#     def update_task_status(task_id):
#         """Update task status"""
#         user_id = get_jwt_identity()
#         data = request.get_json()
        
#         if not data.get('status'):
#             return {'error': 'Status is required'}, 400
        
#         task = TaskModel.find_by_id(task_id)
#         if not task:
#             return {'error': 'Task not found'}, 404
        
#         # Check if user has access
#         project = ProjectModel.find_by_id(task['project_id'])
#         if project and project['owner_id'] != user_id and user_id not in project.get('members', []):
#             return {'error': 'Access denied'}, 403
        
#         valid_statuses = ['Todo', 'In Progress', 'Review', 'Done']
#         if data['status'] not in valid_statuses:
#             return {'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}, 400
        
#         success = TaskModel.update_status(task_id, data['status'])
        
#         if success:
#             return {'message': f'Task status updated to {data["status"]}'}, 200
        
#         return {'error': 'Failed to update status'}, 500
    
#     @staticmethod
#     def assign_task(task_id):
#         """Assign task to a user"""
#         user_id = get_jwt_identity()
#         data = request.get_json()
        
#         if not data.get('assigned_to'):
#             return {'error': 'User ID is required'}, 400
        
#         task = TaskModel.find_by_id(task_id)
#         if not task:
#             return {'error': 'Task not found'}, 404
        
#         # Check if user has access
#         project = ProjectModel.find_by_id(task['project_id'])
#         if project and project['owner_id'] != user_id and user_id not in project.get('members', []):
#             return {'error': 'Access denied'}, 403
        
#         # Check if user exists
#         user_to_assign = UserModel.find_by_id(data['assigned_to'])
#         if not user_to_assign:
#             return {'error': 'User not found'}, 404
        
#         success = TaskModel.assign_task(task_id, data['assigned_to'])
        
#         if success:
#             return {'message': 'Task assigned successfully'}, 200
        
#         return {'error': 'Failed to assign task'}, 500
    
#     @staticmethod
#     def add_comment(task_id):
#         """Add a comment to task"""
#         user_id = get_jwt_identity()
#         data = request.get_json()
        
#         if not data.get('comment'):
#             return {'error': 'Comment is required'}, 400
        
#         task = TaskModel.find_by_id(task_id)
#         if not task:
#             return {'error': 'Task not found'}, 404
        
#         # Check if user has access
#         project = ProjectModel.find_by_id(task['project_id'])
#         if project and project['owner_id'] != user_id and user_id not in project.get('members', []):
#             return {'error': 'Access denied'}, 403
        
#         user = UserModel.find_by_id(user_id)
#         comment_data = {
#             'user_id': user_id,
#             'user_name': user.get('name'),
#             'comment': data['comment'].strip()
#         }
        
#         success = TaskModel.add_comment(task_id, comment_data)
        
#         if success:
#             return {'message': 'Comment added successfully'}, 200
        
#         return {'error': 'Failed to add comment'}, 500
    
#     @staticmethod
#     def update_time_spent(task_id):
#         """Update time spent on task"""
#         user_id = get_jwt_identity()
#         data = request.get_json()
        
#         if not data.get('hours'):
#             return {'error': 'Hours is required'}, 400
        
#         task = TaskModel.find_by_id(task_id)
#         if not task:
#             return {'error': 'Task not found'}, 404
        
#         # Check if user has access
#         project = ProjectModel.find_by_id(task['project_id'])
#         if project and project['owner_id'] != user_id and user_id not in project.get('members', []):
#             return {'error': 'Access denied'}, 403
        
#         success = TaskModel.update_time_spent(task_id, data['hours'])
        
#         if success:
#             return {'message': 'Time updated successfully'}, 200
        
#         return {'error': 'Failed to update time'}, 500
    
#     # ============ DELETE ============
#     @staticmethod
#     def delete_task(task_id):
#         """Delete a task"""
#         user_id = get_jwt_identity()
        
#         task = TaskModel.find_by_id(task_id)
#         if not task:
#             return {'error': 'Task not found'}, 404
        
#         # Check if user has access
#         project = ProjectModel.find_by_id(task['project_id'])
#         if project and project['owner_id'] != user_id and user_id not in project.get('members', []):
#             return {'error': 'Access denied'}, 403
        
#         success = TaskModel.delete(task_id)
        
#         if success:
#             return {'message': 'Task deleted successfully'}, 200
        
#         return {'error': 'Failed to delete task'}, 500





from flask import request
from flask_jwt_extended import get_jwt_identity
from models.task_model import TaskModel
from models.project_model import ProjectModel
from models.user_model import UserModel

class TaskController:
    """Task Controller - Handles task operations"""
    
    # ============ CREATE ============
    @staticmethod
    def create_task():
        """Create a new task"""
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Validate required fields
        required = ['title', 'project_id']
        for field in required:
            if not data.get(field):
                return {'error': f'{field} is required'}, 400
        
        # Check if project exists and user has access
        project = ProjectModel.find_by_id(data['project_id'])
        if not project:
            return {'error': 'Project not found'}, 404
        
        if project['owner_id'] != user_id and user_id not in project.get('members', []):
            return {'error': 'Access denied'}, 403
        
        # Get user name for assigned_to
        assigned_to = data.get('assigned_to')
        assigned_to_name = ''
        if assigned_to:
            user = UserModel.find_by_id(assigned_to)
            if user:
                assigned_to_name = user.get('name', 'Unknown')
        
        # Prepare task data with proper fields
        task_data = {
            'title': data['title'].strip(),
            'description': data.get('description', '').strip(),
            'project_id': data['project_id'],
            'project_name': project.get('name'),
            'created_by': user_id,
            'created_by_name': UserModel.find_by_id(user_id).get('name', 'Unknown'),
            'assigned_to': assigned_to,
            'assigned_to_name': assigned_to_name,
            'status': data.get('status', 'Todo'),
            'priority': data.get('priority', 'Medium'),
            'due_date': data.get('due_date'),
            'estimated_hours': data.get('estimated_hours', 0),
            'labels': data.get('labels', []),
            'links': data.get('links', []),
            'attachments': data.get('attachments', []),
            'subtasks': data.get('subtasks', []),
            'comments': [],
            'time_spent': 0
        }
        
        # Create task
        task_id = TaskModel.create(task_data)
        task = TaskModel.find_by_id(task_id)
        
        return {
            'message': 'Task created successfully',
            'task_id': task_id,
            'task': TaskModel.to_dict(task)
        }, 201
    
    # ============ READ ============
    @staticmethod
    def get_all_tasks():
        """Get all tasks with filters"""
        user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        skip = (page - 1) * per_page
        
        # Get filter parameters
        project_id = request.args.get('project_id')
        status = request.args.get('status')
        assigned_to = request.args.get('assigned_to')
        priority = request.args.get('priority')
        search = request.args.get('search')
        
        # Build filter query
        filter_query = {}
        
        if project_id:
            filter_query['project_id'] = project_id
        if status:
            filter_query['status'] = status
        if assigned_to:
            filter_query['assigned_to'] = assigned_to
        if priority:
            filter_query['priority'] = priority
        
        if search:
            filter_query['$or'] = [
                {'title': {'$regex': search, '$options': 'i'}},
                {'description': {'$regex': search, '$options': 'i'}}
            ]
        
        tasks = TaskModel.find_all(
            filter_query=filter_query,
            skip=skip,
            limit=per_page,
            sort=[('created_at', -1)]
        )
        total = TaskModel.count(filter_query)
        
        return {
            'tasks': TaskModel.to_list(tasks),
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        }, 200
    
    @staticmethod
    def get_task(task_id):
        """Get a single task by ID"""
        user_id = get_jwt_identity()
        
        task = TaskModel.find_by_id(task_id)
        if not task:
            return {'error': 'Task not found'}, 404
        
        # Check if user has access
        project = ProjectModel.find_by_id(task['project_id'])
        if project and project['owner_id'] != user_id and user_id not in project.get('members', []):
            return {'error': 'Access denied'}, 403
        
        return TaskModel.to_dict(task), 200
    
    @staticmethod
    def get_tasks_by_project(project_id):
        """Get all tasks in a project"""
        user_id = get_jwt_identity()
        
        project = ProjectModel.find_by_id(project_id)
        if not project:
            return {'error': 'Project not found'}, 404
        
        if project['owner_id'] != user_id and user_id not in project.get('members', []):
            return {'error': 'Access denied'}, 403
        
        tasks = TaskModel.find_by_project(project_id)
        return {
            'tasks': TaskModel.to_list(tasks),
            'total': len(tasks)
        }, 200
    
    @staticmethod
    def get_my_tasks():
        """Get tasks assigned to current user"""
        user_id = get_jwt_identity()
        
        tasks = TaskModel.find_by_assignee(user_id)
        return {
            'tasks': TaskModel.to_list(tasks),
            'total': len(tasks)
        }, 200
    
    @staticmethod
    def get_task_stats():
        """Get task statistics for current user"""
        user_id = get_jwt_identity()
        
        tasks = TaskModel.find_by_assignee(user_id)
        total = len(tasks)
        todo = len([t for t in tasks if t.get('status') == 'Todo'])
        in_progress = len([t for t in tasks if t.get('status') == 'In Progress'])
        review = len([t for t in tasks if t.get('status') == 'Review'])
        done = len([t for t in tasks if t.get('status') == 'Done'])
        
        return {
            'total': total,
            'todo': todo,
            'in_progress': in_progress,
            'review': review,
            'done': done,
            'completion_rate': (done / total * 100) if total > 0 else 0
        }, 200
    
    # ============ UPDATE ============
    @staticmethod
    def update_task(task_id):
        """Update a task"""
        user_id = get_jwt_identity()
        data = request.get_json()
        
        task = TaskModel.find_by_id(task_id)
        if not task:
            return {'error': 'Task not found'}, 404
        
        # Check if user has access
        project = ProjectModel.find_by_id(task['project_id'])
        if project and project['owner_id'] != user_id and user_id not in project.get('members', []):
            return {'error': 'Access denied'}, 403
        
        update_data = {}
        
        # Allowed fields to update with proper handling
        allowed_fields = ['title', 'description', 'status', 'priority', 'due_date', 'estimated_hours']
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        # Handle assigned_to separately to update name
        if 'assigned_to' in data:
            update_data['assigned_to'] = data['assigned_to']
            if data['assigned_to']:
                user = UserModel.find_by_id(data['assigned_to'])
                update_data['assigned_to_name'] = user.get('name', 'Unknown') if user else ''
            else:
                update_data['assigned_to_name'] = ''
        
        # Handle arrays - ensure they're always lists
        array_fields = ['labels', 'links', 'attachments', 'subtasks']
        for field in array_fields:
            if field in data:
                update_data[field] = data[field] if data[field] is not None else []
        
        if not update_data:
            return {'message': 'No fields to update'}, 200
        
        success = TaskModel.update(task_id, update_data)
        
        if success:
            return {
                'message': 'Task updated successfully',
                'updated_fields': list(update_data.keys())
            }, 200
        
        return {'error': 'Failed to update task'}, 500
    
    @staticmethod
    def update_task_status(task_id):
        """Update task status"""
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data.get('status'):
            return {'error': 'Status is required'}, 400
        
        task = TaskModel.find_by_id(task_id)
        if not task:
            return {'error': 'Task not found'}, 404
        
        # Check if user has access
        project = ProjectModel.find_by_id(task['project_id'])
        if project and project['owner_id'] != user_id and user_id not in project.get('members', []):
            return {'error': 'Access denied'}, 403
        
        valid_statuses = ['Todo', 'In Progress', 'Review', 'Done']
        if data['status'] not in valid_statuses:
            return {'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}, 400
        
        success = TaskModel.update_status(task_id, data['status'])
        
        if success:
            return {'message': f'Task status updated to {data["status"]}'}, 200
        
        return {'error': 'Failed to update status'}, 500
    
    @staticmethod
    def assign_task(task_id):
        """Assign task to a user"""
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Support both 'user_id' and 'assigned_to' field names
        assigned_to = data.get('assigned_to') or data.get('user_id')
        
        if not assigned_to:
            return {'error': 'User ID is required'}, 400
        
        task = TaskModel.find_by_id(task_id)
        if not task:
            return {'error': 'Task not found'}, 404
        
        # Check if user has access
        project = ProjectModel.find_by_id(task['project_id'])
        if project and project['owner_id'] != user_id and user_id not in project.get('members', []):
            return {'error': 'Access denied'}, 403
        
        # Check if user exists
        user_to_assign = UserModel.find_by_id(assigned_to)
        if not user_to_assign:
            return {'error': 'User not found'}, 404
        
        success = TaskModel.assign_task(task_id, assigned_to)
        
        if success:
            return {
                'message': 'Task assigned successfully',
                'assigned_to': assigned_to,
                'assigned_to_name': user_to_assign.get('name', 'Unknown')
            }, 200
        
        return {'error': 'Failed to assign task'}, 500
    
    @staticmethod
    def add_comment(task_id):
        """Add a comment to task"""
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data.get('comment'):
            return {'error': 'Comment is required'}, 400
        
        task = TaskModel.find_by_id(task_id)
        if not task:
            return {'error': 'Task not found'}, 404
        
        # Check if user has access
        project = ProjectModel.find_by_id(task['project_id'])
        if project and project['owner_id'] != user_id and user_id not in project.get('members', []):
            return {'error': 'Access denied'}, 403
        
        user = UserModel.find_by_id(user_id)
        comment_data = {
            'user_id': user_id,
            'user_name': user.get('name', 'Unknown'),
            'comment': data['comment'].strip()
        }
        
        success = TaskModel.add_comment(task_id, comment_data)
        
        if success:
            return {'message': 'Comment added successfully'}, 200
        
        return {'error': 'Failed to add comment'}, 500
    
    @staticmethod
    def update_time_spent(task_id):
        """Update time spent on task"""
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data.get('hours'):
            return {'error': 'Hours is required'}, 400
        
        task = TaskModel.find_by_id(task_id)
        if not task:
            return {'error': 'Task not found'}, 404
        
        # Check if user has access
        project = ProjectModel.find_by_id(task['project_id'])
        if project and project['owner_id'] != user_id and user_id not in project.get('members', []):
            return {'error': 'Access denied'}, 403
        
        success = TaskModel.update_time_spent(task_id, data['hours'])
        
        if success:
            return {'message': 'Time updated successfully'}, 200
        
        return {'error': 'Failed to update time'}, 500
    
    # ============ DELETE ============
    @staticmethod
    def delete_task(task_id):
        """Delete a task"""
        user_id = get_jwt_identity()
        
        task = TaskModel.find_by_id(task_id)
        if not task:
            return {'error': 'Task not found'}, 404
        
        # Check if user has access
        project = ProjectModel.find_by_id(task['project_id'])
        if project and project['owner_id'] != user_id and user_id not in project.get('members', []):
            return {'error': 'Access denied'}, 403
        
        success = TaskModel.delete(task_id)
        
        if success:
            return {'message': 'Task deleted successfully'}, 200
        
        return {'error': 'Failed to delete task'}, 500