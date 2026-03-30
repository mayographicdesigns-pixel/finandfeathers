"""Shared test configuration and fixtures.
All test secrets/credentials are centralized here to avoid hardcoding in individual test files.
"""
import os
import uuid

# Base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = os.environ.get('TEST_BASE_URL', 'http://localhost:8001')

# Test credentials (NOT production secrets)
TEST_ADMIN_USERNAME = os.environ.get('TEST_ADMIN_USERNAME', 'admin')
TEST_ADMIN_PASSWORD = os.environ.get('TEST_ADMIN_PASSWORD', 'admin123')
TEST_USER_PASSWORD = os.environ.get('TEST_USER_PASSWORD', 'testpass123')
TEST_ADMIN_TOKEN = os.environ.get('TEST_ADMIN_TOKEN', 'test-admin-token')


def get_admin_auth_header():
    """Returns Authorization header for admin endpoints."""
    return {'Authorization': f'Bearer {TEST_ADMIN_TOKEN}'}


def unique_email(prefix='test'):
    """Generate a unique test email."""
    return f"{prefix}_{uuid.uuid4().hex[:8]}@test.com"


def unique_name(prefix='TestUser'):
    """Generate a unique test name."""
    return f"{prefix}_{uuid.uuid4().hex[:6]}"
