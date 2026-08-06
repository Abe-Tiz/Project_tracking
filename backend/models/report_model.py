# models/report_model.py
from datetime import datetime
from bson import ObjectId
from database import get_collection
import logging

logger = logging.getLogger(__name__)

class ReportModel:
    """Report Model - Handles report generation and storage"""
    collection_name = 'reports'
    
    @classmethod
    def get_collection(cls):
        """Get the reports collection"""
        return get_collection(cls.collection_name)
    
    @classmethod
    def create(cls, report_data):
        """Create a new report"""
        try:
            # Ensure report_data is a dictionary
            if not report_data:
                report_data = {}
            
            report_data['created_at'] = datetime.utcnow()
            report_data['updated_at'] = datetime.utcnow()
            report_data['status'] = report_data.get('status', 'generating')
            
            result = cls.get_collection().insert_one(report_data)
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Error creating report: {str(e)}")
            return None
    
    @classmethod
    def find_by_id(cls, report_id):
        """Find report by ID"""
        try:
            return cls.get_collection().find_one({'_id': ObjectId(report_id)})
        except:
            return None
    
    @classmethod
    def find_by_project(cls, project_id, skip=0, limit=100):
        """Find reports by project"""
        return list(cls.get_collection().find(
            {'project_id': project_id}
        ).skip(skip).limit(limit).sort('created_at', -1))
    
    @classmethod
    def find_by_user(cls, user_id, skip=0, limit=100):
        """Find reports by user"""
        return list(cls.get_collection().find(
            {'generated_by': user_id}
        ).skip(skip).limit(limit).sort('created_at', -1))
    
    @classmethod
    def update(cls, report_id, update_data):
        """Update a report"""
        update_data['updated_at'] = datetime.utcnow()
        result = cls.get_collection().update_one(
            {'_id': ObjectId(report_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    @classmethod
    def update_status(cls, report_id, status):
        """Update report status"""
        return cls.update(report_id, {'status': status})
    
    @classmethod
    def delete(cls, report_id):
        """Delete a report"""
        result = cls.get_collection().delete_one({'_id': ObjectId(report_id)})
        return result.deleted_count > 0
    
    @staticmethod
    def to_dict(report):
        """Convert MongoDB document to dict"""
        if not report:
            return None
        report_dict = dict(report)
        if '_id' in report_dict:
            report_dict['_id'] = str(report_dict['_id'])
        return report_dict
    
    @staticmethod
    def to_list(reports):
        """Convert multiple reports to list"""
        return [ReportModel.to_dict(r) for r in reports]