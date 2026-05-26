# ClubFlow Project Mastery Guide

This guide is written for you as the project owner: someone who built with AI help, but now wants to explain the system like the original engineer.

## 1. Project Overview

ClubFlow is a MERN-style club operations platform for college or community clubs. It combines authentication, club membership, role-based access, task management, events, notifications, dashboards, analytics, real-time updates, file proof uploads, and background cron jobs.

Text architecture:

```text
Browser
  React + Redux + React Router
    |
    | Axios REST API + Socket.IO client
    v
Express API server
  Auth middleware -> route -> controller -> Mongoose model
    |
    v
MongoDB Atlas

Background:
Express process -> cron jobs -> MongoDB -> notifications -> Socket.IO

External:
Cloudinary for task proof/file uploads
Nodemailer for email utilities
Google OAuth via Passport
```

Beginner analogy: the frontend is the reception desk, the backend is the office staff, MongoDB is the filing cabinet, Socket.IO is the live announcement speaker, and cron jobs are scheduled office routines.

Interview check:
- What problem does ClubFlow solve?
- Why does a club platform need roles?
- Why are real-time notifications useful?

Improvements to try:
- Add a public landing page explaining club benefits.
- Add onboarding for first-time users.

## 2. Purpose And Real-World Use Case

The app helps clubs coordinate work. Presidents and vice presidents can create/assign tasks, secretaries can manage certain operations, members can see their assigned work, RSVP to events, and receive notifications.

Real-world examples:
- Technical club assigns website tasks to members.
- Cultural club schedules rehearsal events.
- Secretary tracks RSVP and attendance.
- President checks task completion and overdue work.
- Members upload proof of work when marking a task done.

## 3. Folder Structure

```text
backend/
  config/          database, logger, passport, cloudinary setup
  controllers/     request handlers and business logic
  middleware/      compatibility re-exports
  middlewares/     auth, validation, upload, rate limit, permissions
  models/          Mongoose schemas
  routes/          API endpoint definitions
  socket/          Socket.IO server event handling
  sockets/         duplicate/older socket handler folder
  utils/           email, cron jobs, helpers
  server.js        backend entry point

frontend/
  src/
    components/    reusable UI and feature components
    contexts/      theme context
    hooks/         auth/club/socket hooks
    pages/         route-level screens
    services/      API clients and adapters
    store/         Redux Toolkit state
    types/         TypeScript models
    utils/         RBAC, config, constants
    App.tsx        route tree
    main.tsx       frontend entry point
    index.css      global styling
  components/      extra shadcn-style components, mostly not used by src
  app/             Next.js-style leftover structure
  dist/            build output
```

Important note: this project contains both Vite React files and some Next/shadcn generated folders. The active app is mainly `frontend/src` with Vite. The root `frontend/components` and `frontend/app` look like scaffolded/generated artifacts unless imported.

Interview check:
- Which folder owns API calls?
- Which folder owns database schemas?
- Which frontend folder owns route screens?

## 4. Main Execution Flow

```text
User opens app
  -> main.tsx mounts App
  -> App verifies session
  -> ProtectedRoute decides access
  -> Page dispatches Redux thunk
  -> service calls API
  -> Express route matches URL
  -> auth middleware attaches req.user
  -> controller validates business rules
  -> model reads/writes MongoDB
  -> response returns JSON
  -> adapter normalizes backend shape
  -> Redux stores data
  -> React rerenders UI
```

## 5. Frontend Architecture

Frontend stack:
- React: component-based UI.
- Vite: fast dev server/build tool.
- TypeScript: typed frontend models.
- React Router: page routing.
- Redux Toolkit: global app state and async thunks.
- Axios: HTTP API client.
- Socket.IO client: real-time events.
- Tailwind CSS: utility-first styling.
- Lucide React: icons.
- Recharts: dashboard charts.

Key frontend entry files:

### `frontend/src/main.tsx`
Mounts React into the browser DOM. It wraps the app with Redux provider so every component can access global state.

### `frontend/src/App.tsx`
Defines routes and app-level behavior:
- Verifies session on app load.
- Fetches clubs after login.
- Chooses an active club.
- Initializes socket connection.
- Wraps routes with `ProtectedRoute` and `RoleGuard`.

