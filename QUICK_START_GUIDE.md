# FastAPI Authentication - Quick Start Guide

This guide shows you how to start implementing the authentication backend **step-by-step** without writing code yet.

---

## How to Use This Guide

1. **Read** the `AUTH_IMPLEMENTATION_GUIDE.md` to understand the architecture
2. **Use** the `IMPLEMENTATION_CHECKLIST.md` to track your progress
3. **Follow** this Quick Start Guide to begin implementation

---

## Prerequisites

Before starting, ensure you have:
- [ ] Python 3.10+ installed
- [ ] PostgreSQL installed
- [ ] Redis installed
- [ ] Git installed
- [ ] A code editor (VS Code, PyCharm, etc.)

---

## Step 1: Project Initialization

### Create Project Directory
```bash
# Navigate to your desired location
cd /path/to/your/projects

# Create backend directory
mkdir fastapi-auth-backend
cd fastapi-auth-backend

# Initialize git
git init
```

### Create Virtual Environment
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate
```

### Create Directory Structure
```bash
# Create main application directories
mkdir -p app/{config,core,models,schemas,api/v1/endpoints,services/auth,middleware,db/repositories,utils}

# Create test directories
mkdir -p tests/{unit,integration}

# Create config directories
mkdir -p app/config/saml/certs

# Create __init__.py files (marks directories as Python packages)
touch app/__init__.py
touch app/config/__init__.py
touch app/core/__init__.py
touch app/models/__init__.py
touch app/schemas/__init__.py
touch app/api/__init__.py
touch app/api/v1/__init__.py
touch app/api/v1/endpoints/__init__.py
touch app/services/__init__.py
touch app/services/auth/__init__.py
touch app/middleware/__init__.py
touch app/db/__init__.py
touch app/db/repositories/__init__.py
touch app/utils/__init__.py
touch tests/__init__.py
touch tests/unit/__init__.py
touch tests/integration/__init__.py
```

Your directory structure should now look like this:
```
fastapi-auth-backend/
├── app/
│   ├── __init__.py
│   ├── config/
│   │   ├── __init__.py
│   │   └── saml/
│   │       └── certs/
│   ├── core/
│   │   └── __init__.py
│   ├── models/
│   │   └── __init__.py
│   ├── schemas/
│   │   └── __init__.py
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       └── endpoints/
│   │           └── __init__.py
│   ├── services/
│   │   ├── __init__.py
│   │   └── auth/
│   │       └── __init__.py
│   ├── middleware/
│   │   └── __init__.py
│   ├── db/
│   │   ├── __init__.py
│   │   └── repositories/
│   │       └── __init__.py
│   └── utils/
│       └── __init__.py
├── tests/
│   ├── __init__.py
│   ├── unit/
│   │   └── __init__.py
│   └── integration/
│       └── __init__.py
└── venv/
```

---

## Step 2: Create Requirements Files

### Create requirements.txt
```bash
cat > requirements.txt << 'EOF'
# FastAPI and ASGI server
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6

# Pydantic for data validation
pydantic==2.4.2
pydantic-settings==2.0.3

# Database
sqlalchemy==2.0.23
alembic==1.12.1
psycopg2-binary==2.9.9

# Authentication
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4

# OAuth / OIDC
authlib==1.2.1
httpx==0.25.1

# SAML / SSO
python3-saml==1.15.0
xmlsec==1.3.13

# LDAP
python-ldap==3.4.3

# Redis
redis==5.0.1

# Utilities
python-dateutil==2.8.2
EOF
```

### Create requirements-dev.txt
```bash
cat > requirements-dev.txt << 'EOF'
# Testing
pytest==7.4.3
pytest-asyncio==0.21.1
pytest-cov==4.1.0
pytest-mock==3.12.0

# Test utilities
faker==19.13.0
factory-boy==3.3.0

# Code quality
black==23.11.0
ruff==0.1.6
mypy==1.7.1

