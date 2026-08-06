# routes/report_routes.py
from flask import Blueprint, jsonify, request, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from controllers.report_controller import ReportController
import logging
from controllers.weekly_report_controller import WeeklyReportController

logger = logging.getLogger(__name__)

report_bp = Blueprint('reports', __name__)

# Handle OPTIONS requests for CORS preflight
@report_bp.route('/', methods=['OPTIONS'])
@report_bp.route('/<report_id>', methods=['OPTIONS'])
@report_bp.route('/project/<project_id>', methods=['OPTIONS'])
@report_bp.route('/<report_id>/export', methods=['OPTIONS'])
def handle_options(report_id=None, project_id=None):
    """Handle OPTIONS requests for CORS preflight"""
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Max-Age', '86400')
    return response

# ============ REPORT ROUTES ============

@report_bp.route('/project/<project_id>', methods=['POST'])
@jwt_required()
def generate_project_report(project_id):
    """Generate a comprehensive project report"""
    logger.info(f"POST /reports/project/{project_id} - Generating report")
    result, status = ReportController.generate_project_report(project_id)
    return jsonify(result), status

@report_bp.route('/<report_id>', methods=['GET'])
@jwt_required()
def get_report(report_id):
    """Get a specific report by ID"""
    logger.info(f"GET /reports/{report_id} - Fetching report")
    result, status = ReportController.get_report(report_id)
    return jsonify(result), status

@report_bp.route('/project/<project_id>', methods=['GET'])
@jwt_required()
def get_project_reports(project_id):
    """Get all reports for a project"""
    logger.info(f"GET /reports/project/{project_id} - Fetching project reports")
    result, status = ReportController.get_project_reports(project_id)
    return jsonify(result), status

@report_bp.route('/<report_id>', methods=['DELETE'])
@jwt_required()
def delete_report(report_id):
    """Delete a report"""
    logger.info(f"DELETE /reports/{report_id} - Deleting report")
    result, status = ReportController.delete_report(report_id)
    return jsonify(result), status


from controllers.weekly_report_controller import WeeklyReportController

@report_bp.route('/weekly/project/<project_id>', methods=['POST'])
@jwt_required()
def generate_weekly_report(project_id):
    """Generate a weekly status report"""
    logger.info(f"POST /reports/weekly/project/{project_id} - Generating weekly report")
    
    try:
        response = WeeklyReportController.generate_weekly_report(project_id)
        
        # If it's a Response object, return it directly
        if hasattr(response, 'headers'):
            return response
        
        # Otherwise, it's a tuple (result, status)
        if isinstance(response, tuple):
            result, status = response
            return jsonify(result), status
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Error in weekly report route: {str(e)}")
        return jsonify({'error': str(e)}), 500


@report_bp.route('/<report_id>/export', methods=['GET'])
@jwt_required()
def export_report(report_id):
    """Export a report in specified format"""
    format_type = request.args.get('format', 'pdf')
    logger.info(f"GET /reports/{report_id}/export - Exporting as {format_type}")
    
    # The controller now returns a Response object directly
    response = ReportController.export_report(report_id, format_type)
    
    # If it's a Response object, return it directly
    if hasattr(response, 'headers'):
        return response
    
    # Otherwise, it's a tuple (result, status)
    result, status = response
    return jsonify(result), status