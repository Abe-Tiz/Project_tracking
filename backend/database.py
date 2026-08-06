from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, OperationFailure, ServerSelectionTimeoutError
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class Database:
    """MongoDB Database Connection Manager"""
    _instance = None
    _client = None
    _db = None
    _connection_status = {
        'connected': False,
        'message': 'Not connected',
        'timestamp': None,
        'db_name': None,
        'host': None
    }
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
        return cls._instance
    
    def connect(self, uri, dbname):
        """Connect to MongoDB"""
        try:
            # Parse host from URI for display
            host = uri.split('@')[-1].split('/')[0] if '@' in uri else uri.split('/')[2]
            
            self._client = MongoClient(
                uri,
                serverSelectionTimeoutMS=5000,  # 5 seconds timeout
                connectTimeoutMS=5000
            )
            
            # Test connection by pinging
            self._client.admin.command('ping')
            
            self._db = self._client[dbname]
            
            # Update connection status
            self._connection_status = {
                'connected': True,
                'message': 'Connected successfully',
                'timestamp': datetime.utcnow().isoformat(),
                'db_name': dbname,
                'host': host
            }
            
            logger.info(f"✅ Connected to MongoDB: {dbname} at {host}")
            
            # Create indexes
            self._create_indexes()
            
            return self._db
        except ServerSelectionTimeoutError as e:
            self._connection_status = {
                'connected': False,
                'message': f'Server selection timeout: {str(e)}',
                'timestamp': datetime.utcnow().isoformat(),
                'db_name': dbname,
                'host': None
            }
            logger.error(f"❌ Server selection timeout: {str(e)}")
            raise
        except ConnectionFailure as e:
            self._connection_status = {
                'connected': False,
                'message': f'Connection failed: {str(e)}',
                'timestamp': datetime.utcnow().isoformat(),
                'db_name': dbname,
                'host': None
            }
            logger.error(f"❌ Failed to connect to MongoDB: {str(e)}")
            raise
        except Exception as e:
            self._connection_status = {
                'connected': False,
                'message': f'Error: {str(e)}',
                'timestamp': datetime.utcnow().isoformat(),
                'db_name': dbname,
                'host': None
            }
            logger.error(f"❌ Error connecting to MongoDB: {str(e)}")
            raise
    
    def get_db(self):
        """Get database instance"""
        if self._db is None:
            raise Exception("Database not connected. Call connect() first.")
        return self._db
    
    def get_collection(self, name):
        """Get a collection"""
        return self.get_db()[name]
    
    def _create_indexes(self):
        """Create necessary indexes"""
        try:
            # Users collection indexes
            users = self._db.users
            users.create_index([('email', 1)], unique=True)
            users.create_index([('created_at', -1)])
            users.create_index([('is_active', 1)])
            
            logger.info("✅ Database indexes created")
        except OperationFailure as e:
            logger.error(f"❌ Failed to create indexes: {str(e)}")
    
    def close(self):
        """Close database connection"""
        if self._client:
            self._client.close()
            self._connection_status = {
                'connected': False,
                'message': 'Connection closed',
                'timestamp': datetime.utcnow().isoformat(),
                'db_name': self._connection_status.get('db_name'),
                'host': self._connection_status.get('host')
            }
            logger.info("Database connection closed")
    
    def get_connection_status(self):
        """Get current connection status"""
        # Update status if connection is lost
        if self._connection_status.get('connected') and self._client:
            try:
                self._client.admin.command('ping')
                self._connection_status['message'] = 'Connected and healthy'
                self._connection_status['timestamp'] = datetime.utcnow().isoformat()
            except Exception as e:
                self._connection_status['connected'] = False
                self._connection_status['message'] = f'Connection lost: {str(e)}'
                self._connection_status['timestamp'] = datetime.utcnow().isoformat()
        
        return self._connection_status
    
    def health_check(self):
        """Check database health"""
        status = self.get_connection_status()
        
        if status['connected']:
            try:
                # Get database stats
                stats = self._db.command('dbStats')
                collections = self._db.list_collection_names()
                
                return {
                    'status': 'healthy',
                    'message': status['message'],
                    'database': status['db_name'],
                    'host': status['host'],
                    'stats': {
                        'collections': len(collections),
                        'data_size': stats.get('dataSize', 0),
                        'storage_size': stats.get('storageSize', 0),
                        'indexes': stats.get('indexes', 0)
                    },
                    'collections': collections,
                    'timestamp': status['timestamp']
                }
            except Exception as e:
                return {
                    'status': 'unhealthy',
                    'message': f'Health check failed: {str(e)}',
                    'database': status.get('db_name'),
                    'host': status.get('host'),
                    'timestamp': datetime.utcnow().isoformat()
                }
        
        return {
            'status': 'disconnected',
            'message': status['message'],
            'database': status.get('db_name'),
            'host': status.get('host'),
            'timestamp': status.get('timestamp')
        }

# Singleton instance
db = Database()

def get_db():
    """Get database instance"""
    return db.get_db()

def get_collection(name):
    """Get a collection"""
    return db.get_collection(name)

def get_connection_status():
    """Get connection status"""
    return db.get_connection_status()