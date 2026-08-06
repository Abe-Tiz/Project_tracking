from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS

# Initialize extensions
bcrypt = Bcrypt()
jwt = JWTManager()
cors = CORS()