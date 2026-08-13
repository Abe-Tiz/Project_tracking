import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration"""
    
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-12345')
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    
    # MongoDB
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb+srv://abebetizazu157_db_user:3gEgfrPR77OKyfEo@cluster0.fipvg8q.mongodb.net/')
    MONGO_DBNAME = os.getenv('MONGO_DBNAME', 'project_tracker')
    
    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-12345')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # Bcrypt
    BCRYPT_LOG_ROUNDS = 12

class DevelopmentConfig(Config):
    DEBUG = True
    MONGO_DBNAME = 'project_tracker_dev'

class TestingConfig(Config):
    TESTING = True
    DEBUG = True
    MONGO_DBNAME = 'project_tracker_test'

class ProductionConfig(Config):
    DEBUG = False
    MONGO_DBNAME = 'project_tracker_prod'

config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

def get_config():
    env = os.getenv('FLASK_ENV', 'development')
    return config.get(env, config['default'])









# import os
# from datetime import timedelta
# from dotenv import load_dotenv

# load_dotenv()

# class Config:
#     """Application configuration"""
    
#     # Flask
#     SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-12345')
#     DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    
#     # MongoDB
#     MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
#     MONGO_DBNAME = os.getenv('MONGO_DBNAME', 'project_tracker')
    
#     # JWT
#     JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-12345')
#     JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
#     JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
#     # Bcrypt
#     BCRYPT_LOG_ROUNDS = 12
    
#     # CORS - Use specific origins, not wildcard when using credentials
#     CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000').split(',')

# class DevelopmentConfig(Config):
#     DEBUG = True
#     MONGO_DBNAME = 'project_tracker_dev'
#     # Specific origins for development
#     CORS_ORIGINS = ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173']

# class TestingConfig(Config):
#     TESTING = True
#     DEBUG = True
#     MONGO_DBNAME = 'project_tracker_test'
#     CORS_ORIGINS = ['http://localhost:5173']

# class ProductionConfig(Config):
#     DEBUG = False
#     MONGO_DBNAME = 'project_tracker_prod'
#     CORS_ORIGINS = os.getenv('PROD_CORS_ORIGINS', 'https://yourdomain.com').split(',')

# config = {
#     'development': DevelopmentConfig,
#     'testing': TestingConfig,
#     'production': ProductionConfig,
#     'default': DevelopmentConfig
# }

# def get_config():
#     env = os.getenv('FLASK_ENV', 'development')
#     return config.get(env, config['default'])