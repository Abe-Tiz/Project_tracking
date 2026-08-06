from flask import Flask, jsonify, request, make_response, send_from_directory
from flask_jwt_extended import JWTManager
from flask_cors import CORS
import os
from datetime import datetime

from config import get_config
from database import db, get_connection_status
from extensions import bcrypt, jwt

# Import logging configuration and get logger
from logging_config import configure_logging
import logging

# Initialize logger
logger = logging.getLogger(__name__)

def create_app():
    """Application factory"""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(get_config())
    
    # Configure logging FIRST
    configure_logging(app)
    
    logger.info("🚀 Starting Project Tracking System API")
    logger.info(f"📁 Environment: {app.config.get('ENV', 'development')}")
    
    # Create uploads directory if it doesn't exist
    os.makedirs('uploads/images', exist_ok=True)
    os.makedirs('uploads/files', exist_ok=True)
    
    # Get allowed origins from config
    allowed_origins = app.config.get('CORS_ORIGINS', ['http://localhost:5173', 'http://localhost:3000'])
    
    # Initialize CORS with comprehensive configuration
    CORS(
        app,
        origins=allowed_origins,
        methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allow_headers=['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
        expose_headers=['Content-Type', 'Authorization'],
        
        supports_credentials=True,
        max_age=86400
    )
    
    # Initialize other extensions
    bcrypt.init_app(app)
    jwt.init_app(app)
    
    # Initialize database
    try:
        db.connect(
            app.config['MONGO_URI'],
            app.config['MONGO_DBNAME']
        )
        logger.info("✅ Database initialized successfully")
        logger.info(f"📊 Database: {app.config['MONGO_DBNAME']}")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {str(e)}")
        logger.error(f"⚠️  Please check your MongoDB connection string")
    
    # JWT error handlers
    @jwt.unauthorized_loader
    def unauthorized_response(callback):
        logger.warning(f"Unauthorized access attempt: {callback}")
        return jsonify({'error': 'Missing or invalid token'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_response(callback):
        logger.warning(f"Invalid token attempt: {callback}")
        return jsonify({'error': 'Invalid token'}), 401
    
    # @jwt.expired_token_loader
    # def expired_token_response(callback):
    #     logger.warning("Expired token used")
    #     return jsonify({'error': 'Token has expired'}), 401


    @jwt.expired_token_loader
    def expired_token_response(jwt_header, jwt_data):  # 2 parameters
        logger.warning("Expired token used")
        return jsonify({'error': 'Token has expired'}), 401
    
    @jwt.user_identity_loader
    def user_identity_lookup(user):
        return str(user)
    
    # Import and register routes
    from routes.auth_routes import auth_bp
    from routes.project_routes import project_bp
    from routes.task_routes import task_bp
    from routes.report_routes import report_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(project_bp, url_prefix='/api/projects')
    app.register_blueprint(task_bp, url_prefix='/api/tasks')
    app.register_blueprint(report_bp, url_prefix='/api/reports')
    
    logger.info("✅ Routes registered successfully")
    
    # ============ CORS HANDLER FOR ALL OPTIONS REQUESTS ============
    @app.before_request
    def handle_preflight():
        """Handle preflight requests globally"""
        if request.method == "OPTIONS":
            logger.info(f"🔄 Preflight request: {request.path}")
            response = make_response()
            origin = request.headers.get('Origin', '*')
            response.headers.add("Access-Control-Allow-Origin", origin)
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
            response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            response.headers.add('Access-Control-Max-Age', '86400')
            return response
    
    # ============ SERVE UPLOADED FILES ============
    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        """Serve uploaded files"""
        return send_from_directory('uploads', filename)
    
    # Health check
    @app.route('/health')
    def health_check():
        db_status = db.health_check()
        connection_status = get_connection_status()
        
        logger.info(f"Health check requested - DB Status: {connection_status.get('connected')}")
        
        return jsonify({
            'status': 'ok' if connection_status.get('connected') else 'degraded',
            'timestamp': datetime.utcnow().isoformat(),
            'environment': app.config.get('ENV', 'development'),
            'database': db_status,
            'connection_details': connection_status
        }), 200
    
    
    @app.route('/debug/routes', methods=['GET'])
    def debug_routes():
        """Debug endpoint to see all registered routes"""
        routes = []
        for rule in app.url_map.iter_rules():
            routes.append({
                'endpoint': rule.endpoint,
                'methods': list(rule.methods),
                'path': str(rule)
            })
        return jsonify(routes), 200


    # Root endpoint
    @app.route('/')
    def root():
        logger.info("Root endpoint accessed")
        return jsonify({
            'message': 'Project Tracking System API',
            'version': '1.0.0',
            'status': 'online',
            'endpoints': {
                'auth': '/api/auth',
                'projects': '/api/projects',
                'tasks': '/api/tasks',
                'health': '/health'
            }
        }), 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        logger.warning(f"404 error: {request.path}")
        return jsonify({'error': 'Resource not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f'Internal error: {str(error)}', exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500
    
    # Global CORS header middleware (fallback)
    @app.after_request
    def after_request(response):
        origin = request.headers.get('Origin')
        if origin and origin in allowed_origins:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin'
            response.headers.add('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type')
        return response
    
    # Request logging middleware
    @app.before_request
    def log_request_info():
        """Log all incoming requests"""
        if request.method != 'OPTIONS':
            logger.info(f"📥 {request.method} {request.path}")
            if request.method in ['POST', 'PUT', 'PATCH']:
                try:
                    if request.is_json:
                        logger.debug(f"📦 Request body: {request.get_json()}")
                except:
                    pass
    
    @app.after_request
    def log_response_info(response):
        """Log all outgoing responses"""
        if request.method != 'OPTIONS':
            logger.info(f"📤 {request.method} {request.path} - Status: {response.status_code}")
        return response
    
    logger.info("✅ Application initialization complete")
    return app





# Create app instance
app = create_app()

# REMOVE THIS FUNCTION - It's causing the infinite redirect loop
# @app.before_request
# def remove_trailing_slash():
#     """Remove trailing slash from URLs to prevent redirects"""
#     if request.path != '/' and request.path.endswith('/'):
#         new_path = request.path.rstrip('/')
#         if request.query_string:
#             new_path += '?' + request.query_string.decode('utf-8')
#         if request.method != 'OPTIONS':
#             return redirect(new_path)

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    
    print("\n" + "="*60)
    print("🚀 PROJECT TRACKING SYSTEM API")
    print("="*60)
    print(f"📍 Environment: {app.config.get('ENV', 'development')}")
    print(f"📍 Port: {port}")
    print(f"📍 Debug: {app.config.get('DEBUG', False)}")
    print(f"📍 CORS Origins: {app.config.get('CORS_ORIGINS', [])}")
    
    # Get connection status
    status = get_connection_status()
    if status.get('connected'):
        print(f"✅ Database: Connected to {status.get('db_name')}")
        print(f"   📍 Host: {status.get('host')}")
    else:
        print(f"❌ Database: {status.get('message')}")
        print("   ⚠️  Please check your MongoDB connection")
    
    print("="*60)
    print("\n📌 Available endpoints:")
    print("  GET  /                    - API Information")
    print("  GET  /health              - Health Check")
    print("  GET  /uploads/<path>      - Serve Uploaded Files")
    print("  POST /api/auth/register   - User Registration")
    print("  POST /api/auth/login      - User Login")
    print("  GET  /api/auth/profile    - User Profile")
    print("  PUT  /api/auth/profile    - Update Profile")
    print("  POST /api/auth/change-password - Change Password")
    print("  GET  /api/projects        - Get Projects")
    print("  POST /api/projects        - Create Project")
    print("  GET  /api/projects/<id>   - Get Project by ID")
    print("  PUT  /api/projects/<id>   - Update Project")
    print("  DELETE /api/projects/<id> - Delete Project")
    print("="*60)
    print("\n📋 Logs will be written to: logs/app.log")
    print("📋 Console logs will show colored output")
    print("\n")
    
    try:
        app.run(
            host='0.0.0.0',
            port=port,
            debug=app.config.get('DEBUG', False)
        )
    except Exception as e:
        logger.error(f"Failed to start application: {str(e)}", exc_info=True)
        print(f"\n❌ Failed to start application: {str(e)}")