Important logic:
- `/dashboard` redirects system admins to `/admin/dashboard`.
- `/clubs/:clubId/tasks` shows club-scoped task view.
- `/tasks` shows personal tasks.

Inputs/outputs:
- Input: browser URL, Redux auth state.
- Output: selected page component.

Interview check:
- Why verify session on app load?
- Why protect routes on the frontend if backend also checks auth?

## 6. Backend Architecture

Backend stack:
- Express: HTTP server and routing.
- Mongoose: MongoDB ODM.
- JWT: auth tokens.
- bcrypt: password hashing.
- Passport Google OAuth: social login support.
- Socket.IO: live updates.
- Cron: scheduled jobs.
- Multer + Cloudinary: uploads.
- Helmet, rate limiting, sanitization: security.
- Winston/Morgan: logging.

### `backend/server.js`
This is the backend entry point:
- Loads `.env`.
- Connects MongoDB.
- Creates Express app and HTTP server.
- Initializes Socket.IO.
- Applies security, parsing, logging, sessions, Passport, rate limiting.
- Mounts routes under `/api`.
- Starts cron jobs with `io`.
- Starts listening on `PORT`.

Request path example:

```text
DELETE /api/notifications/:id
  -> server.js mounts notificationRoutes
  -> protect middleware validates JWT
  -> notification.controller.deleteNotification
  -> Notification.findOneAndDelete({ _id, recipient: req.user._id })
```

Interview check:
- Why is `io` attached to `app`?
- Why should cron jobs receive `io`?
- Why use `app.use('/api/tasks', taskRoutes)` instead of defining all routes in `server.js`?

## 7. Database Design

MongoDB collections are represented by Mongoose models.

### `User.model.js`
Stores users:
- name, email, password hash
- role
- profile photo
- club memberships
- auth metadata

Business role:
- Represents login identity and memberships.

### `Club.model.js`
Stores clubs:
- name, description, category
- createdBy
- members with roles
- stats
- settings

Relationship:
```text
Club.members[].user -> User
Club.createdBy -> User
```

### `Task.model.js`
Stores tasks:
- title, description
- club
- createdBy
- assignedTo users
- status, priority, dueDate
- tags, attachments, comments, subtasks, dependencies
- completion fields
- history

Methods:
- `addComment(userId, content, mentions, attachments)`
- `updateStatus(userId, newStatus)`
- `assignUser(userId, assigneeId)`
- `addAttachment(userId, attachment)`
- `toggleSubtask(userId, subtaskId)`

Hidden logic:
- `isOverdue` virtual computes overdue status.
- `progress` virtual computes completion based on subtasks/status.
- pre-save hook adds creation history.

### `Event.model.js`
Stores events:
- title, description
- club and creator
- date/time
- location
- RSVP responses
- attendance
- reminders
- cancellation state

Methods:
- `addRsvp`
- `markAttendance`
- `removeAttendance`
- `cancelEvent`

### `Notification.model.js`
Stores user notifications:
- recipient, sender
- type, title, message
- data references
- actionUrl
- read state
- priority

Methods:
- `markAsRead`
- `createNotification`
- `markAllAsRead`
- `getUnreadCount`
- `deleteOldNotifications`

### `AuditLog.model.js` / `AuditLog.js`
Stores tracked system actions. There appear to be two audit model files. That duplication should be cleaned because it can confuse imports and schema ownership.

Interview check:
- Why use references instead of embedding full user data in tasks?
- Why do tasks store history?
- Why are virtual fields useful?

## 8. Authentication Flow

```text
Login form
  -> authSlice.login thunk
  -> auth.service POST /auth/login
  -> backend auth controller validates credentials
  -> bcrypt compares password
  -> JWT issued
  -> frontend stores token/user
  -> apiInterceptors attach Authorization header
  -> protected backend routes use protect middleware
```

Frontend:
- `Login.tsx`, `Signup.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`.
- `authSlice.ts` stores user/session/loading/error.
- `ProtectedRoute.tsx` redirects unauthenticated users.
- `RoleGuard.tsx` blocks role-restricted screens.

