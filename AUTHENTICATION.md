# Authentication System Documentation

## Overview

The PLC Code Checker now includes a comprehensive user authentication and management system. This system provides secure user registration, login, session management, and administrative controls.

## Features

### Authentication
- **User Registration**: Secure user account creation with password hashing
- **User Login**: Session-based authentication with automatic session expiration
- **Password Security**: Bcrypt hashing with salt for secure password storage
- **Account Lockout**: Automatic lockout after 5 failed login attempts (15-minute lockout)
- **Session Management**: Secure session tokens with configurable expiration (24 hours default)

### User Roles
- **Admin**: Full system access including user management
- **Analyst**: Standard user access to analysis features
- **User**: Basic access to view and upload functionality

### User Management (Admin Only)
- **User List**: View all system users with status and activity information
- **Create Users**: Add new users with specified roles
- **Delete Users**: Remove users from the system
- **Toggle Status**: Activate/deactivate user accounts
- **Reset Passwords**: Reset user passwords (forces re-login)

## Usage

### Initial Setup

1. **Create Admin User** (CLI):
   ```bash
   python src/python/db.py --create-user admin admin@company.com AdminPass123! admin
   ```

2. **Start Application**:
   ```bash
   npm run build
   npm start
   ```

### Login Process

1. Launch the application
2. You'll be presented with the login screen
3. Enter username and password
4. Click "Sign In"
5. Upon successful authentication, you'll be redirected to the dashboard

### User Management (Admin Only)

1. Login as an admin user
2. Navigate to the sidebar
3. Click "User Management" (only visible to admins)
4. Perform user operations:
   - **Create User**: Click "Add User" button
   - **View Users**: See list with status, role, and last login
   - **Activate/Deactivate**: Click status toggle button
   - **Delete User**: Click delete button (with confirmation)
   - **Reset Password**: Click reset button and enter new password

### Logout

1. Click the "Sign Out" button in the sidebar
2. Confirm logout in the dialog

## Technical Implementation

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at TEXT NOT NULL,
    last_login TEXT,
    is_active INTEGER DEFAULT 1,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TEXT
);
```

#### User Sessions Table
```sql
CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

### API Methods

#### Frontend (Electron IPC)
- `window.electronAPI.register(username, email, password, role)` - Register new user
- `window.electronAPI.login(username, password)` - Authenticate user
- `window.electronAPI.validateSession(sessionToken)` - Validate session
- `window.electronAPI.logout(sessionToken)` - Logout user
- `window.electronAPI.listUsers()` - List all users (admin only)
- `window.electronAPI.deleteUser(userId)` - Delete user (admin only)
- `window.electronAPI.toggleUserStatus(userId, isActive)` - Toggle user status (admin only)
- `window.electronAPI.resetUserPassword(userId, newPassword)` - Reset password (admin only)

#### Backend (Python CLI)
- `python src/python/db.py --create-user <username> <email> <password> <role>`
- `python src/python/db.py --authenticate <username> <password>`
- `python src/python/db.py --list-users`
- `python src/python/db.py --delete-user <user_id>`
- `python src/python/db.py --toggle-user-status <user_id> <true|false>`
- `python src/python/db.py --reset-user-password <user_id> <new_password>`

### Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt with salt
2. **Session Tokens**: UUID4-based session tokens for secure authentication
3. **Session Expiration**: Automatic session cleanup and expiration
4. **Account Lockout**: Prevents brute force attacks
5. **Role-Based Access**: Different access levels based on user roles
6. **Input Validation**: Server-side validation for all user inputs

### File Structure

```
src/
├── python/
│   └── db.py                           # Database operations and CLI commands
├── main/
│   ├── electron.js                     # IPC handlers for authentication
│   └── preload.js                      # Exposed API methods
├── renderer/
│   ├── contexts/
│   │   └── AuthContext.tsx            # React authentication context
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx          # Login form
│   │   │   ├── RegisterPage.tsx       # Registration form
│   │   │   └── AuthWrapper.tsx        # Authentication wrapper
│   │   ├── Sidebar.tsx                # Navigation with logout
│   │   └── UserProfile.tsx            # User profile component
│   ├── pages/
│   │   └── UserManagementPage.tsx     # Admin user management
│   └── App.tsx                        # Main app with protected routes
└── types/
    └── electron-api.d.ts              # TypeScript API definitions
```

## Testing

### Manual Testing
1. Run `python test_auth_system.py` to verify backend functionality
2. Start the application and test the UI flows
3. Test different user roles and permissions

### User Scenarios
1. **Admin Login**: Login as admin and access user management
2. **Regular User**: Login as non-admin and verify limited access
3. **Password Reset**: Test password reset functionality
4. **Account Lockout**: Test failed login attempts and lockout
5. **Session Expiration**: Test automatic logout after session expires

## Default Credentials

For testing purposes, you can create users with these commands:

```bash
# Admin user
python src/python/db.py --create-user admin admin@company.com AdminPass123! admin

# Analyst user  
python src/python/db.py --create-user analyst analyst@company.com AnalystPass123! analyst

# Regular user
python src/python/db.py --create-user user user@company.com UserPass123! user
```

## Troubleshooting

### Common Issues

1. **Login Failed**: Check username/password and ensure user is active
2. **Session Expired**: Re-login to get a new session
3. **User Management Not Visible**: Ensure you're logged in as an admin
4. **Database Locked**: Ensure no other processes are using the database

### Logs
- Check the application console for authentication errors
- Backend authentication logs are written to the terminal

## UI Components

### Sidebar Features
- **User Info**: Displays current user's username, email, and role
- **Sign Out Button**: Logout option with confirmation dialog
- **User Management Link**: Admin-only link to user management page

