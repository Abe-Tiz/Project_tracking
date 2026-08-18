# logging_config.py
import logging
from logging.handlers import RotatingFileHandler
import os
from flask import Flask

def configure_logging(app: Flask):
    """Configure logging for the application"""
    
    # Remove default handlers
    app.logger.handlers.clear()
    
    # Set logging level
    log_level = os.getenv('LOG_LEVEL', 'INFO')
    app.logger.setLevel(getattr(logging, log_level))
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Console handler with color support
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    app.logger.addHandler(console_handler)
    
    # File handler with rotation
    log_dir = os.getenv('LOG_DIR', 'logs')
    if not os.path.exists(log_dir):
        try:
            os.makedirs(log_dir)
        except:
            print(f"⚠️  Could not create log directory: {log_dir}")
    
    try:
        log_file = os.path.join(log_dir, 'app.log')
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=10485760,  # 10MB
            backupCount=10
        )
        file_handler.setFormatter(formatter)
        app.logger.addHandler(file_handler)
        app.logger.info(f"📄 Log file: {log_file}")
    except Exception as e:
        print(f"⚠️  Could not create log file: {str(e)}")
    
    # Set Werkzeug logger level
    logging.getLogger('werkzeug').setLevel(logging.WARNING)
    
    # Log startup info
    app.logger.info('=' * 80)
    app.logger.info('✅ Logging configured successfully')
    app.logger.info(f'   📊 Log level: {log_level}')
    app.logger.info('=' * 80)