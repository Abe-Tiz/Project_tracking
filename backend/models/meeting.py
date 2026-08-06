from app import mongo
from datetime import datetime
from bson import ObjectId

class Meeting:
    collection = mongo.db.meetings
    
    TYPES = ['Planning', 'Review', 'Retrospective', 'Stakeholder', 'Standup', 'Workshop', 'Ad-hoc']
    
    @staticmethod
    def create(meeting_data):
        meeting_data['created_at'] = datetime.utcnow()
        meeting_data['updated_at'] = datetime.utcnow()
        
        result = Meeting.collection.insert_one(meeting_data)
        return str(result.inserted_id)
    
    @staticmethod
    def find_by_id(meeting_id):
        return Meeting.collection.find_one({'_id': ObjectId(meeting_id)})
    
    @staticmethod
    def find_by_project(project_id, page=1, per_page=10):
        skip = (page - 1) * per_page
        total = Meeting.collection.count_documents({'project_id': ObjectId(project_id)})
        
        meetings = Meeting.collection.find({'project_id': ObjectId(project_id)}) \
            .sort('scheduled_at', -1) \
            .skip(skip) \
            .limit(per_page)
        
        return {
            'data': list(meetings),
            'total': total,
            'page': page,
            'per_page': per_page,
            'pages': (total + per_page - 1) // per_page
        }
    
    @staticmethod
    def update(meeting_id, update_data):
        update_data['updated_at'] = datetime.utcnow()
        result = Meeting.collection.update_one(
            {'_id': ObjectId(meeting_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    @staticmethod
    def add_action_item(meeting_id, action_item):
        action_item['created_at'] = datetime.utcnow()
        action_item['status'] = 'Pending'
        result = Meeting.collection.update_one(
            {'_id': ObjectId(meeting_id)},
            {'$push': {'action_items': action_item}}
        )
        return result.modified_count > 0