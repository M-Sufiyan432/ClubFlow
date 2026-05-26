# ClubFlow Frontend Architecture

## Project Overview

ClubFlow is a production-ready React.js + React Router SPA for managing clubs, events, and members. This document outlines the complete architecture, folder structure, and key design patterns.

## Technology Stack

- **React 19.2.4** - UI library
- **React Router v6** - Client-side routing
- **Redux Toolkit** - State management
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time communication
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool and dev server

## Folder Structure

```
src/
├── components/
│   ├── ui/                 # shadcn/ui components (Button, Card, Input, Avatar, etc.)
│   ├── layout/             # Layout wrapper components
│   │   ├── BaseLayout.tsx  # Main layout with sidebar + navbar
│   │   ├── Sidebar.tsx     # Navigation sidebar
│   │   └── Navbar.tsx      # Top navigation bar
│   └── auth/               # Authentication components
│       ├── ProtectedRoute.tsx  # Route protection wrapper
│       └── RoleGuard.tsx       # Role-based access control
├── pages/                  # Page components (routed)
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Clubs.tsx
│   ├── Events.tsx
│   ├── Settings.tsx
│   └── NotFound.tsx
├── store/                  # Redux store setup
│   ├── store.ts           # Redux store configuration
│   ├── hooks.ts           # Typed Redux hooks (useAppDispatch, useAppSelector)
│   └── slices/
│       ├── authSlice.ts   # Auth state (user, token, authentication)
│       └── uiSlice.ts     # UI state (theme, sidebar, loading, notifications)
├── services/              # API and external services
│   ├── api.ts             # Axios instance configuration
│   ├── apiInterceptors.ts # Request/response interceptors for auth
│   ├── auth.service.ts    # Auth API calls
│   └── socket.ts          # Socket.IO client initialization
├── contexts/              # React Context providers
│   └── ThemeContext.tsx   # Theme provider (light/dark mode)
├── types/                 # TypeScript type definitions
│   ├── index.ts          # Shared types (Club, Event, Member, ApiResponse)
│   ├── auth.types.ts     # Auth-specific types
│   └── api.types.ts      # API response types
├── utils/                # Utility functions and helpers
│   ├── config.ts         # Environment configuration
│   ├── constants.ts      # Constants (API endpoints, roles, storage keys)
│   └── helpers.ts        # Utility functions
├── lib/                  # Library utilities
│   └── utils.ts         # Tailwind merge utility (cn function)
├── styles/              # Global styles
│   └── index.css        # Global CSS with Tailwind imports
├── App.tsx              # Main router setup
└── main.tsx             # Entry point with Redux provider

index.html               # HTML entry file
vite.config.ts          # Vite configuration
tsconfig.json           # TypeScript configuration
.env.example            # Environment variables template
```

## Key Components

### 1. Redux Store (`store/`)

**State Structure:**
```typescript
{
  auth: {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
  },
  ui: {
    theme: 'light' | 'dark'
    sidebarOpen: boolean
    loading: boolean
    notification: { open, message, type } | null
  }
}
```

**Key Slices:**
- `authSlice` - Manages user authentication state and token
- `uiSlice` - Manages UI state like theme and sidebar toggle

**Typed Hooks:**
```typescript
import { useAppDispatch, useAppSelector } from '@/store/hooks'
```

### 2. API Layer (`services/`)

**Axios Instance:**
- Base URL configured from environment variables
- 30-second request timeout
- Auto-injects authorization token in all requests
- Automatically handles 401 responses by logging out and redirecting

**Request Interceptor:**
- Adds `Authorization: Bearer <token>` header to all requests

**Response Interceptor:**
- Catches 401 responses and triggers logout
- Redirects user to `/login`

### 3. Authentication

**ProtectedRoute Component:**
- Wraps routes that require authentication
- Redirects unauthenticated users to `/login`
- Shows loading state while checking authentication

