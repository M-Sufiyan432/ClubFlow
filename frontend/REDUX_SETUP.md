# Redux Setup and Integration Guide

## Overview

Redux Toolkit is fully integrated into ClubFlow to manage global application state in a predictable and maintainable way. This document details the Redux setup and provides usage examples.

## Store Structure

### Root State

```typescript
{
  auth: AuthState              // User authentication
  ui: UIState                  // UI state (theme, sidebar, etc.)
  clubs: ClubState             // Club management
  events: EventState           // Event management
  members: MemberState         // Member management
}
```

## Slices

### 1. Auth Slice (`store/slices/authSlice.ts`)

Manages user authentication state, tokens, and roles.

**State:**
```typescript
{
  user: User | null            // Current logged-in user
  token: string | null         // JWT token
  isAuthenticated: boolean     // Auth status
  isLoading: boolean          // Loading state
  error: string | null        // Error messages
}
```

**Actions:**
- `setLoading(boolean)` - Set loading state
- `setError(string | null)` - Set error message
- `setUser(User)` - Set current user
- `setToken(string)` - Set JWT token
- `logout()` - Clear auth state
- `clearError()` - Clear error message

**Usage Example:**
```typescript
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setUser, setToken, logout } from '@/store/slices/authSlice'

function MyComponent() {
  const dispatch = useAppDispatch()
  const user = useAppSelector(state => state.auth.user)
  
  const handleLogin = (user, token) => {
    dispatch(setUser(user))
    dispatch(setToken(token))
  }
  
  const handleLogout = () => {
    dispatch(logout())
  }
  
  return (
    <div>
      {user && <p>Welcome, {user.name}</p>}
      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}
```

### 2. UI Slice (`store/slices/uiSlice.ts`)

Manages UI state like theme and sidebar toggle.

**State:**
```typescript
{
  theme: 'light' | 'dark'             // Current theme
  sidebarOpen: boolean                // Sidebar visibility
  loading: boolean                    // Global loading state
  notification: Notification | null   // Toast notifications
}
```

**Actions:**
- `setTheme('light' | 'dark')` - Change theme
- `toggleSidebar()` - Toggle sidebar
- `setSidebarOpen(boolean)` - Set sidebar state
- `setLoading(boolean)` - Set global loading
- `showNotification(message, type)` - Show notification
- `hideNotification()` - Hide notification

**Usage Example:**
```typescript
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setTheme, toggleSidebar } from '@/store/slices/uiSlice'

function MyComponent() {
  const dispatch = useAppDispatch()
  const theme = useAppSelector(state => state.ui.theme)
  
  const handleThemeToggle = () => {
    dispatch(setTheme(theme === 'light' ? 'dark' : 'light'))
  }
  
  return <button onClick={handleThemeToggle}>Toggle Theme</button>
}
```

### 3. Club Slice (`store/slices/clubSlice.ts`)

Manages club data and operations.

**State:**
```typescript
{
  clubs: Club[]              // List of clubs
  currentClub: Club | null   // Currently selected club
  isLoading: boolean        // Loading state
  error: string | null      // Error messages
}
```

**Actions:**
- `setClubs(Club[])` - Set clubs list
- `addClub(Club)` - Add new club
- `updateClub(Club)` - Update club
- `deleteClub(string)` - Delete club by ID
- `setCurrentClub(Club | null)` - Set current club

**Usage Example:**
```typescript
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { addClub, updateClub, deleteClub } from '@/store/slices/clubSlice'

function ClubsList() {
  const dispatch = useAppDispatch()
  const clubs = useAppSelector(state => state.clubs.clubs)
  
  const handleAddClub = (clubData) => {
    const newClub = { ...clubData, id: Date.now().toString() }
    dispatch(addClub(newClub))
  }
  
  return (
    <div>
      {clubs.map(club => (
        <div key={club.id}>{club.name}</div>
      ))}
    </div>
  )
}
```

### 4. Event Slice (`store/slices/eventSlice.ts`)

Manages event data and operations.

**State:**
```typescript
{
  events: Event[]           // List of events
  currentEvent: Event | null // Currently selected event
  isLoading: boolean       // Loading state
  error: string | null     // Error messages
}
```

**Actions:**
- `setEvents(Event[])` - Set events list
- `addEvent(Event)` - Add new event
- `updateEvent(Event)` - Update event
- `deleteEvent(string)` - Delete event by ID
- `setCurrentEvent(Event | null)` - Set current event

### 5. Member Slice (`store/slices/memberSlice.ts`)

Manages member data and operations.

**State:**
```typescript
{
  members: Member[]         // List of members
  currentMember: Member | null // Currently selected member
  isLoading: boolean       // Loading state
  error: string | null     // Error messages
}
```

