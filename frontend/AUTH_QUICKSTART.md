# Authentication Quick Start

## Setup Backend

Your backend must provide these endpoints:

```
POST   /api/auth/login       - Login user
POST   /api/auth/register    - Register user
GET    /api/auth/me          - Get current user
POST   /api/auth/logout      - Logout user
```

All endpoints use JWT tokens in the `Authorization: Bearer {token}` header.

Backend should store JWT in HttpOnly cookie for security.

## Environment Setup

1. Copy `.env.example` to `.env`
2. Update `VITE_API_URL` to point to your backend:
   ```
   VITE_API_URL=http://localhost:3001/api
   ```
3. Install dependencies: `pnpm install`
4. Start dev server: `pnpm run dev`

## Test Login/Signup

1. Navigate to `http://localhost:5173/login`
2. The system will auto-verify session on load
3. Try signing in or creating an account
4. After successful auth, you'll be redirected to dashboard

## Common Tasks

### Access current user anywhere
```typescript
import { useAuth } from '@/hooks/useAuth'

export const MyComponent = () => {
  const { user, isAuthenticated } = useAuth()
  
  if (!isAuthenticated) return <div>Not logged in</div>
  return <div>Welcome {user?.name}</div>
}
```

### Logout
```typescript
import { useAuth } from '@/hooks/useAuth'

const { logout } = useAuth()
await logout()
// User is redirected to /login automatically
```

### Handle login errors
```typescript
const { login, error, clearError } = useAuth()

try {
  await login({ email, password }).unwrap()
} catch (err) {
  console.log('Login error:', error)
  // Show error to user
}
```

### Create protected page
```typescript
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Dashboard } from '@/pages/Dashboard'

// In App.tsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### Check user role
```typescript
import { useAuth } from '@/hooks/useAuth'

export const AdminPanel = () => {
  const { user } = useAuth()
  
  if (!user?.roles.includes('admin')) {
    return <div>Access denied</div>
  }
  
  return <div>Admin content</div>
}
```

## Backend Response Format

### Login/Register Success
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
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

### Get Me Success
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

### Error Response
```json
{
  "message": "Invalid email or password"
}
```

## How It Works

1. **App Load**: `App.tsx` calls `verifySession()` to check if user is already logged in
2. **Login**: User submits credentials → Redux thunk calls `/auth/login` → Token stored → Redirect to dashboard
3. **Protected Routes**: `ProtectedRoute` component checks if authenticated, shows loading spinner during verification
4. **API Calls**: Axios interceptor automatically adds `Authorization` header
5. **401 Response**: Automatic logout and redirect to login
6. **Logout**: User clicks logout → API call → Token cleared → Redirect to login

## File Structure

```
src/
├── store/slices/
│   └── authSlice.ts          - Redux auth state & async thunks
├── services/
│   ├── auth.service.ts       - API calls
│   ├── api.ts                - Axios instance
│   └── apiInterceptors.ts    - Token injection & error handling
├── hooks/
│   └── useAuth.ts            - Custom hook for auth
├── components/auth/
│   ├── ProtectedRoute.tsx    - Route protection
│   └── RoleGuard.tsx         - Role-based access
├── pages/
│   ├── Login.tsx             - Login page with real API
│   └── Signup.tsx            - Signup page with real API
└── types/
    └── auth.types.ts         - TypeScript interfaces
```

## Debugging

### Check Redux State
```typescript
import { useAppSelector } from '@/store/hooks'

export const DebugAuth = () => {
  const auth = useAppSelector(state => state.auth)
  
  return <pre>{JSON.stringify(auth, null, 2)}</pre>
}
```

### Check API Calls
Open browser DevTools → Network tab → Look for `/auth/login`, `/auth/me` requests

### Check Token
```typescript
const { token } = useAuth()
console.log('Token:', token)
```

## Next Steps

1. Implement backend endpoints
2. Set `VITE_API_URL` environment variable
3. Test login/signup flow
4. Add Google OAuth if needed
5. Customize user profile page
6. Add role-based features

## Support

- Auth implementation: `AUTH_IMPLEMENTATION.md`
- Architecture overview: `ARCHITECTURE.md`
- Redux setup: `REDUX_SETUP.md`