**Login Flow:**
1. User submits credentials on `/login`
2. API returns token and user data
3. Token stored in Redux state and localStorage
4. User redirected to `/dashboard`
5. Axios interceptor injects token in future requests

**Logout Flow:**
1. User clicks logout in sidebar
2. Token removed from Redux and localStorage
3. User redirected to `/login`
4. Next API call fails with 401 → redirects to login

### 4. Theme System

**ThemeContext:**
- Provides `theme` and `toggleTheme` function
- Automatically applies `dark` class to `<html>` element
- Persists theme preference in localStorage
- Integrates with Redux UI state

**Usage:**
```typescript
const { theme, toggleTheme } = useTheme()
```

### 5. Layout Components

**BaseLayout:**
- Main wrapper for all authenticated pages
- Combines Sidebar and Navbar
- Responsive design with sidebar collapse

**Sidebar:**
- Navigation menu with active state highlighting
- User info display
- Logout button
- Collapse/expand toggle

**Navbar:**
- Page title display
- Notifications icon
- Theme toggle
- User avatar

## Routing

**Public Routes:**
- `/login` - Login page

**Protected Routes:**
- `/dashboard` - Dashboard home page
- `/clubs` - Club management
- `/events` - Event management
- `/settings` - User settings

**Redirects:**
- `/` → `/dashboard`
- `/*` → `404 Not Found`

## Data Flow

1. **Component** → dispatches Redux action
2. **Redux Slice** → updates store
3. **Component** selects from store using `useAppSelector`
4. **API Call** → Axios instance with interceptors
5. **Interceptor** → injects auth token automatically
6. **Response** → dispatches Redux action to update state
7. **Component** re-renders with new data

## Environment Configuration

**Required Variables:**
```env
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

**Optional Variables:**
```env
VITE_ENABLE_ANALYTICS=true
```

## Development Setup

1. Install dependencies: `pnpm install`
2. Copy `.env.example` to `.env.local` and configure
3. Start dev server: `pnpm run dev`
4. Open http://localhost:5173

## Building for Production

```bash
pnpm run build  # Creates optimized dist/ folder
pnpm run preview # Preview production build locally
```

## Type Safety

All API responses, Redux state, and component props are fully typed with TypeScript. Key type files:
- `types/auth.types.ts` - Authentication types
- `types/index.ts` - Shared domain types (Club, Event, Member)

## Adding New Features

### Adding a New Page

1. Create page component in `src/pages/`
2. Add route in `App.tsx`
3. Add navigation link in `Sidebar.tsx`

### Adding a New Redux Slice

1. Create slice in `src/store/slices/`
2. Import and add to store configuration
3. Use typed hooks in components

### Adding a New API Service

1. Create service file in `src/services/`
2. Use `api` instance from `src/services/api.ts`
3. Token injection is automatic via interceptors

## Security Considerations

- ✅ Token stored in Redux state and localStorage
- ✅ Token auto-injected in all API requests
- ✅ 401 responses trigger automatic logout
- ✅ Protected routes prevent unauthorized access
- ✅ Role-based access control via `RoleGuard`
- ✅ TypeScript prevents common security mistakes

## Performance Optimizations

- **Code Splitting** - Vite automatically chunks vendors (React, Redux, Router)
- **Lazy Loading** - Use `React.lazy()` for route-based code splitting
- **State Management** - Redux Toolkit includes Immer for immutable updates
- **Caching** - API responses can be cached with Redux
- **Asset Optimization** - Tailwind CSS purges unused styles

## Next Steps

1. **Implement API Integration** - Connect to backend API
2. **Add Club Management Features** - CRUD operations for clubs
3. **Add Event Management** - Event creation and calendar
4. **Add Member Management** - Member profiles and roles
5. **Add Real-time Features** - Socket.IO integration for live updates
6. **Add Error Boundaries** - Handle and display errors gracefully
7. **Add Tests** - Unit tests for components and services
