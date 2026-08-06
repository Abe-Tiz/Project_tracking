# cors_config.py
from flask_cors import CORS
import os

def setup_cors(app):
    """Setup CORS for the Flask application"""
    
    # Get allowed origins from environment or use default
    origins = os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173')
    allowed_origins = [origin.strip() for origin in origins.split(',')]
    
    # Configure CORS with proper settings
    CORS(app,
         origins=allowed_origins,
         methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
         allow_headers=[
             'Content-Type',
             'Authorization',
             'X-Requested-With',
             'Accept',
             'Origin',
             'Access-Control-Request-Method',
             'Access-Control-Request-Headers'
         ],
         expose_headers=[
             'Content-Type',
             'Authorization',
             'X-Total-Count'
         ],
         supports_credentials=True,
         max_age=86400  # 24 hours cache for preflight
    )
    
    # Add a before_request handler for OPTIONS requests
    @app.before_request
    def handle_options():
        """Handle preflight OPTIONS requests explicitly"""
        if request.method == 'OPTIONS':
            from flask import make_response
            response = make_response()
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            return response
    
    # After request handler to ensure headers are always present
    @app.after_request
    def after_request(response):
        """Ensure CORS headers are always present in every response"""
        # Get origin from request
        origin = request.headers.get('Origin')
        
        # Only add CORS headers if origin is allowed
        if origin and any(allowed_origin in origin for allowed_origin in allowed_origins):
            response.headers.add('Access-Control-Allow-Origin', origin)
            response.headers.add('Access-Control-Allow-Credentials', 'true')
        
        return response
    
    print(f"✅ CORS configured for origins: {allowed_origins}")