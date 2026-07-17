import random
import string
from datetime import datetime

def generate_id(prefix):
    timestamp = datetime.utcnow().timestamp()
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return f"{prefix}_{int(timestamp)}{random_str}"

def parse_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ('true', '1', 'yes', 'on')
    return bool(value)

def parse_int(value, default=0):
    try:
        return int(value)
    except (ValueError, TypeError):
        return default

def parse_float(value, default=0.0):
    try:
        return float(value)
    except (ValueError, TypeError):
        return default
