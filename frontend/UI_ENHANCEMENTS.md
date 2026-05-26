# ClubFlow UI Enhancements Documentation

## Overview
Comprehensive UI improvements for ClubFlow following Notion/Linear-inspired clean design patterns.

## 1. Dark/Light Mode Toggle

### Implementation
- Already integrated via `ThemeContext` with Redux persistence
- Theme is stored in localStorage and persists across sessions
- CSS variables support theme switching with smooth transitions

### Usage
```typescript
import { useTheme } from '@/contexts/ThemeContext'

export const MyComponent = () => {
  const { theme, toggleTheme } = useTheme()
  return <button onClick={toggleTheme}>Toggle: {theme}</button>
}
```

### CSS Variables
- Primary colors, backgrounds, borders, and all semantic tokens automatically adjust
- Dark mode uses CSS custom properties for zero JavaScript overhead

## 2. Responsive Design (Mobile, Tablet, Desktop)

### Breakpoints
- Mobile: < 640px
- Tablet: 641px - 1024px
- Desktop: > 1025px

### Implementation
- Tailwind CSS responsive prefixes (`sm:`, `md:`, `lg:`)
- Grid system with responsive utilities
- Flexbox layouts for flexible spacing

### Utility Classes
```css
.grid-responsive /* grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 */
.flex-center     /* flex items-center justify-center */
.flex-between    /* flex items-center justify-between */
.hide-mobile     /* hidden on mobile */
.hide-tablet     /* hidden on tablet */
.hide-desktop    /* hidden on desktop */
```

## 3. Skeleton Loaders

### Components
```typescript
import {
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonAvatar,
  SkeletonText,
  SkeletonButton
} from '@/components/ui/skeleton'
```

### Usage
```tsx
<Skeleton className="h-4 w-3/4" />
<SkeletonCard count={3} />
<SkeletonTable rows={5} cols={4} />
<SkeletonText lines={3} />
```

### Features
- Pulse animation for smooth loading states
- Count prop for multiple skeletons
- Customizable dimensions
- Responsive sizing

## 4. Error Boundary Component

### Implementation
```typescript
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### Features
- Catches React component errors
- Shows user-friendly error UI
- Details shown in development mode
- Recovery options (Retry, Go Home)

### Usage
```tsx
import { ErrorBoundary } from '@/components/error/ErrorBoundary'

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

## 5. Error Pages

### 403 Forbidden Page
- Location: `/forbidden`
- Locked icon with red accent
- Clear permission denied messaging
- Navigation buttons for recovery

### 404 Not Found Page
- Location: `*` (catch-all route)
- Enhanced styling with gradient background
- Search suggestion in development
- Help text for support contact

### Usage
```typescript
import { Forbidden } from '@/pages/Forbidden'
import { NotFound } from '@/pages/NotFound'

// Route them in App.tsx
<Route path="/forbidden" element={<Forbidden />} />
<Route path="*" element={<NotFound />} />
```

## 6. Smooth Transitions

### Global Animations
```css
.animate-fade-in       /* 0.2s ease-in-out */
.animate-slide-in-up   /* 0.3s ease-out */
.animate-slide-in-down /* 0.3s ease-out */
.animate-slide-in-left /* 0.3s ease-out */
.animate-slide-in-right/* 0.3s ease-out */
.animate-scale-in      /* 0.2s ease-out */
```

### Keyframe Animations
- FadeIn: Smooth opacity change
- SlideInUp/Down/Left/Right: Entrance animations with translation
- ScaleIn: Zoom effect with fade
- All use GPU-accelerated transforms for performance

### Usage
```tsx
<div className="animate-slide-in-up">Content</div>
<div className="animate-fade-in">Fading in</div>
```

## 7. Modal System

### Implementation
```typescript
import { Modal, useModal } from '@/components/ui/modal'

export const MyComponent = () => {
  const { isOpen, open, close } = useModal()

  return (
    <>
      <button onClick={open}>Open Modal</button>
      <Modal
        isOpen={isOpen}
        onClose={close}
        title="Modal Title"
        size="md"
        footer={<ModalFooter />}
      >
        Modal Content
      </Modal>
    </>
  )
}
```

### Features
- Sizes: sm, md, lg, xl
- Backdrop click handling
- Close button toggle
- Custom footer area
- Smooth animations
- Accessibility focus management

### Props
- `isOpen`: Modal visibility
- `onClose`: Close handler
- `title`: Modal header text
- `size`: Modal width (sm/md/lg/xl)
- `closeOnBackdropClick`: Backdrop behavior
- `closeButton`: Show/hide close button

## 8. Confirmation Dialog

### Implementation
```typescript
import { ConfirmationDialog, useConfirmationDialog } from '@/components/ui/confirmation-dialog'

export const DeleteItem = () => {
  const { isOpen, confirm, config } = useConfirmationDialog()

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Item?',
      message: 'This action cannot be undone.',
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: async () => {
        // API call here
      }
    })
  }

  return (
    <>
      <button onClick={handleDelete}>Delete</button>
      <ConfirmationDialog {...config} />
    </>
  )
}
```

### Features
- Promise-based API for clean async handling
- Destructive action styling (red)
- Warning and alert icons
- Loading state during confirmation
- Custom icon support

## 9. Global Toast System

### Already Implemented
- Redux-based toast notifications
- Integrated into UI slice
- Available via `showNotification` action

### Usage
```typescript
import { showNotification } from '@/store/slices/uiSlice'

dispatch(showNotification({
  message: 'Operation successful',
  type: 'success' // 'success' | 'error' | 'info' | 'warning'
}))
```

### Types
- `success`: Green background
- `error`: Red background
- `info`: Blue background
- `warning`: Yellow background

## 10. Design System

### Spacing Scale
- Base unit: 0.25rem (4px)
- Scale: 1, 2, 3, 4, 6, 8, 12, 16, 20, 24, 32...

### Typography
- Font families: Inter (sans), system stack
- Font sizes: sm (12px), base (14px), lg (16px), xl (18px), 2xl (20px)...
- Font weights: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Color Palette
- Primary: #4F46E5 (Indigo)
- Secondary: #F3F4F6 (Light Gray)
- Destructive: #DC2626 (Red)
- Accent: #F97316 (Orange)
- Semantic: success, warning, error, info

### Border Radius
- Global radius: 0.5rem (8px)
- Used consistently across buttons, cards, inputs, modals

### Shadow System
- sm: Subtle shadow for cards
- md: Default elevation
- lg: Elevated panels and dropdowns

## Performance Optimizations

### Animations
- GPU-accelerated transforms
- Will-change hints for heavy animations
- Reduced motion support for accessibility

### Bundle Size
- Skeleton loaders: Minimal CSS with Tailwind
- Modal/Dialog: Pure React, no external dependencies
- Error Boundary: Single class component

### Responsive Images
- Lazy loading with native HTML
- Responsive srcset support
- Fallback for unsupported browsers

## Accessibility

### Features
- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader testing
- High contrast support via dark mode

### Color Contrast
- WCAG AA compliant
- Text-foreground on background: 15:1
- All interactive elements keyboard accessible

## Browser Support
- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: Latest versions

## Future Enhancements
- Component storybook documentation
- Animation presets library
- Theming API for custom color schemes
- Built-in internationalization
- Analytics event tracking
