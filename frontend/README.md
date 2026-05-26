# ClubFlow - Club Management Platform

A modern, production-ready club management SaaS platform built with React, React Router, Redux Toolkit, and TypeScript.

## Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (or npm)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd clubflow
```

2. Install dependencies
```bash
pnpm install
```

3. Configure environment variables
```bash
cp .env.example .env.local
# Edit .env.local with your API configuration
```

4. Start the development server
```bash
pnpm run dev
```

The application will open at `http://localhost:5173`

### Default Login Credentials
For development, use any email/password combination:
- Email: `test@example.com`
- Password: `password123`

## Project Structure

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

```
src/
├── components/    # React components (layout, auth, UI)
├── pages/        # Route page components
├── store/        # Redux store and slices
├── services/     # API and external services
├── types/        # TypeScript type definitions
├── utils/        # Utility functions
└── contexts/     # React context providers
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start development server |
| `pnpm run build` | Build for production |
| `pnpm run preview` | Preview production build |
| `pnpm run lint` | Run ESLint |

## Key Features

### Authentication
- Login/signup with token-based auth
- Automatic token injection in API requests
- Protected route system
- Role-based access control

### State Management
- Redux Toolkit for predictable state management
- Typed hooks for type-safe Redux usage
- Persistent authentication tokens

### Real-time Features
- Socket.IO integration ready
- Event-driven architecture
- Live updates support

### UI/UX
- Dark/light theme support
- Responsive sidebar navigation
- Modern component library (shadcn/ui)
- Tailwind CSS styling

## API Integration

The application expects a backend API with the following endpoints:

```
POST   /api/auth/login      - User login
POST   /api/auth/signup     - User registration
POST   /api/auth/logout     - User logout
GET    /api/auth/me         - Get current user
POST   /api/clubs           - Create club
GET    /api/clubs           - List clubs
GET    /api/clubs/:id       - Get club details
POST   /api/events          - Create event
GET    /api/events          - List events
GET    /api/members         - List members
```

Configure your API URL in `.env.local`:
```env
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

## Development Guide

### Adding a New Page

1. Create component in `src/pages/NewPage.tsx`
2. Add route in `src/App.tsx`
3. Add navigation link in `src/components/layout/Sidebar.tsx`

### Adding Redux State

1. Create slice in `src/store/slices/newSlice.ts`
2. Add to store config in `src/store/store.ts`
3. Use typed hooks in components:
   ```typescript
   const dispatch = useAppDispatch()
   const state = useAppSelector(state => state.newSlice)
   ```

### Adding API Endpoints

1. Create service in `src/services/service.ts`
2. Use Axios instance with automatic auth:
   ```typescript
   import api from '@/services/api'
   api.get('/endpoint')  // Token auto-injected
   ```

## Technology Stack

- **React 19** - UI library
- **React Router v6** - Client-side routing  
- **Redux Toolkit** - State management
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time communication
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Vite** - Build tool and dev server

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Deployment

### Build for Production
```bash
pnpm run build
```

This creates an optimized `dist/` folder ready for deployment.

### Deploy to Vercel
```bash
vercel
```

## Troubleshooting

### Port 5173 already in use
The dev server will automatically try the next available port. Check the console output for the actual URL.

### API connection errors
1. Verify `VITE_API_URL` in `.env.local`
2. Check if backend API is running
3. Verify CORS configuration on backend

### Token not persisting
Tokens are stored in `localStorage`. Check browser DevTools:
- Application → Local Storage → authToken

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions, please open an issue on GitHub or contact support@clubflow.io

---

**Ready to get started?** See [ARCHITECTURE.md](./ARCHITECTURE.md) for a deep dive into the project structure and design patterns.