# Type stubs
types-passlib==1.7.7.13
types-python-jose==3.3.4.8
types-redis==4.6.0.11
EOF
```

### Install Dependencies
```bash
# Install production dependencies
pip install -r requirements.txt

# Install development dependencies
pip install -r requirements-dev.txt

# Verify installation
pip list
```

---

## Step 3: Environment Configuration

### Create .env.example
```bash
cat > .env.example << 'EOF'
# Application
APP_NAME=FastAPI Auth Backend
APP_ENV=development
DEBUG=True
SECRET_KEY=change-this-to-a-secure-random-key

# Server
HOST=0.0.0.0
PORT=8000

# Database
DATABASE_URL=postgresql://authuser:authpassword@localhost:5432/authdb
DATABASE_TEST_URL=postgresql://authuser:authpassword@localhost:5432/authdb_test

# Redis
REDIS_URL=redis://localhost:6379/0
REDIS_TEST_URL=redis://localhost:6379/1

# JWT
JWT_SECRET_KEY=change-this-to-another-secure-random-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=["http://localhost:3000","http://localhost:8080"]

# OAuth - Google
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/oauth/google/callback

# OAuth - Microsoft
MICROSOFT_CLIENT_ID=your-microsoft-client-id-here
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret-here
MICROSOFT_REDIRECT_URI=http://localhost:8000/api/v1/oauth/microsoft/callback
MICROSOFT_TENANT_ID=common

# LDAP
LDAP_ENABLED=False
LDAP_SERVER_URI=ldap://localhost:389
LDAP_BIND_DN=cn=admin,dc=example,dc=com
LDAP_BIND_PASSWORD=admin
LDAP_SEARCH_BASE=ou=users,dc=example,dc=com
LDAP_USER_FILTER=(uid={username})
LDAP_USE_TLS=False
LDAP_CA_CERT_FILE=

# SSO / SAML
SSO_ENABLED=False
SAML_IDP_METADATA_URL=
SAML_SP_ENTITY_ID=http://localhost:8000
SAML_SP_ACS_URL=http://localhost:8000/api/v1/sso/callback
SAML_SP_X509_CERT=app/config/saml/certs/sp.crt
SAML_SP_PRIVATE_KEY=app/config/saml/certs/sp.key
EOF
```

### Create .env from template
```bash
cp .env.example .env

# Generate secure random keys
python -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(32))" >> .env.tmp
python -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_urlsafe(32))" >> .env.tmp

# Note: Update your .env file with these generated keys
cat .env.tmp
rm .env.tmp
```

---

## Step 4: Create .gitignore

```bash
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
ENV/
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Testing
.coverage
.pytest_cache/
htmlcov/
.tox/
.hypothesis/

# Database
*.db
*.sqlite3

# Logs
*.log

# OS
.DS_Store
Thumbs.db

