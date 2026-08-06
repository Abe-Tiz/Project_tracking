import re

def validate_email(email):
    """Validate email format"""
    if not email:
        return False
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_password(password):
    """Validate password strength"""
    if not password:
        return False, 'Password is required'
    
    if len(password) < 8:
        return False, 'Password must be at least 8 characters'
    
    if not any(c.isupper() for c in password):
        return False, 'Password must contain at least one uppercase letter'
    
    if not any(c.islower() for c in password):
        return False, 'Password must contain at least one lowercase letter'
    
    if not any(c.isdigit() for c in password):
        return False, 'Password must contain at least one number'
    
    return True, 'Password is valid'

def validate_name(name):
    """Validate name"""
    if not name:
        return False, 'Name is required'
    
    if len(name.strip()) < 2:
        return False, 'Name must be at least 2 characters'
    
    if len(name.strip()) > 100:
        return False, 'Name must be less than 100 characters'
    
    return True, 'Name is valid'

def validate_role(role):
    """Validate role"""
    valid_roles = ['Admin', 'Project Manager', 'Team Member', 'Viewer']
    if role not in valid_roles:
        return False, f'Role must be one of: {", ".join(valid_roles)}'
    return True, 'Role is valid'