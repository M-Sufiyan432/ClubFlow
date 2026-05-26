# ClubFlow - Developer Quick Reference

## Project Overview
Production-ready React + React Router + Redux SPA for club management. All major features and infrastructure complete.

## Start Development
```bash
pnpm install
pnpm run dev
```
Open http://localhost:5173

## File Structure Quick Lookup

### Pages (Routed Components)
- `src/pages/Login.tsx` - Login form
- `src/pages/Signup.tsx` - Registration form  
- `src/pages/Dashboard.tsx` - Main dashboard
- `src/pages/Clubs.tsx` - Club management
- `src/pages/Events.tsx` - Event management
- `src/pages/Members.tsx` - Member management
- `src/pages/Settings.tsx` - User settings

### Store (Redux State)
- `src/store/store.ts` - Redux configuration
- `src/store/hooks.ts` - useAppDispatch, useAppSelector
- `src/store/slices/authSlice.ts` - Auth state
- `src/store/slices/uiSlice.ts` - UI state (theme, sidebar)
- `src/store/slices/clubSlice.ts` - Clubs state
- `src/store/slices/eventSlice.ts` - Events state
- `src/store/slices/memberSlice.ts` - Members state

### Services (API & External)
- `src/services/api.ts` - Axios instance
- `src/services/apiInterceptors.ts` - Auth token injection
- `src/services/auth.service.ts` - Auth API calls
- `src/services/socket.ts` - Socket.IO client

### Components
- `src/components/layout/` - BaseLayout, Sidebar, Navbar
- `src/components/auth/` - ProtectedRoute, RoleGuard
- `src/components/clubs/` - ClubForm, ClubCard
- `src/components/events/` - EventForm, EventCard
- `src/components/members/` - MembersTable, InviteMemberForm
- `src/components/ui/` - Button, Card, Input, Avatar, etc.

## Common Patterns

### Use Redux in Component
```typescript
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { addClub } from '@/store/slices/clubSlice'

function MyComponent() {
  const dispatch = useAppDispatch()
  const clubs = useAppSelector(state => state.clubs.clubs)
  
  const handleAdd = (club) => {
    dispatch(addClub(club))
  }
  
  return <div>{clubs.length} clubs</div>
}
```

### Make API Call
```typescript
import api from '@/services/api'

// Token is automatically injected via interceptor
const response = await api.get('/clubs')
const data = await api.post('/clubs', { name: 'New Club' })
```

### Add New Route
1. Create page in `src/pages/NewPage.tsx`
2. Import and add route in `src/App.tsx`
3. Add navigation link in `src/components/layout/Sidebar.tsx`

### Add New Redux Slice
1. Create file `src/store/slices/newSlice.ts`
2. Add to store in `src/store/store.ts`
3. Import and use typed hooks in components

### Add New Component
```typescript
// src/components/features/MyComponent.tsx
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface MyComponentProps {
  title: string
  onSubmit: (data: any) => void
}

export const MyComponent: React.FC<MyComponentProps> = ({ 
  title, 
  onSubmit 
}) => {
  return (
    <Card>
      <h2>{title}</h2>
      <Button onClick={() => onSubmit({})}>Submit</Button>
    </Card>
  )
}
```

## Form Validation Pattern
```typescript
interface FormErrors {
  field?: string
}

const validateForm = (): boolean => {
  const newErrors: FormErrors = {}
  if (!value.trim()) newErrors.field = 'Required'
  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
}

// In JSX
{errors.field && (
  <p className="text-xs text-destructive">{errors.field}</p>
)}
```

## Protected Route
```typescript
// Already wrapped in App.tsx, just use ProtectedRoute
<Route
  path="/protected"
  element={
    <ProtectedRoute>
      <MyPage />
    </ProtectedRoute>
  }
/>
```

## Role-Based Access Control
```typescript
<RoleGuard 
  requiredRoles={['admin']}
  fallback={<div>Access Denied</div>}
>
  <AdminPanel />
</RoleGuard>
```

## Theme Toggle
```typescript
import { useTheme } from '@/contexts/ThemeContext'

function MyComponent() {
  const { theme, toggleTheme } = useTheme()
  
  return (
    <button onClick={toggleTheme}>
      Current: {theme}
    </button>
  )
}
```

## Environment Variables
```env
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

Access in code:
```typescript
const apiUrl = import.meta.env.VITE_API_URL
```

## Tailwind CSS Utilities

### Layout
- `flex`, `gap-4`, `p-6` - Flexbox spacing
- `grid`, `grid-cols-3` - Grid layout
- `absolute`, `relative` - Positioning

### Colors
- `bg-primary`, `text-foreground` - Use theme colors
- `hover:bg-secondary` - State variants
- `dark:bg-secondary` - Dark mode

### Responsive
- `md:grid-cols-2`, `lg:text-xl` - Breakpoints
- Mobile-first by default

### Common Classes
- `rounded-md` - Border radius
- `shadow-lg` - Shadows
- `border` - Borders
- `text-center`, `text-right` - Text alignment

## Debugging

### Redux State
```typescript
// In DevTools Redux tab (F12)
// View all actions and state changes
```

### Component Props
```typescript
console.log('[v0] Props:', props)
console.log('[v0] State:', state)
```

### API Calls
```typescript
// Check Network tab (F12)
// Token injection visible in Request Headers
```

## Type Safety

### Create Type
```typescript
interface Club {
  id: string
  name: string
  description: string
}
```

### Import & Use
```typescript
import { Club } from '@/types/index'

const club: Club = { id: '1', name: 'Club', description: '...' }
```

## Common Imports

```typescript
// Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

// Redux
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { addClub } from '@/store/slices/clubSlice'

// Services
import api from '@/services/api'

// Context
import { useTheme } from '@/contexts/ThemeContext'

// Icons
import { Plus, Edit2, Trash2, Menu } from 'lucide-react'

// Routing
import { useNavigate, Link } from 'react-router-dom'
```

## API Response Pattern
```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Usage
const response = await api.get<Club>('/clubs/1')
```

## Build & Deploy

### Development
```bash
pnpm run dev      # Start dev server
```

### Production
```bash
pnpm run build    # Build for production
pnpm run preview  # Preview build locally
```

### Deploy to Vercel
```bash
vercel
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| API calls fail | Check VITE_API_URL in .env.local |
| Token not working | Verify token in localStorage (DevTools → Storage) |
| Styles not loading | Check if dark class on html element |
| Routes not working | Verify route added in App.tsx |
| Redux state not updating | Check if using typed hooks |
| Components not re-rendering | Ensure using useAppSelector properly |

## Performance Tips

1. Use `useAppSelector` with specific state slices
2. Memoize expensive selectors
3. Use React.memo for pure components
4. Lazy load routes with React.lazy()
5. Check Redux DevTools for unnecessary re-renders

## Security Reminders

- ✅ Token automatically injected in headers
- ✅ 401 response triggers auto logout
- ✅ All routes have ProtectedRoute wrapper
- ✅ Input validation on all forms
- ✅ TypeScript prevents XSS vulnerabilities

---

**Need more details?** Check ARCHITECTURE.md or REDUX_SETUP.md