Backend:
- `auth.routes.js` defines endpoints.
- `auth.controller.js` handles register/login/password reset/OAuth.
- `auth.js` middleware verifies token and attaches `req.user`.
- `passport.js` configures Google OAuth.

Security point: frontend guards improve UX, but backend guards are the real security boundary.

Interview check:
- Where is the JWT attached to requests?
- Why is password hashing necessary?
- What happens when token verification fails?

## 9. API Flow

Layer pattern:

```text
Frontend page/component
  -> Redux thunk
  -> service method
  -> Axios instance
  -> Express route
  -> middleware
  -> controller
  -> Mongoose model
```

Why this is good:
- Components do not know raw endpoint details.
- Services isolate HTTP.
- Controllers isolate backend business logic.
- Models isolate database shape.

## 10. State Management

Redux slices:
- `authSlice.ts`: user, login/register/logout/session.
- `clubSlice.ts`: clubs, current club, active club.
- `taskSlice.ts`: task lists, current task, comments, upload/status flows.
- `eventSlice.ts`: events and RSVP state.
- `notificationSlice.ts`: notification list, unread count, read/delete actions.
- `analyticsSlice.ts`: dashboard/analytics related state.
- `uiSlice.ts`: UI state.

Redux Toolkit thunks:
```text
component dispatches thunk
  -> thunk awaits service call
  -> pending/fulfilled/rejected reducers update state
```

Example:
```text
Notifications page delete button
  -> dispatch(deleteNotification(id))
  -> notificationsService.deleteNotification(id)
  -> DELETE /api/notifications/:id
  -> reducer removes item from state
```

Interview check:
- Why not call Axios directly inside every component?
- What is the difference between local state and Redux state?

## 11. Feature Workflows

### Clubs
Frontend:
- `ClubsList.tsx`, `Clubs.tsx`, `ClubDetails.tsx`, `ClubDetail.tsx`
- `ClubCard.tsx`, `ClubForm.tsx`, `InviteMemberModal.tsx`, `MemberRow.tsx`

Backend:
- `club.routes.js`
- `club.controller.js`
- `Club.model.js`

Workflow:
```text
Create club form
  -> create club API
  -> Club document saved
  -> creator becomes club owner/member
  -> frontend refreshes club list
```

Business logic:
- Clubs have members and member roles.
- Role checks decide who can manage members/tasks.

### Tasks
Frontend:
- `Tasks.tsx`: page controller for personal/club task views.
- `TaskBoard.tsx` / `KanbanBoard.tsx`: board layouts.
- `TaskCard.tsx`: compact task card.
- `TaskDetailModal.tsx`: status, proof upload, comments, attachments.
- `TaskForm.tsx`: task creation.
- `TaskListView.tsx`, `TaskCalendarView.tsx`: alternate views.

Backend:
- `task.routes.js`
- `task.controller.js`
- `Task.model.js`
- `taskPermissions.js`
- `upload.js`

Workflow:
```text
Officer creates task
  -> POST /api/clubs/:clubId/tasks or /api/tasks
  -> backend validates club role
  -> task saved
  -> notifications sent to assignees
  -> socket emits taskCreated
```

Status/proof workflow:
```text
User opens task modal
  -> changes status
  -> optionally adds proof note/comment
  -> uploads file/photo
  -> Cloudinary stores file
  -> task attachment saved
  -> taskUpdated socket event emitted
```

Validation:
- Status normalized between frontend (`in_progress`) and backend (`inprogress`).
- Priority normalized between frontend (`urgent`) and backend (`critical`).
- Assignees must belong to club.
- Permissions differ by action.

### Events
Frontend:
- `Events.tsx`, `EventDetail.tsx`
- `EventCard.tsx`, `EventForm.tsx`, `EventCalendar.tsx`, `RSVPToggle.tsx`, `AttendeeList.tsx`, `EventReminder.tsx`

Backend:
- `event.routes.js`
- `event.controller.js`
- `Event.model.js`

Workflow:
```text
Create event
  -> backend saves event
  -> members can RSVP
  -> cron sends reminders
  -> attendance can be marked
```

### Notifications
Frontend:
- `Notifications.tsx`
- `NotificationDropdown.tsx`
- `NotificationBadge.tsx`
- `notificationSlice.ts`
- `notifications.service.ts`