# SAML certificates (keep .example versions)
app/config/saml/certs/*.crt
app/config/saml/certs/*.key
!app/config/saml/certs/.gitkeep
EOF
```

---

## Step 5: Database Setup

### Create PostgreSQL Databases
```bash
# Connect to PostgreSQL
psql -U postgres

# In PostgreSQL prompt:
CREATE USER authuser WITH PASSWORD 'authpassword';
CREATE DATABASE authdb OWNER authuser;
CREATE DATABASE authdb_test OWNER authuser;
GRANT ALL PRIVILEGES ON DATABASE authdb TO authuser;
GRANT ALL PRIVILEGES ON DATABASE authdb_test TO authuser;
\q
```

### Initialize Alembic for Migrations
```bash
# Initialize Alembic
alembic init alembic

# This creates:
# - alembic/ directory
# - alembic.ini file
```

Note: You'll configure Alembic after creating the database models.

---

## Step 6: Create Initial Configuration Files

### Create README.md
```bash
cat > README.md << 'EOF'
# FastAPI Authentication Backend

A comprehensive authentication backend built with FastAPI, supporting multiple authentication methods:

- JWT (JSON Web Tokens)
- OAuth2 / OpenID Connect (Google, Microsoft)
- LDAP / Active Directory
- SAML / SSO

## Features

- User registration and login
- Token-based authentication
- OAuth2 integration
- LDAP integration
- SAML SSO
- Role-based access control
- Rate limiting
- Token blacklist
- Audit logging

## Setup

See `QUICK_START_GUIDE.md` for detailed setup instructions.

## Documentation

- `AUTH_IMPLEMENTATION_GUIDE.md` - Comprehensive implementation guide
- `IMPLEMENTATION_CHECKLIST.md` - Task checklist
- `QUICK_START_GUIDE.md` - Quick start guide

## Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Copy environment file
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
alembic upgrade head

# Run the application
uvicorn app.main:app --reload
```

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/unit/test_jwt_service.py
```

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## License

MIT
EOF
```

### Create pytest.ini
```bash
cat > pytest.ini << 'EOF'
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
    -v
    --strict-markers
    --tb=short
    --cov=app
    --cov-report=term-missing
    --cov-report=html
markers =
    unit: Unit tests
    integration: Integration tests
    slow: Slow tests
asyncio_mode = auto
EOF
```

### Create pyproject.toml for tooling
```bash
cat > pyproject.toml << 'EOF'
[tool.black]
line-length = 100
target-version = ['py310']
include = '\.pyi?$'
extend-exclude = '''
/(
  # directories
  \.eggs
  | \.git
  | \.hg
  | \.mypy_cache
  | \.tox
  | \.venv
  | build
  | dist
)/
'''

[tool.ruff]
line-length = 100
target-version = "py310"
select = [
    "E",  # pycodestyle errors
    "W",  # pycodestyle warnings
    "F",  # pyflakes
    "I",  # isort
    "C",  # flake8-comprehensions
    "B",  # flake8-bugbear
]
ignore = [
    "E501",  # line too long (handled by black)
    "B008",  # do not perform function calls in argument defaults
    "C901",  # too complex
]

[tool.mypy]
python_version = "3.10"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
disallow_incomplete_defs = true
check_untyped_defs = true
no_implicit_optional = true
warn_redundant_casts = true
warn_unused_ignores = true
warn_no_return = true
strict_equality = true

[[tool.mypy.overrides]]
module = [
    "passlib.*",
    "jose.*",
    "python_ldap.*",
    "onelogin.*",
]
ignore_missing_imports = true
EOF
```

---

## Step 7: Verify Setup

### Check Directory Structure
```bash
# Display tree (install tree if needed: sudo apt install tree)
tree -L 3 -I 'venv|__pycache__|*.pyc'
```

### Verify Dependencies
```bash
# List installed packages
pip list

# Check for critical packages
pip show fastapi uvicorn sqlalchemy pydantic
```

### Test Python Environment
```bash
# Test imports
python << 'EOF'
import fastapi
import sqlalchemy
import pydantic
import jose
import passlib
print("✓ All critical packages imported successfully!")
EOF
```

---

## Step 8: Implementation Workflow

Now that your project is set up, follow this workflow:

### Day-to-Day Development Process

1. **Open the IMPLEMENTATION_CHECKLIST.md**
   - Find the next unchecked task
   - Read the corresponding section in AUTH_IMPLEMENTATION_GUIDE.md

2. **Create the file** for the task
   ```bash
   # Example: Creating the settings file
   touch app/config/settings.py
   ```

3. **Implement the functionality**
   - Follow the steps in the implementation guide
   - Write code according to the specifications

4. **Write tests** as you go
   ```bash
   # Example: Creating a test file
   touch tests/unit/test_settings.py
   ```

5. **Run tests** frequently
   ```bash
   pytest tests/unit/test_settings.py
   ```

6. **Mark task as complete** in checklist
   - Update IMPLEMENTATION_CHECKLIST.md
   - Commit your changes
   ```bash
   git add .
   git commit -m "feat: implement settings configuration"
   ```

### Example First Implementation Task

Let's implement the settings configuration:

```bash
# Create the file
touch app/config/settings.py

# Open in your editor and implement based on guide
# Reference: AUTH_IMPLEMENTATION_GUIDE.md -> Configuration Setup

# After implementation, test it:
python << 'EOF'
from app.config.settings import Settings
settings = Settings()
print(f"App Name: {settings.APP_NAME}")
print("✓ Settings loaded successfully!")
EOF
```

---

## Step 9: Running the Application

### Create app/main.py (minimal version to test)
```bash
cat > app/main.py << 'EOF'
from fastapi import FastAPI

app = FastAPI(
    title="FastAPI Auth Backend",
    description="Authentication backend with JWT, OAuth, LDAP, and SAML support",
    version="0.1.0"
)

@app.get("/")
def root():
    return {"message": "FastAPI Auth Backend API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
EOF
```

### Start the development server
```bash
# Run with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Test the API
```bash
# In another terminal
curl http://localhost:8000/
curl http://localhost:8000/health

# Visit in browser
# Swagger UI: http://localhost:8000/docs
# ReDoc: http://localhost:8000/redoc
```

---

## Step 10: Next Steps

Now you're ready to start implementation! Follow this order:

### Week 1: Foundation
1. ✓ Project setup (complete)
2. → Implement `app/config/settings.py`
3. → Implement `app/models/user.py`
4. → Set up Alembic and create first migration
5. → Implement `app/utils/password.py`
6. → Set up test fixtures in `tests/conftest.py`

### Week 2: JWT Authentication
Refer to **Phase 2** in the IMPLEMENTATION_CHECKLIST.md

### Week 3+: Advanced Features
Follow the remaining phases in order.

---

## Useful Commands Reference

### Development
```bash
# Run dev server
uvicorn app.main:app --reload

# Run with specific port
uvicorn app.main:app --reload --port 8080

# Check code style
black app/ tests/
ruff check app/ tests/

# Type checking
mypy app/
```

### Testing
```bash
# Run all tests
pytest

# Run specific test
pytest tests/unit/test_jwt_service.py::test_create_token

# Run with coverage
pytest --cov=app --cov-report=html
open htmlcov/index.html

# Run only unit tests
pytest -m unit

# Run only integration tests
pytest -m integration
```

### Database
```bash
# Create migration
alembic revision --autogenerate -m "Add users table"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# View migration history
alembic history
```

### Docker (for later)
```bash
# Build image
docker build -t fastapi-auth .

# Run container
docker run -p 8000:8000 fastapi-auth

# Run with docker-compose
docker-compose up
```

---

## Getting Help

### Common Issues

**Issue**: `ModuleNotFoundError: No module named 'app'`
- Solution: Make sure you have `__init__.py` files in all directories
- Run from project root: `python -m app.main`

**Issue**: Database connection error
- Solution: Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify DATABASE_URL in .env

**Issue**: Import errors in tests
- Solution: Install package in editable mode: `pip install -e .`

### Resources
- FastAPI Docs: https://fastapi.tiangolo.com/
- SQLAlchemy Docs: https://docs.sqlalchemy.org/
- Pydantic Docs: https://docs.pydantic.dev/
- JWT Best Practices: https://tools.ietf.org/html/rfc8725

---

## Summary

You now have:
- ✓ Project structure created
- ✓ Dependencies installed
- ✓ Environment configured
- ✓ Database set up
- ✓ Testing framework ready
- ✓ Development server running
- ✓ Implementation guides ready

**Next Action**: Open `IMPLEMENTATION_CHECKLIST.md` and start with Phase 1!

Good luck with your implementation! 🚀