**Actions:**
- `setMembers(Member[])` - Set members list
- `addMember(Member)` - Add new member
- `updateMember(Member)` - Update member
- `removeMember(string)` - Remove member by ID
- `setCurrentMember(Member | null)` - Set current member

## Typed Hooks

Redux hooks are fully typed for type safety.

```typescript
// From store/hooks.ts
import { useAppDispatch, useAppSelector } from '@/store/hooks'

// useAppDispatch - Typed dispatch hook
const dispatch = useAppDispatch()
dispatch(addClub({ name: 'New Club' }))  // TypeScript checks action payload

// useAppSelector - Typed selector hook
const user = useAppSelector(state => state.auth.user)  // Autocomplete and type checking
```

## API Integration with Redux

### Pattern: Fetch Data with Thunks

For async API calls, use Redux Thunk (included in Redux Toolkit):

```typescript
// services/club.service.ts
import api from './api'
import { Club } from '@/store/slices/clubSlice'

export const fetchClubs = async (): Promise<Club[]> => {
  const response = await api.get('/clubs')
  return response.data
}

// In component
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setClubs, setLoading } from '@/store/slices/clubSlice'
import { fetchClubs } from '@/services/club.service'

function ClubsList() {
  const dispatch = useAppDispatch()
  const clubs = useAppSelector(state => state.clubs.clubs)
  
  useEffect(() => {
    const loadClubs = async () => {
      dispatch(setLoading(true))
      try {
        const data = await fetchClubs()
        dispatch(setClubs(data))
      } catch (error) {
        dispatch(setError(error.message))
      } finally {
        dispatch(setLoading(false))
      }
    }
    
    loadClubs()
  }, [dispatch])
  
  return <div>{/* Render clubs */}</div>
}
```

## Best Practices

### 1. Keep Slices Focused
Each slice should manage a single domain (auth, clubs, events, etc.)

### 2. Use Typed Hooks
Always use `useAppDispatch` and `useAppSelector` for type safety:
```typescript
const dispatch = useAppDispatch()
const state = useAppSelector(state => state.something)
```

### 3. Immutability
Redux Toolkit includes Immer, so you can "mutate" state directly:
```typescript
// This looks like mutation but Immer handles immutability
state.clubs.push(newClub)
state.currentClub = club
```

### 4. Error Handling
Always include error states in slices:
```typescript
const [error, setError] = useState<string | null>(null)
dispatch(setError('Something went wrong'))
dispatch(setError(null))  // Clear error
```

### 5. Loading States
Manage loading states for async operations:
```typescript
dispatch(setLoading(true))
// ... async operation
dispatch(setLoading(false))
```

## Debugging

### Redux DevTools

Redux Toolkit automatically integrates with Redux DevTools. In your browser:

1. Install Redux DevTools browser extension
2. Open DevTools (F12)
3. Go to Redux tab
4. See all actions and state changes

### Console Logging

```typescript
// View entire state
useEffect(() => {
  console.log('Current state:', store.getState())
}, [])

// View dispatch actions
const dispatch = useAppDispatch()
dispatch(addClub(clubData))  // Will appear in DevTools
```

## Adding a New Domain

To add a new Redux slice (e.g., for Settings):

1. Create slice file: `src/store/slices/settingsSlice.ts`
```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface SettingsState {
  notifications: boolean
  emailDigest: 'daily' | 'weekly' | 'never'
}

const initialState: SettingsState = {
  notifications: true,
  emailDigest: 'weekly',
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    toggleNotifications: (state) => {
      state.notifications = !state.notifications
    },
    setEmailDigest: (state, action) => {
      state.emailDigest = action.payload
    },
  },
})

export const { toggleNotifications, setEmailDigest } = settingsSlice.actions
export default settingsSlice.reducer
```

2. Add to store: `src/store/store.ts`
```typescript
import settingsReducer from './slices/settingsSlice'

export const store = configureStore({
  reducer: {
    // ... existing
    settings: settingsReducer,
  },
})
```

3. Use in components:
```typescript
const dispatch = useAppDispatch()
const notifications = useAppSelector(state => state.settings.notifications)
dispatch(toggleNotifications())
```

## Performance Optimization

### Selector Memoization

For complex selectors, use memoization:
```typescript
import { useAppSelector } from '@/store/hooks'

function MyComponent() {
  // This selector is recalculated every render
  const clubCount = useAppSelector(state => state.clubs.clubs.length)
  
  // Better: Use useMemo for complex selectors
  const activeClubs = useAppSelector(state =>
    state.clubs.clubs.filter(c => c.active)
  )
}
```

### Use React.memo for Components

Prevent unnecessary re-renders:
```typescript
const ClubCard = React.memo(({ club }: { club: Club }) => (
  <div>{club.name}</div>
))
```

## Resources

- [Redux Documentation](https://redux.js.org/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [React-Redux Hooks](https://react-redux.js.org/api/hooks)