Backend:
- `notification.routes.js`
- `notification.controller.js`
- `Notification.model.js`
- `cronJobs.js`

Workflow:
```text
Task assigned / event reminder / cron job
  -> Notification.createNotification
  -> optional Socket.IO emit
  -> frontend receives/fetches notification
  -> unread badge updates
```

Recent bug you fixed:
- Backend returned `_id`.
- Frontend expected `id`.
- Adapter now maps Mongo `_id` to frontend `id`.

### Dashboard
Frontend:
- `Dashboard.tsx` is the main role-aware dashboard.
- `DashboardSummary.tsx`, `DashboardWidgets.tsx`, `TaskAnalyticsChart.tsx`, `PerformanceAnalytics.tsx`, `NotificationsPanel.tsx` are reusable/older dashboard components.

Backend:
- `analytics.routes.js`
- `analytics.controller.js`
- `admin.routes.js`
- `admin.controller.js`

Role behavior:
- Admin sees system totals.
- President sees club health and productivity.
- Vice president sees task execution.
- Secretary sees events and assigned work.
- Member sees personal workload.

## 12. Component Communication

```text
Parent page owns workflow handlers
  -> passes callbacks to child components
  -> child triggers callback
  -> parent dispatches Redux thunk
  -> store updates
  -> child rerenders from props/store
```

Example:
```text
Tasks.tsx
  passes onStatusChange to TaskDetailModal
TaskDetailModal
  calls onStatusChange(statusDraft)
Tasks.tsx
  dispatches updateTaskStatus
taskSlice
  updates currentTask/tasks
```

## 13. Security Implementation

Backend security:
- `helmet` for secure headers.
- `cors` controlled by `CLIENT_URL`.
- `express-rate-limit` for API/auth/uploads.
- `express-mongo-sanitize` against NoSQL injection.
- `xss-clean` against common XSS payloads.
- `hpp` against HTTP parameter pollution.
- JWT protect middleware.
- Role/club permission checks.
- Multer file type/size checks.

Security weaknesses:
- File uploads need virus scanning.
- Cloudinary URLs may be public.
- Refresh token strategy needs review.
- Some duplicate middleware folders increase confusion.
- Need automated permission tests.

## 14. Background Jobs

`backend/utils/cronJobs.js` runs:
- overdue task notifications daily
- due-soon task notifications hourly
- event reminders hourly
- daily work digest
- old notification cleanup weekly
- old audit log cleanup monthly

Important production point: cron jobs only run while the Node process is alive. In horizontally scaled deployment, every instance may run the same cron job unless you use a queue/leader lock.

Better production design:
```text
API server -> BullMQ queue -> Redis -> worker process -> MongoDB/notifications
```

## 15. Environment Variables

Backend likely needs:
- `PORT`
- `NODE_ENV`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRE`
- `CLIENT_URL`
- `SESSION_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- email SMTP settings for `sendEmail.js`
- rate limit overrides

Frontend likely needs:
- `VITE_API_URL`
- `VITE_SOCKET_URL`

## 16. Deployment Architecture

Simple deployment:
```text
Vercel/Netlify -> frontend static build
Render/Railway/Fly/AWS -> Node backend
MongoDB Atlas -> database
Cloudinary -> uploads
```

Production deployment:
```text
CDN
  -> React static assets
Load balancer
  -> API containers
Worker process
  -> background jobs
MongoDB Atlas
Redis
Cloudinary/private object storage
Monitoring/logging
```

## 17. Major File Catalog

