# FastAPI Authentication Implementation Guide

## Overview
This document provides a comprehensive step-by-step guide for implementing authentication features in a FastAPI backend. Each section outlines the implementation steps, file structure, dependencies, and testing strategies.

## Table of Contents
1. [Project Structure](#project-structure)
2. [Dependencies](#dependencies)
3. [JWT Authentication](#jwt-authentication)
4. [Single Sign-On (SSO)](#single-sign-on-sso)
5. [OpenID Connect / OAuth2](#openid-connect--oauth2)
6. [LDAP / Active Directory Integration](#ldap--active-directory-integration)
7. [Testing Strategy](#testing-strategy)
8. [Implementation Order](#implementation-order)

---

## Project Structure

### Recommended Backend Directory Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                      # FastAPI application entry point
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py              # Environment configuration
│   │   └── security.py              # Security settings
│   ├── core/
│   │   ├── __init__.py
│   │   ├── security.py              # Core security utilities
│   │   └── dependencies.py          # Shared dependencies
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py                  # User model
│   │   └── token.py                 # Token models
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py                  # User Pydantic schemas
│   │   ├── token.py                 # Token Pydantic schemas
│   │   └── auth.py                  # Auth request/response schemas
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py                  # API dependencies
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py            # Main API router
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           ├── auth.py          # Authentication endpoints
│   │           ├── users.py         # User management endpoints
│   │           ├── sso.py           # SSO endpoints
│   │           └── oauth.py         # OAuth endpoints
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth/
│   │   │   ├── __init__.py
│   │   │   ├── jwt_service.py       # JWT operations
│   │   │   ├── sso_service.py       # SSO logic
│   │   │   ├── oauth_service.py     # OAuth/OIDC logic
│   │   │   └── ldap_service.py      # LDAP/AD logic
│   │   └── user_service.py          # User operations
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── auth_middleware.py       # Authentication middleware
│   │   └── logging_middleware.py    # Request logging
│   ├── db/
│   │   ├── __init__.py
│   │   ├── base.py                  # Database base
│   │   ├── session.py               # Database session
│   │   └── repositories/
│   │       ├── __init__.py
│   │       └── user_repository.py   # User data access
│   └── utils/
│       ├── __init__.py
│       ├── password.py              # Password hashing utilities
│       └── validators.py            # Input validators
├── tests/
│   ├── __init__.py
│   ├── conftest.py                  # Pytest configuration
│   ├── unit/
│   │   ├── __init__.py
│   │   ├── test_jwt_service.py
│   │   ├── test_sso_service.py
│   │   ├── test_oauth_service.py
│   │   ├── test_ldap_service.py
│   │   └── test_password_utils.py
│   └── integration/
│       ├── __init__.py
│       ├── test_auth_endpoints.py
│       ├── test_sso_flow.py
│       ├── test_oauth_flow.py
│       └── test_ldap_integration.py
├── requirements.txt                 # Production dependencies
├── requirements-dev.txt             # Development dependencies
├── .env.example                     # Environment variables template
├── alembic.ini                      # Database migrations config
└── README.md                        # Backend documentation
```

---

## Dependencies

### Core Dependencies (requirements.txt)
```
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
pydantic>=2.4.0
pydantic-settings>=2.0.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
python-multipart>=0.0.6
python-ldap>=3.4.3
python3-saml>=1.15.0
authlib>=1.2.1
httpx>=0.25.0
sqlalchemy>=2.0.0
alembic>=1.12.0
psycopg2-binary>=2.9.0
redis>=5.0.0
```

### Development Dependencies (requirements-dev.txt)
```
pytest>=7.4.0
pytest-asyncio>=0.21.0
pytest-cov>=4.1.0
pytest-mock>=3.11.0
httpx>=0.25.0
faker>=19.0.0
factory-boy>=3.3.0
black>=23.0.0
ruff>=0.1.0
mypy>=1.5.0
```

---

## JWT Authentication

### Implementation Steps

#### Step 1: Configuration Setup
**File:** `app/config/settings.py`
- Create settings class with Pydantic BaseSettings
- Define JWT configuration:
  - SECRET_KEY (from environment)
  - ALGORITHM (e.g., "HS256")
  - ACCESS_TOKEN_EXPIRE_MINUTES (e.g., 30)
  - REFRESH_TOKEN_EXPIRE_DAYS (e.g., 7)
- Add database connection settings
- Add CORS settings

#### Step 2: User Model
**File:** `app/models/user.py`
- Create SQLAlchemy User model with fields:
  - id (UUID primary key)
  - email (unique, indexed)
  - username (unique, indexed)
  - hashed_password
  - is_active (boolean)
  - is_superuser (boolean)
  - created_at (timestamp)
  - updated_at (timestamp)

#### Step 3: Password Utilities
**File:** `app/utils/password.py`
- Implement password hashing function using passlib
- Implement password verification function
- Use bcrypt for hashing algorithm

#### Step 4: JWT Service
**File:** `app/services/auth/jwt_service.py`
- Implement `create_access_token()` function:
  - Accept user data (id, email, roles)
  - Add expiration time
  - Encode with SECRET_KEY
  - Return JWT string
- Implement `create_refresh_token()` function
- Implement `verify_token()` function:
  - Decode JWT
  - Verify signature
  - Check expiration
  - Return payload or raise exception
- Implement `decode_token()` function

#### Step 5: Authentication Schemas
**File:** `app/schemas/auth.py`
- Create Pydantic models:
  - `LoginRequest` (email, password)
  - `LoginResponse` (access_token, refresh_token, token_type)
  - `TokenPayload` (sub, exp, iat)
  - `RefreshTokenRequest` (refresh_token)

**File:** `app/schemas/user.py`
- Create Pydantic models:
  - `UserCreate` (email, username, password)
  - `UserResponse` (id, email, username, is_active)
  - `UserInDB` (extends UserResponse, add hashed_password)

#### Step 6: User Repository
**File:** `app/db/repositories/user_repository.py`
- Implement `create_user()` method
- Implement `get_user_by_email()` method
- Implement `get_user_by_id()` method
- Implement `update_user()` method
- Implement `delete_user()` method

#### Step 7: Authentication Dependencies
**File:** `app/api/deps.py`
- Create `get_current_user()` dependency:
  - Extract token from Authorization header
  - Verify token using jwt_service
  - Fetch user from database
  - Return user object
- Create `get_current_active_user()` dependency:
  - Use get_current_user
  - Verify user.is_active is True

#### Step 8: Authentication Endpoints
**File:** `app/api/v1/endpoints/auth.py`
- Implement `POST /auth/login`:
  - Validate credentials
  - Generate access and refresh tokens
  - Return tokens
- Implement `POST /auth/register`:
  - Validate input
  - Hash password
  - Create user in database
  - Return user data
- Implement `POST /auth/refresh`:
  - Verify refresh token
  - Generate new access token
  - Return new token
- Implement `POST /auth/logout`:
  - Invalidate tokens (add to blacklist in Redis)
- Implement `GET /auth/me`:
  - Return current authenticated user

#### Step 9: Unit Tests
**File:** `tests/unit/test_jwt_service.py`
- Test `create_access_token()`:
  - Verify token structure
  - Verify payload contents
  - Verify expiration time
- Test `verify_token()`:
  - Test valid token
  - Test expired token
  - Test invalid signature
  - Test malformed token
- Test `decode_token()`:
  - Verify payload extraction

**File:** `tests/unit/test_password_utils.py`
- Test password hashing
- Test password verification
- Test hash uniqueness

#### Step 10: Integration Tests
**File:** `tests/integration/test_auth_endpoints.py`
- Test registration flow:
  - Successful registration
  - Duplicate email/username
  - Invalid input validation
- Test login flow:
  - Successful login
  - Invalid credentials
  - Inactive user
- Test token refresh flow
- Test protected endpoint access:
  - With valid token
  - With expired token
  - Without token
- Test logout flow

---

## Single Sign-On (SSO)

### Implementation Steps

#### Step 1: SAML Configuration
**File:** `app/config/settings.py`
- Add SSO settings:
  - SSO_ENABLED (boolean)
  - SAML_IDP_METADATA_URL
  - SAML_SP_ENTITY_ID
  - SAML_SP_ACS_URL (Assertion Consumer Service)
  - SAML_SP_X509_CERT (path to certificate)
  - SAML_SP_PRIVATE_KEY (path to private key)

#### Step 2: SAML Setup Files
**Files to create:**
- `app/config/saml/settings.json` - SAML configuration
- `app/config/saml/advanced_settings.json` - Advanced SAML settings
- `app/config/saml/certs/sp.crt` - Service Provider certificate
- `app/config/saml/certs/sp.key` - Service Provider private key

#### Step 3: SSO Service
**File:** `app/services/auth/sso_service.py`
- Implement `initialize_saml_auth()`:
  - Load SAML settings
  - Create OneLogin_Saml2_Auth instance
  - Return auth object
- Implement `prepare_saml_request()`:
  - Generate SAML authentication request
  - Return redirect URL
- Implement `process_saml_response()`:
  - Validate SAML response
  - Extract user attributes (email, name, groups)
  - Return user data
- Implement `get_or_create_sso_user()`:
  - Check if user exists by email
  - Create user if doesn't exist
  - Update user attributes
  - Return user object

#### Step 4: SSO Schemas
**File:** `app/schemas/auth.py`
- Add Pydantic models:
  - `SSOLoginRequest` (relay_state optional)
  - `SSOCallbackRequest` (SAMLResponse, RelayState)
  - `SSOUserAttributes` (email, first_name, last_name, groups)

#### Step 5: SSO Endpoints
**File:** `app/api/v1/endpoints/sso.py`
- Implement `GET /sso/login`:
  - Initialize SAML auth
  - Generate SAML request
  - Redirect to IdP
- Implement `POST /sso/callback` (ACS endpoint):
  - Process SAML response
  - Validate assertion
  - Extract user attributes
  - Get or create user
  - Generate JWT tokens
  - Return tokens
- Implement `GET /sso/metadata`:
  - Return SP metadata XML

#### Step 6: SSO Middleware
**File:** `app/middleware/sso_middleware.py`
- Create middleware to detect SSO users
- Add SSO session tracking
- Handle SSO logout

#### Step 7: Unit Tests
**File:** `tests/unit/test_sso_service.py`
- Test SAML request generation
- Test SAML response validation:
  - Valid response
  - Invalid signature
  - Expired assertion
- Test user attribute extraction
- Test user creation/update logic
- Mock python3-saml library

#### Step 8: Integration Tests
**File:** `tests/integration/test_sso_flow.py`
- Test SSO login initiation:
  - Verify redirect to IdP
  - Verify SAML request structure
- Test SSO callback with mock SAML response:
  - Successful authentication
  - User creation
  - Token generation
- Test SSO metadata endpoint
- Test SSO logout flow

---

## OpenID Connect / OAuth2

### Implementation Steps

#### Step 1: OAuth Configuration
**File:** `app/config/settings.py`
- Add OAuth settings for each provider:
  - OAUTH_ENABLED (boolean)
  - GOOGLE_CLIENT_ID
  - GOOGLE_CLIENT_SECRET
  - GOOGLE_REDIRECT_URI
  - MICROSOFT_CLIENT_ID
  - MICROSOFT_CLIENT_SECRET
  - MICROSOFT_REDIRECT_URI
  - OAUTH_SCOPES (openid, profile, email)

#### Step 2: OAuth Service
**File:** `app/services/auth/oauth_service.py`
- Implement `OAuthProvider` base class:
  - Abstract methods: get_authorization_url, exchange_code, get_user_info
- Implement `GoogleOAuthProvider` class:
  - `get_authorization_url()`: Generate Google auth URL
  - `exchange_code()`: Exchange code for tokens
  - `get_user_info()`: Get user profile from Google
- Implement `MicrosoftOAuthProvider` class:
  - Similar methods for Microsoft/Azure AD
- Implement `OAuthService` class:
  - `get_provider()`: Factory method to get provider
  - `initiate_oauth_flow()`: Start OAuth flow
  - `handle_oauth_callback()`: Handle provider callback
  - `get_or_create_oauth_user()`: User provisioning

#### Step 3: OAuth Models
**File:** `app/models/user.py`
- Add fields to User model:
  - oauth_provider (string, nullable)
  - oauth_id (string, nullable, indexed)
  - oauth_data (JSON, nullable)

**File:** `app/models/oauth_state.py`
- Create OAuthState model:
  - state (UUID, primary key)
  - provider (string)
  - redirect_uri (string)
  - created_at (timestamp)
  - expires_at (timestamp)

#### Step 4: OAuth Schemas
**File:** `app/schemas/auth.py`
- Add Pydantic models:
  - `OAuthProvider` (enum: google, microsoft)
  - `OAuthLoginRequest` (provider, redirect_uri optional)
  - `OAuthCallbackRequest` (code, state)
  - `OAuthUserInfo` (id, email, name, picture)

#### Step 5: OAuth Endpoints
**File:** `app/api/v1/endpoints/oauth.py`
- Implement `GET /oauth/{provider}/login`:
  - Generate state parameter
  - Store state in database/Redis
  - Get authorization URL
  - Return redirect URL
- Implement `GET /oauth/{provider}/callback`:
  - Validate state parameter
  - Exchange authorization code for tokens
  - Get user info from provider
  - Get or create user in database
  - Generate JWT tokens
  - Return tokens or redirect
- Implement `POST /oauth/link`:
  - Link OAuth provider to existing user account

#### Step 6: OAuth State Management
**File:** `app/services/auth/oauth_state_service.py`
- Implement `create_state()`: Generate and store state
- Implement `verify_state()`: Validate state
- Implement `cleanup_expired_states()`: Remove old states
- Use Redis for state storage (with TTL)

#### Step 7: Unit Tests
**File:** `tests/unit/test_oauth_service.py`
- Test authorization URL generation:
  - Verify URL structure
  - Verify required parameters
- Test token exchange:
  - Mock HTTP requests to provider
  - Test successful exchange
  - Test error handling
- Test user info retrieval:
  - Mock provider responses
  - Verify attribute mapping
- Test user creation/linking:
  - New user creation
  - Existing user linking
  - Email conflict handling

#### Step 8: Integration Tests
**File:** `tests/integration/test_oauth_flow.py`
- Test OAuth login initiation:
  - Verify state generation
  - Verify redirect URL
- Test OAuth callback:
  - Mock provider token exchange
  - Mock provider user info
  - Test user creation
  - Test JWT generation
- Test multiple providers:
  - Google flow
  - Microsoft flow
- Test account linking:
  - Link OAuth to existing account
  - Prevent duplicate linking

---

## LDAP / Active Directory Integration

### Implementation Steps

#### Step 1: LDAP Configuration
**File:** `app/config/settings.py`
- Add LDAP settings:
  - LDAP_ENABLED (boolean)
  - LDAP_SERVER_URI (e.g., ldap://ldap.example.com:389)
  - LDAP_BIND_DN (service account DN)
  - LDAP_BIND_PASSWORD
  - LDAP_SEARCH_BASE (e.g., ou=users,dc=example,dc=com)
  - LDAP_USER_FILTER (e.g., (uid={username}))
  - LDAP_ATTRIBUTE_MAP (mapping LDAP attrs to user fields)
  - LDAP_USE_TLS (boolean)
  - LDAP_CA_CERT_FILE (path to CA certificate)

#### Step 2: LDAP Service
**File:** `app/services/auth/ldap_service.py`
- Implement `LDAPConnection` class:
  - `__init__()`: Initialize connection settings
  - `connect()`: Establish LDAP connection
  - `disconnect()`: Close connection
  - Context manager support
- Implement `LDAPService` class:
  - `authenticate_user()`:
    - Connect to LDAP server
    - Bind with service account
    - Search for user
    - Attempt bind with user credentials
    - Return success/failure
  - `get_user_attributes()`:
    - Search for user in LDAP
    - Extract attributes (email, name, groups)
    - Map to application user model
    - Return user data
  - `search_users()`:
    - Search LDAP for users matching criteria
    - Return list of users
  - `get_user_groups()`:
    - Query user's group memberships
    - Return list of groups
  - `sync_user_from_ldap()`:
    - Fetch LDAP user attributes
    - Update local user record
    - Return updated user

#### Step 3: LDAP Models
**File:** `app/models/user.py`
- Add fields to User model:
  - ldap_dn (string, nullable)
  - ldap_synced_at (timestamp, nullable)
  - auth_provider (enum: local, ldap, oauth, sso)

#### Step 4: LDAP Schemas
**File:** `app/schemas/auth.py`
- Add Pydantic models:
  - `LDAPLoginRequest` (username, password, domain optional)
  - `LDAPUserAttributes` (dn, cn, email, groups)
  - `LDAPSyncRequest` (sync_groups boolean)

#### Step 5: LDAP Authentication Endpoints
**File:** `app/api/v1/endpoints/auth.py`
- Modify `POST /auth/login`:
  - Check if LDAP is enabled
  - Try LDAP authentication first
  - Fall back to local authentication
  - Sync user from LDAP if authenticated
  - Generate JWT tokens
  - Return tokens
- Add `POST /auth/ldap/sync`:
  - Protected endpoint
  - Sync current user from LDAP
  - Return updated user data

#### Step 6: LDAP Sync Service
**File:** `app/services/auth/ldap_sync_service.py`
- Implement `sync_user()`:
  - Fetch user from LDAP
  - Update local user record
  - Sync group memberships
- Implement `sync_all_users()`:
  - Batch sync all LDAP users
  - For scheduled sync jobs
- Implement `auto_provision_user()`:
  - Create user on first LDAP login
  - Set default permissions

#### Step 7: LDAP Connection Pool
**File:** `app/core/ldap_pool.py`
- Implement connection pooling for LDAP
- Reuse connections for better performance
- Handle connection failures gracefully

#### Step 8: Unit Tests
**File:** `tests/unit/test_ldap_service.py`
- Test LDAP connection:
  - Mock ldap library
  - Test successful connection
  - Test connection failure
  - Test TLS connection
- Test user authentication:
  - Test valid credentials
  - Test invalid credentials
  - Test user not found
- Test attribute retrieval:
  - Mock LDAP search results
  - Verify attribute mapping
  - Test missing attributes
- Test group membership:
  - Mock group queries
  - Verify group extraction

#### Step 9: Integration Tests
**File:** `tests/integration/test_ldap_integration.py`
- Test LDAP authentication flow:
  - Use test LDAP server (docker container)
  - Test successful login
  - Test user creation on first login
  - Verify token generation
- Test user sync:
  - Modify user in LDAP
  - Trigger sync
  - Verify local user updated
- Test group sync:
  - Modify groups in LDAP
  - Verify local groups updated
- Test LDAP server failure:
  - Simulate LDAP unavailability
  - Verify graceful degradation

---

## Testing Strategy

### Unit Testing Approach

#### General Principles
- Test each service method in isolation
- Mock external dependencies (database, LDAP, HTTP clients)
- Test happy paths and error cases
- Aim for >80% code coverage

#### Tools and Fixtures
**File:** `tests/conftest.py`
```python
# Setup items to create:
# - pytest fixtures for database session
# - fixtures for test users
# - fixtures for mock JWT tokens
# - fixtures for mock LDAP responses
# - fixtures for mock OAuth responses
# - fixtures for test client (TestClient from FastAPI)
# - fixtures for async test support
```

#### Test Data Factories
**File:** `tests/factories.py`
- Create factory classes using factory_boy:
  - `UserFactory`: Generate test users
  - `TokenFactory`: Generate test tokens
  - `OAuthStateFactory`: Generate OAuth states

### Integration Testing Approach

#### Test Database
- Use separate test database
- Reset database between tests
- Use transactions that rollback

#### Test Environment Setup
- Docker Compose for test services:
  - PostgreSQL test database
  - Redis test instance
  - OpenLDAP test server
- Environment variables for test configuration

#### API Testing
- Use FastAPI TestClient
- Test full request/response cycle
- Test middleware execution
- Test authentication flow end-to-end

### Testing Commands

#### Run All Tests
```bash
pytest
```

#### Run with Coverage
```bash
pytest --cov=app --cov-report=html --cov-report=term
```

#### Run Only Unit Tests
```bash
pytest tests/unit/
```

#### Run Only Integration Tests
```bash
pytest tests/integration/
```

#### Run Specific Test File
```bash
pytest tests/unit/test_jwt_service.py
```

#### Run with Verbose Output
```bash
pytest -v -s
```

---

## Implementation Order

### Phase 1: Foundation (Week 1)
1. Set up project structure
2. Configure environment and settings
3. Set up database (PostgreSQL + SQLAlchemy)
4. Create User model and repository
5. Implement password utilities
6. Set up testing infrastructure

### Phase 2: JWT Authentication (Week 2)
1. Implement JWT service
2. Create authentication schemas
3. Build authentication endpoints (login, register, refresh)
4. Implement authentication dependencies
5. Write unit tests for JWT service
6. Write integration tests for auth endpoints

### Phase 3: OAuth / OpenID Connect (Week 3)
1. Implement OAuth service architecture
2. Add OAuth provider implementations (Google, Microsoft)
3. Create OAuth endpoints
4. Implement state management
5. Write unit tests for OAuth service
6. Write integration tests for OAuth flow
7. Test multiple provider support

### Phase 4: LDAP / Active Directory (Week 4)
1. Implement LDAP service
2. Add LDAP configuration
3. Integrate LDAP with login endpoint
4. Implement user sync service
5. Write unit tests for LDAP service
6. Write integration tests with test LDAP server
7. Test connection pooling

### Phase 5: SSO / SAML (Week 5)
1. Set up SAML configuration
2. Implement SSO service
3. Create SSO endpoints
4. Generate SP metadata
5. Write unit tests for SSO service
6. Write integration tests for SSO flow
7. Test with external IdP

### Phase 6: Integration & Security (Week 6)
1. Implement token blacklist (Redis)
2. Add rate limiting
3. Implement audit logging
4. Add security headers middleware
5. Write comprehensive integration tests
6. Security testing and penetration testing
7. Performance testing
8. Documentation

---

## Security Considerations

### Passwords
- Use bcrypt for hashing
- Enforce password complexity requirements
- Implement password reset flow
- Never log passwords

### Tokens
- Use secure random secrets for JWT signing
- Implement token rotation
- Store refresh tokens securely
- Implement token blacklist for logout
- Set appropriate token expiration times

### HTTPS
- Enforce HTTPS in production
- Use secure cookie flags
- Implement HSTS headers

### Input Validation
- Validate all inputs with Pydantic
- Sanitize user inputs
- Prevent SQL injection (use ORM)
- Prevent XSS attacks

### Rate Limiting
- Implement rate limiting on auth endpoints
- Prevent brute force attacks
- Use Redis for rate limit tracking

### Audit Logging
- Log all authentication attempts
- Log authorization failures
- Log sensitive operations
- Include user ID, IP, timestamp

---

## Environment Variables Template

### File: `.env.example`
```
# Application
APP_NAME=FastAPI Auth Backend
APP_ENV=development
DEBUG=True
SECRET_KEY=your-secret-key-here-change-in-production

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/authdb

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_SECRET_KEY=your-jwt-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=["http://localhost:3000"]

# OAuth - Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/oauth/google/callback

# OAuth - Microsoft
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_REDIRECT_URI=http://localhost:8000/api/v1/oauth/microsoft/callback

# LDAP
LDAP_ENABLED=False
LDAP_SERVER_URI=ldap://ldap.example.com:389
LDAP_BIND_DN=cn=admin,dc=example,dc=com
LDAP_BIND_PASSWORD=admin-password
LDAP_SEARCH_BASE=ou=users,dc=example,dc=com
LDAP_USER_FILTER=(uid={username})

# SSO / SAML
SSO_ENABLED=False
SAML_IDP_METADATA_URL=https://idp.example.com/metadata
SAML_SP_ENTITY_ID=http://localhost:8000
SAML_SP_ACS_URL=http://localhost:8000/api/v1/sso/callback
```

---

## Next Steps

1. **Review this guide** - Ensure all requirements are covered
2. **Set up development environment** - Install Python, PostgreSQL, Redis
3. **Create project structure** - Create all directories and __init__.py files
4. **Install dependencies** - Create requirements files and install packages
5. **Start with Phase 1** - Begin implementation following the order above
6. **Write tests as you go** - Don't leave testing until the end
7. **Document as you build** - Update README with API documentation

---

## Additional Resources

### Documentation to Reference
- FastAPI: https://fastapi.tiangolo.com/
- python-jose: https://github.com/mpdavis/python-jose
- python3-saml: https://github.com/SAML-Toolkits/python3-saml
- Authlib: https://docs.authlib.org/
- python-ldap: https://www.python-ldap.org/

### Testing Best Practices
- Test pyramid: More unit tests, fewer integration tests
- Use factories for test data generation
- Keep tests independent and idempotent
- Test error cases and edge cases

### Security Resources
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- JWT Best Practices: https://tools.ietf.org/html/rfc8725
- OAuth 2.0 Security Best Current Practice: https://tools.ietf.org/html/draft-ietf-oauth-security-topics

---

## Questions to Resolve Before Implementation

1. **Database Choice**: Confirm PostgreSQL or consider alternatives?
2. **User Model**: What additional user fields are needed?
3. **Roles/Permissions**: Do you need role-based access control (RBAC)?
4. **Multi-tenancy**: Is this a multi-tenant application?
5. **Email Verification**: Is email verification required for registration?
6. **Password Reset**: How should password reset be handled?
7. **Session Management**: Should sessions be stored server-side?
8. **API Versioning**: Confirm v1 API structure is acceptable?
9. **Deployment Target**: Where will this be deployed? (affects configuration)
10. **Monitoring**: What monitoring/logging tools will be used?
