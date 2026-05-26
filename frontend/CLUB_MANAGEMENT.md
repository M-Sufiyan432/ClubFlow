# Club Management System - Implementation Guide

## Overview

The ClubFlow club management system provides a complete platform for managing clubs, members, roles, and invitations with full API integration and role-based access control.

## Architecture

### Redux State Management

**File: `src/store/slices/clubSlice.ts`**

Manages the following state:
- `clubs`: Array of user's clubs
- `currentClub`: Currently selected club with full details
- `members`: Members of the current club
- `isLoading`: Loading state for detail operations
- `isFetching`: Loading state for list operations
- `error`: Error messages

### Async Thunks

All thunks return `.unwrap()` for error handling:

```typescript
// Fetch user's clubs
await dispatch(fetchClubs()).unwrap()

// Get club details with members
await dispatch(fetchClubDetail(clubId)).unwrap()

// Create new club
await dispatch(createClub(data)).unwrap()

// Update club
await dispatch(updateClub({ clubId, data })).unwrap()

// Delete club
await dispatch(deleteClub(clubId)).unwrap()

// Member operations
await dispatch(inviteMember({ clubId, data })).unwrap()
await dispatch(updateMemberRole({ clubId, memberId, data })).unwrap()
await dispatch(removeMember({ clubId, memberId })).unwrap()
```

### API Service

**File: `src/services/clubs.service.ts`**

Provides typed API endpoints:

```typescript
clubsService.listClubs()
clubsService.getClub(clubId)
clubsService.createClub(data)
clubsService.updateClub(clubId, data)
clubsService.deleteClub(clubId)
clubsService.getClubMembers(clubId)
clubsService.inviteMember(clubId, data)
clubsService.updateMemberRole(clubId, memberId, data)
clubsService.removeMember(clubId, memberId)
```

## Components

### Pages

#### Clubs Page (`src/pages/Clubs.tsx`)
- Lists user's clubs with pagination
- Create club form inline
- Click card to navigate to club detail
- Real-time loading and error states

#### Club Detail Page (`src/pages/ClubDetail.tsx`)
- Three tabs: Overview, Members, Settings
- Overview: Club info and metadata
- Members: List of members with role management
- Settings: Club configuration (admin only)
- Real-time member operations

### Components

#### MemberRow (`src/components/clubs/MemberRow.tsx`)
- Displays member with avatar and role
- Role dropdown (admin only)
- Remove button (admin only)
- Owner badge indicator

#### InviteMemberModal (`src/components/clubs/InviteMemberModal.tsx`)
- Email input with validation
- Role selection
- Success/error feedback
- Closes on successful invite

## Hooks

### useClub Hook (`src/hooks/useClub.ts`)

Convenience hook for club operations:

```typescript
const {
  currentClub,        // Current club object
  members,            // Array of club members
  isLoading,          // Loading state
  error,              // Error message
  user,               // Current user
  getCurrentUserRole,  // Get user's role in club
  isAdmin,            // Check if user is admin
  isOwner,            // Check if user owns club
  canManageMembers,   // Check if user can manage
  loadClub,           // Load club details
  loadMembers,        // Load member list
  inviteUser,         // Invite member
  updateRole,         // Change member role
  removeMemberFromClub, // Remove member
  clearError,         // Clear error state
} = useClub(clubId)
```

## Types

### User Roles

```typescript
enum UserRole {
  SUPER_ADMIN = 'super_admin',  // Can manage all clubs
  CLUB_ADMIN = 'club_admin',     // Can manage club
  MEMBER = 'member',             // Can view club
}
```

### Club Structure

```typescript
interface Club {
  id: string
  name: string
  description: string
  logo?: string
  category?: string
  status: 'active' | 'archived'
  owner: ClubOwner         // Club creator
  members: ClubMember[]    // All club members
  memberCount: number
  settings?: ClubSettings
  createdAt: string
  updatedAt: string
}

interface ClubMember {
  id: string
  userId: string
  name: string
  email: string
  avatar?: string
  role: UserRole          // Member's role
  joinedAt: string
  inviteStatus?: InviteStatus
}

interface ClubSettings {
  isPrivate: boolean
  allowPublicJoin: boolean
  requireApproval: boolean
  description: string
}
```

## Usage Examples

### Creating a Club

```typescript
const { handleCreateClub } = useClubs()

const handleSubmit = async (formData) => {
  try {
    const newClub = await dispatch(createClub(formData)).unwrap()
    navigate(`/clubs/${newClub.id}`)
  } catch (error) {
    setError(error.message)
  }
}
```

### Managing Members

```typescript
const { loadClub, inviteUser, updateRole, removeMemberFromClub } = useClub(clubId)

// Invite a member
await inviteUser('member@example.com', UserRole.MEMBER)

// Change role
await updateRole(memberId, UserRole.CLUB_ADMIN)

// Remove member
await removeMemberFromClub(memberId)
```

### Checking Permissions

```typescript
const { isOwner, isAdmin, canManageMembers } = useClub(clubId)

if (isOwner()) {
  // Show delete button
}

if (canManageMembers()) {
  // Show invite button
}
```

## Role-Based Access Control

### Super Admin
- Create clubs
- View all clubs
- Delete any club
- Manage any club members

### Club Admin (Owner)
- Edit club settings
- Invite/remove members
- Change member roles
- Transfer ownership
- Delete club

### Member
- View club details
- View member list
- Cannot manage club

## API Endpoints

```
GET    /api/clubs                      # List user's clubs
POST   /api/clubs                      # Create club
GET    /api/clubs/:id                  # Get club details
PATCH  /api/clubs/:id                  # Update club
DELETE /api/clubs/:id                  # Delete club

GET    /api/clubs/:id/members          # List members
POST   /api/clubs/:id/invite           # Invite member
PATCH  /api/clubs/:id/members/:mid     # Update member role
DELETE /api/clubs/:id/members/:mid     # Remove member

POST   /api/clubs/:id/transfer-ownership # Transfer ownership
GET    /api/clubs/:id/pending-invites  # Get pending invites
POST   /api/invites/:id/respond        # Accept/reject invite
```

## Error Handling

All async thunks provide error feedback:

```typescript
try {
  await dispatch(inviteMember({ clubId, data })).unwrap()
} catch (error) {
  // error is the rejection payload string
  console.error(error) // "Failed to invite member"
}
```

Errors flow through the Redux state:
```typescript
const { error } = useAppSelector(state => state.clubs)
// Display error in UI
if (error) {
  <div className="error">{error}</div>
}
```

## Loading States

Different loading indicators for different operations:

```typescript
// List loading (clubs page)
const { isFetching } = useAppSelector(state => state.clubs)

// Detail loading (club page)
const { isLoading } = useAppSelector(state => state.clubs)
```

## Best Practices

1. **Always unwrap async thunks** for proper error handling
2. **Use useClub hook** instead of direct dispatch for convenience
3. **Check permissions** before showing UI elements
4. **Handle errors gracefully** with user feedback
5. **Use loading states** to disable buttons during operations
6. **Clear errors** after handling or on new operations
7. **Validate input** before API calls
8. **Debounce rapid operations** to prevent duplicate requests

## Testing

Test the following scenarios:

1. Create club without permission (should fail)
2. Invite member to non-existent email (should fail)
3. Change role with insufficient permissions (should fail)
4. Remove owner from club (should fail)
5. Transfer ownership (should update state)
6. Delete club (should remove from list)

## Future Enhancements

- Activity logging
- Member invitations management
- Club templates
- Bulk member operations
- Member search/filtering
- Join requests for public clubs
- Club analytics dashboard