Backend:
- `server.js`: Express/Socket.IO bootstrap.
- `config/database.js`: connects Mongoose to MongoDB.
- `config/logger.js`: Winston/Morgan logging.
- `config/passport.js`: Google OAuth.
- `config/cloudinary.js`: upload provider config.
- `models/User.model.js`: users/auth/memberships.
- `models/Club.model.js`: clubs/members/stats/settings.
- `models/Task.model.js`: task schema, comments, attachments, methods, virtuals.
- `models/Event.model.js`: event, RSVP, attendance, reminders.
- `models/Notification.model.js`: user notifications/read/delete helpers.
- `models/AuditLog.model.js`: audit trail model.
- `models/AuditLog.js`: duplicate audit model, should be consolidated.
- `controllers/auth.controller.js`: register/login/password/OAuth/session logic.
- `controllers/club.controller.js`: club CRUD and member management.
- `controllers/task.controller.js`: task CRUD, permissions, comments, status, proof upload.
- `controllers/event.controller.js`: events, RSVP, attendance.
- `controllers/notification.controller.js`: list/read/delete notifications.
- `controllers/analytics.controller.js`: dashboard analytics.
- `controllers/admin.controller.js`: admin system views.
- `controllers/user.controller.js`: user profile/admin user operations.
- `routes/*.routes.js`: maps URLs to controller functions.
- `middlewares/auth.js`: JWT auth and membership guards.
- `middlewares/validation.js`: express-validator schemas.
- `middlewares/taskPermissions.js`: task creation permission helper.
- `middlewares/upload.js`: multer upload validation.
- `middlewares/rateLimiter.js`: API/auth/upload/password reset limits.
- `middlewares/errorHandler.js`: centralized error response.
- `middleware/*`: compatibility re-exports to `middlewares/*`.
- `socket/socketHandler.js`: realtime Socket.IO behavior.
- `sockets/socketHandler.js`: duplicate/older socket folder, should be reviewed.
- `utils/cronJobs.js`: scheduled notification/cleanup jobs.
- `utils/sendEmail.js`: email helper.
- `utils/helpers.js`: shared utilities.

Frontend active files:
- `src/main.tsx`: mounts React.
- `src/App.tsx`: routing, auth bootstrap, socket setup.
- `src/index.css`: global theme and hidden scrollbars.
- `src/types/index.ts`: shared frontend domain types.
- `src/types/auth.types.ts`: auth-specific types.
- `src/services/api.ts`: Axios instance.
- `src/services/apiInterceptors.ts`: token/error interceptors.
- `src/services/adapters.ts`: backend-to-frontend shape mapping.
- `src/services/auth.service.ts`: auth API calls.
- `src/services/clubs.service.ts`: club API calls.
- `src/services/tasks.service.ts`: task API calls and upload API.
- `src/services/events.service.ts`: event API calls.
- `src/services/notifications.service.ts`: notification API calls.
- `src/services/dashboard.service.ts`: dashboard API calls.
- `src/services/analytics.service.ts`: analytics API calls.
- `src/services/socket.ts`: socket client.
- `src/store/store.ts`: Redux store.
- `src/store/hooks.ts`: typed Redux hooks.
- `src/store/slices/*.ts`: domain state slices.
- `src/hooks/useAuth.ts`: auth helper hook.
- `src/hooks/useClub.ts`: club helper hook.
- `src/hooks/useSocketIO.ts`: socket subscription lifecycle.
- `src/contexts/ThemeContext.tsx`: light/dark theme.
- `src/utils/rbac.ts`: role decision helpers.
- `src/utils/config.ts`: API/socket env config.
- `src/utils/constants.ts`: shared constants.
- `src/lib/utils.ts`: class name utility.
- `src/pages/*.tsx`: route screens.
- `src/components/auth/*`: route protection.
- `src/components/layout/*`: app shell/navigation.
- `src/components/tasks/*`: task feature UI.
- `src/components/events/*`: event feature UI.
- `src/components/clubs/*`: club feature UI.
- `src/components/members/*`: members UI.
- `src/components/notifications/*`: notification UI.
- `src/components/dashboard/*`: reusable dashboard UI.
- `src/components/ui/*`: local design system primitives.
- `src/components/error/ErrorBoundary.tsx`: React crash fallback.

Frontend scaffold/generated or secondary folders:
- `frontend/components/ui/*`: large shadcn-style component set; mostly separate from active `src/components/ui`.
- `frontend/app/*`: Next.js-style leftover.
- `frontend/hooks/*`, `frontend/lib/*`: duplicate helper locations.
- `frontend/dist/*`: generated build output.
- markdown files: implementation notes and module documentation.

## 18. AI-Generated Vs Custom Logic

