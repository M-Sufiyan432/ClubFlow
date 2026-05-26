# ClubFlow Authentication Implementation Guide

## Overview

This document describes the complete authentication system implemented for ClubFlow, including login, registration, session management, and role-based access control.

## Features

- **Real API Integration**: All authentication uses actual backend API calls via Axios
- **JWT Token Management**: HttpOnly cookies with automatic token injection
- **Session Verification**: Auto-verify session on app load
- **Role-Based Access Control**: Route protection with role validation
- **Error Handling**: Comprehensive error handling and user feedback
- **Loading States**: Loading indicators for all async operations
- **OAuth Ready**: Structure supports Google OAuth integration

## Architecture

### Redux State Management

The auth system uses Redux Toolkit with async thunks for state management:

```
src/store/slices/authSlice.ts
- login (async thunk): POST /auth/login
- signup (async thunk): POST /auth/signup
- verifySession (async thunk): GET /auth/me
- logoutAsync (async thunk): POST /auth/logout
```

### Auth State Structure

```typescript
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isVerifying: boolean
  error: string | null
}
```

### User Model

```typescript
interface User {
  id: string
  email: string
  name: string
  avatar?: string
  roles: string[]
  clubId?: string
}
```

## API Endpoints

The frontend expects the following backend endpoints:

### POST /auth/login
Request:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "name": "John Doe",
    "roles": ["member"],
    "avatar": "https://...",
    "clubId": "club123"
  },
  "expiresIn": 3600
}
```

### POST /auth/register
Request:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "clubName": "My Club"
}
```

Response:
```json
{
  "token": "jwt_token_here",
  "user": { ... },
  "expiresIn": 3600
}
```

### GET /auth/me
Requires Authorization header with bearer token

Response:
```json
{
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "name": "John Doe",
    "roles": ["member"],
    "avatar": "https://...",
    "clubId": "club123"
  }
}
```

### POST /auth/logout
Requires Authorization header with bearer token

Response:
```json
{
  "message": "Logged out successfully"
}
```

## Usage

### Using the useAuth Hook

The easiest way to access auth functionality:

```typescript
import { useAuth } from '@/hooks/useAuth'

export const MyComponent = () => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    error,
    login,
    logout 
  } = useAuth()

  const handleLogin = async () => {
    try {
      await login({ email: 'user@example.com', password: 'pass123' }).unwrap()
      // User is logged in
    } catch (err) {
      // Handle error
    }
  }

  return (
    <div>
      {isAuthenticated && <p>Welcome {user?.name}</p>}
      <button onClick={handleLogin} disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </div>
  )
}
```

### Direct Redux Dispatch

```typescript
import { useAppDispatch } from '@/store/hooks'
import { login } from '@/store/slices/authSlice'

export const LoginForm = () => {
  const dispatch = useAppDispatch()

  const handleSubmit = async (credentials) => {
    try {
      await dispatch(login(credentials)).unwrap()
      // Handle success
    } catch (error) {
      // Handle error
    }
  }

  return (...)
}
```

## Protected Routes

All routes except `/login` and `/signup` are protected with `ProtectedRoute`:

```typescript
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

The `ProtectedRoute` component:
- Checks if user is authenticated
- Shows loading indicator while verifying session
- Redirects to `/login` if not authenticated
- Preserves the intended location for post-login redirect

## Session Verification

On app load, the system automatically verifies the user's session:

```typescript
useEffect(() => {
  dispatch(verifySession())
}, [dispatch])
```

This:
1. Makes a GET request to `/auth/me`
2. Sets user data if valid
3. Redirects to login if session invalid
4. Shows loading state during verification

## API Interceptors

Axios interceptors handle:

1. **Request**: Automatically inject JWT token in Authorization header
2. **Response**: 
   - 401 errors trigger logout and redirect to login
   - All credentials are sent with requests (withCredentials: true)

```typescript
// Automatic request:
config.headers.Authorization = `Bearer ${token}`

// Automatic 401 handling:
if (error.response?.status === 401) {
  dispatch(logoutAsync())
  window.location.href = '/login'
}
```

## Role-Based Access Control

Use the `RoleGuard` component to restrict routes by role:

```typescript
<Route
  path="/admin"
  element={
    <ProtectedRoute>
      <RoleGuard requiredRoles={['admin']}>
        <AdminPanel />
      </RoleGuard>
    </ProtectedRoute>
  }
/>
```

## Error Handling

Errors are displayed in three ways:

1. **Form Validation Errors**: Individual field-level errors
2. **API Errors**: Caught and displayed as general errors
3. **Global Errors**: Redux state stores error message

```typescript
const { error, clearError } = useAuth()

useEffect(() => {
  if (error) {
    // Show error toast/notification
    const timer = setTimeout(clearError, 5000)
    return () => clearTimeout(timer)
  }
}, [error, clearError])
```

## Environment Configuration

Set these environment variables in your `.env` file:

```
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
VITE_GOOGLE_OAUTH_CLIENT_ID=your_client_id
```

## Token Management

- Tokens are sent via `Authorization: Bearer {token}` header
- Backend stores JWT in HttpOnly cookie (recommended for security)
- Frontend maintains token in Redux for quick access
- Token expires based on backend response (`expiresIn` field)

## Google OAuth Setup

To add Google OAuth:

1. Get OAuth credentials from Google Cloud Console
2. Set `VITE_GOOGLE_OAUTH_CLIENT_ID` in `.env`
3. Add OAuth button to login page
4. Implement OAuth flow that calls backend `/auth/google/callback`

## Security Best Practices

✓ Implemented:
- HttpOnly cookies for token storage (backend responsibility)
- CSRF protection via secure cookie handling
- Automatic logout on 401
- withCredentials for cross-origin requests
- Password strength validation

Recommended backend:
- Secure cookie flags (httpOnly, secure, sameSite)
- HTTPS in production
- Token rotation
- Rate limiting on auth endpoints

## Testing

Example test for login:

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Login } from '@/pages/Login'

test('logs in user with valid credentials', async () => {
  render(<Login />)
  
  await userEvent.type(screen.getByLabelText(/email/i), 'user@test.com')
  await userEvent.type(screen.getByLabelText(/password/i), 'password123')
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
  
  expect(await screen.findByText(/dashboard/i)).toBeInTheDocument()
})
```

## Troubleshooting

### Token not being sent
- Check if `VITE_API_URL` is set correctly
- Verify token is stored in Redux state
- Check browser Network tab for Authorization header

### Session verification failing
- Ensure backend `/auth/me` endpoint exists
- Check if token is valid and not expired
- Verify CORS settings allow requests

### Redirect loop
- Check if ProtectedRoute has proper isVerifying check
- Ensure verifySession is called only once on app load
- Verify isAuthenticated state updates correctly

### CORS errors
- Check backend CORS configuration
- Verify withCredentials is enabled in interceptors
- Ensure backend allows the frontend origin