### User Management Page
- **User List**: Table showing all users with status, role, and activity
- **Add User**: Form to create new users with role selection
- **User Actions**: Delete, activate/deactivate, and reset password
- **Search/Filter**: Find users by username or email

## Security Considerations

1. **Password Storage**: Never store passwords in plain text
2. **Session Management**: Regularly clean up expired sessions
3. **Access Control**: Implement proper role-based access controls
4. **Input Validation**: Always validate and sanitize user inputs
5. **HTTPS**: Use HTTPS in production environments
6. **Regular Updates**: Keep dependencies updated for security patches

## Implementation Complete

✅ **Backend Authentication**: User registration, login, session management
✅ **Database Schema**: Users and sessions tables with proper relationships
✅ **Frontend UI**: Login, registration, and user management pages
✅ **Electron Integration**: IPC handlers and preload API
✅ **Role-Based Access**: Admin, analyst, and user roles
✅ **Security Features**: Password hashing, session tokens, account lockout
✅ **User Management**: Admin interface for user CRUD operations
✅ **Sidebar Integration**: Logout button and user management link
✅ **Documentation**: Comprehensive setup and usage guide

The authentication system is now fully implemented and ready for use!
│   │   └── UserProfile.tsx             # User profile dropdown
│   └── App.tsx                         # Main app with auth integration
├── types/
│   └── electron-api.d.ts               # TypeScript auth types
└── utils/
    └── logger.ts                       # Authentication logging
```

## 🚀 Usage

### 1. User Registration

Users can register through the UI or programmatically:

```typescript
// Frontend (React)
const { register } = useAuth();
const result = await register('username', 'email@example.com', 'password', 'user');

// Backend (Python CLI)
python src/python/db.py --create-user "username" "email@example.com" "password" "user"
```

### 2. User Login

```typescript
// Frontend (React)
const { login } = useAuth();
const result = await login('username', 'password');

// The system automatically creates a session and stores the token
```

### 3. Protected Routes

```tsx
import { ProtectedRoute } from './contexts/AuthContext';

<ProtectedRoute fallback={<LoginPage />}>
  <Dashboard />
</ProtectedRoute>

// Or with role requirements
<ProtectedRoute requiredRole="admin" fallback={<AccessDenied />}>
  <AdminPanel />
</ProtectedRoute>
```

### 4. User Profile Management

The `UserProfile` component provides:
- User information display
- Role badge
- Logout functionality
- Account settings (future enhancement)

## 🛡️ Security Features

### Password Security
- **bcrypt Hashing**: Industry-standard password hashing
- **Automatic Salting**: Each password gets a unique salt
- **Configurable Rounds**: Default bcrypt work factor

### Account Protection
- **Failed Login Tracking**: Monitors unsuccessful login attempts
- **Account Locking**: Temporary lockout after 5 failed attempts
- **Lockout Duration**: 30-minute automatic unlock

### Session Security
- **Secure Tokens**: URL-safe random tokens (32 bytes)
- **Configurable Expiry**: Default 7-day session lifetime
- **Session Validation**: Real-time session verification
- **Automatic Cleanup**: Expired sessions are automatically invalidated

### Data Protection
- **No Password Storage**: Only hashed passwords are stored
- **Session Isolation**: Each session has a unique token
- **SQL Injection Protection**: Parameterized queries throughout

## 🎛️ Configuration

### Session Configuration
```python
# In db.py - create_session function
expires_at = created_at + timedelta(days=7)  # Modify session duration
```

### Account Lockout Settings
```python
# In db.py - authenticate_user function
if failed_attempts >= 5:  # Modify lockout threshold
    lock_until = (datetime.now() + timedelta(minutes=30)).isoformat()  # Modify lockout duration
```

## 🧪 Testing

Run the authentication test suite:

```bash
python test_auth.py
```

This tests:
- User creation
- Authentication
- Session management  
- Security validations
- Error handling

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_login TEXT,
    is_active BOOLEAN DEFAULT 1,
    role TEXT DEFAULT 'user',
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TEXT
);
```

### Sessions Table
```sql
CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
```

## 🔧 API Reference

### Electron IPC Handlers

- `register-user(username, email, password, role?)` - Register new user
- `authenticate-user(username, password)` - Authenticate user
- `create-session(userId)` - Create new session
- `validate-session(sessionToken)` - Validate existing session
- `logout-session(sessionToken)` - Logout/invalidate session

### React Hooks

```typescript
const {
  user,               // Current user object
  isAuthenticated,    // Authentication status
  isLoading,         // Loading state
  error,             // Current error
  login,             // Login function
  register,          // Registration function
  logout,            // Logout function
  validateSession    // Session validation
} = useAuth();
```

## 🚨 Error Handling

The system includes comprehensive error handling:

- **Network Errors**: Graceful handling of connection issues
- **Validation Errors**: Client and server-side input validation
- **Security Errors**: Failed authentication, expired sessions
- **System Errors**: Database connectivity, IPC communication

## 🔮 Future Enhancements

- **Two-Factor Authentication**: SMS/TOTP support
- **OAuth Integration**: Google, Microsoft SSO
- **Password Reset**: Email-based password recovery
- **Audit Logging**: Comprehensive user activity tracking
- **Role Permissions**: Granular permission system
- **Session Management**: Active session monitoring and revocation

## 📝 Migration Notes

Existing data is preserved during authentication system deployment:
- New user tables are created alongside existing data
- `user_id` foreign keys are added to analyses and baselines
- Existing records remain accessible but unassigned to users initially

## 🤝 Contributing

When contributing to the authentication system:

1. **Security First**: All changes must maintain or improve security
2. **Test Coverage**: Include tests for new authentication features
3. **Logging**: Add appropriate logging for security events
4. **Documentation**: Update this README for any API changes

---

*For technical support or security concerns, please contact the development team.*