Likely AI/scaffolded:
- duplicated `middleware` and `middlewares`
- duplicated `socket` and `sockets`
- root `frontend/components/ui` plus `frontend/src/components/ui`
- Next.js files in a Vite app
- many markdown summary files
- broad UI component library not fully used

Custom/project-specific:
- club roles and RBAC rules
- task workflow and status normalization
- proof attachment flow
- dashboard role resolution
- notification cron jobs
- Mongoose schemas for clubs/tasks/events

How to defend this in interviews:
"The initial scaffold was AI-assisted, but I progressively normalized API contracts, fixed permission and notification bugs, added proof uploads, improved dashboard scrolling, and hardened cron-driven notifications."

## 19. Production Weaknesses And Improvements

High priority:
- Remove duplicate folders/files.
- Add integration tests for auth, tasks, notifications.
- Add permission test matrix.
- Use Redis/BullMQ for background jobs.
- Add centralized error monitoring.
- Add file scanning and private uploads.
- Improve chunk splitting in frontend.
- Add pagination to all large lists.
- Add OpenAPI/Swagger docs.
- Add CI/CD.

Medium priority:
- Standardize response format.
- Add optimistic UI rollback.
- Add audit logs for notification deletes.
- Add admin controls for failed cron jobs.
- Add database migrations/seed strategy.

## 20. Interview Answers

Two-minute version:
"ClubFlow is a full-stack club operations platform built with React, Redux Toolkit, Express, MongoDB, Socket.IO, and Cloudinary. It supports authentication, role-based club access, task boards, events, notifications, dashboards, proof uploads, and cron-based reminders. The frontend uses route guards, typed services, adapters, and Redux slices. The backend uses Express routes, auth middleware, controllers, Mongoose models, rate limiting, validation, audit logs, and background jobs. The system solves the real problem of coordinating club work and accountability."

Ten-minute version:
"The app starts in React, verifies the user session, loads clubs, initializes sockets, and routes the user based on auth and role. Data flows through Redux thunks into service modules, which call Express APIs. Backend requests pass through security middleware and JWT protection before reaching controllers. Controllers enforce club membership and role rules, then use Mongoose models to read/write MongoDB. Socket.IO broadcasts task and notification changes. Cron jobs generate overdue, due-soon, event reminder, and digest notifications. Cloudinary handles proof attachments. The project uses adapters to normalize Mongo `_id` into frontend `id`, which keeps UI components backend-agnostic."

HR/non-technical version:
"It is a web platform that helps student clubs organize people, tasks, events, and communication. Leaders can assign work, members can track responsibilities, and everyone gets timely updates. It improves accountability and reduces missed deadlines."

Elevator pitch:
"ClubFlow is Trello plus event coordination for college clubs, with role-based permissions, real-time notifications, proof-of-work uploads, and leadership dashboards."

## 21. Viva Questions With Answers

Q: Why use Redux?
A: Shared state like auth, tasks, clubs, and notifications is needed across many pages/components. Redux Toolkit provides predictable async flows.

Q: Why use Mongoose?
A: It gives schemas, validation, relationships, hooks, methods, and query helpers on top of MongoDB.

Q: Why use Socket.IO?
A: Users should see task and notification updates without refreshing.

Q: Why use cron jobs?
A: Some actions are time-based, like overdue tasks, event reminders, and cleanup.

Q: What is the biggest weakness?
A: Background jobs run in the API process. Production should move them to a worker/queue system.

Q: How do you prevent unauthorized task updates?
A: Backend permission helpers check global role, club membership role, task creator, and assignee before allowing actions.

Q: How does proof upload work?
A: Frontend sends `multipart/form-data`; backend multer validates file; Cloudinary stores it; task attachment metadata is saved.

## 22. Your Next Study Path

Study order:
1. `server.js`
2. `auth` flow
3. `Task.model.js`
4. `task.controller.js`
5. `Tasks.tsx`
6. `taskSlice.ts`
7. `tasks.service.ts`
8. `adapters.ts`
9. `Notification.model.js`
10. `cronJobs.js`

Practice task:
- Trace "mark task done with proof upload" from button click to MongoDB update.
- Trace "delete notification" from UI click to database delete.
- Trace "event reminder cron job" from schedule to frontend badge update.

