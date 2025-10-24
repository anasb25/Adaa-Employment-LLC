# User Invitation System

This document describes the frontend components and functionality for the user invitation system with role-based access control.

## Overview

The invitation system allows administrators to invite new users by email and assign them specific roles. The system includes:

- **Invitation Form**: Send invitations with email and role selection
- **Invitation List**: View and manage sent invitations
- **Role Management**: Select roles from a dropdown
- **Permission Guards**: Protect components based on user permissions
- **Wildcard Permissions**: Support for `user:all`, `role:all`, `permission:all`, and `global:all`

## Components

### 1. InvitationForm

A form component for creating new user invitations.

**Features:**

- Email validation
- Role selection dropdown
- Loading states
- Error handling
- Success feedback

**Usage:**

```tsx
import InvitationForm from "../components/invitations/InvitationForm";

<InvitationForm
  onSuccess={() => console.log("Invitation sent!")}
  onCancel={() => setShowForm(false)}
/>;
```

### 2. InvitationList

Displays all invitations sent by the current user.

**Features:**

- Real-time status updates
- Cancel/Resend actions
- Expiration tracking
- Responsive design

**Usage:**

```tsx
import InvitationList from "../components/invitations/InvitationList";

<InvitationList refreshTrigger={refreshCount} />;
```

### 3. RoleSelect

A dropdown component for selecting user roles.

**Features:**

- Fetches roles from API
- Loading states
- Error handling
- Accessible design

**Usage:**

```tsx
import RoleSelect from "../components/form/RoleSelect";

<RoleSelect
  value={selectedRoleId}
  onChange={(roleId) => setSelectedRoleId(roleId)}
  placeholder="Select a role"
/>;
```

### 4. InvitationsPage

Main page component that combines the form and list.

**Features:**

- Modal form overlay
- Integrated list view
- Refresh functionality
- Responsive layout

**Usage:**

```tsx
import InvitationsPage from "../components/invitations/InvitationsPage";

<InvitationsPage />;
```

## Permission System

### PermissionGuard Component

Protects components based on user permissions and roles.

**Features:**

- Single or multiple permission checks
- Role-based access control
- Wildcard permission support
- Fallback content for unauthorized users

**Usage:**

```tsx
import PermissionGuard from '../components/auth/PermissionGuard';

// Single permission
<PermissionGuard permission="user:create">
  <InvitationForm />
</PermissionGuard>

// Multiple permissions (user needs ANY)
<PermissionGuard permissions={["user:create", "user:update"]}>
  <UserManagement />
</PermissionGuard>

// Multiple permissions (user needs ALL)
<PermissionGuard permissions={["user:create", "user:update"]} requireAll>
  <AdvancedUserManagement />
</PermissionGuard>

// Role-based access
<PermissionGuard roles={["admin", "manager"]}>
  <AdminPanel />
</PermissionGuard>

// With fallback
<PermissionGuard
  permission="user:delete"
  fallback={<div>Access Denied</div>}
>
  <DeleteUserButton />
</PermissionGuard>
```

### usePermissions Hook

Provides permission checking utilities.

**Features:**

- Permission checking with wildcard support
- Role checking
- Bulk permission operations
- User role and permission access

**Usage:**

```tsx
import { usePermissions } from "../hooks/usePermissions";

const MyComponent = () => {
  const {
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAllPermissions,
    hasAnyPermission,
    getUserPermissions,
    getUserRole,
  } = usePermissions();

  // Check single permission
  if (hasPermission("user:create")) {
    // Show create button
  }

  // Check multiple permissions
  if (hasAnyPermission(["user:create", "user:update"])) {
    // Show user management
  }

  // Check role
  if (hasRole("admin")) {
    // Show admin features
  }

  // Get all user permissions
  const permissions = getUserPermissions();

  return <div>...</div>;
};
```

## API Services

### invitationApi

Handles all invitation-related API calls.

**Methods:**

- `createInvitation(data)` - Send new invitation
- `getMyInvitations()` - Get user's sent invitations
- `acceptInvitation(data)` - Accept invitation
- `validateInvitation(token)` - Validate invitation token
- `cancelInvitation(id)` - Cancel invitation
- `resendInvitation(id)` - Resend invitation

### rolesApi

Handles role management API calls.

**Methods:**

- `getRoles()` - Get all roles
- `getRole(id)` - Get specific role
- `createRole(data)` - Create new role
- `updateRole(id, data)` - Update role
- `deleteRole(id)` - Delete role
- `assignPermissions(roleId, permissionIds)` - Assign permissions to role

## Types

### Invitation Types

```typescript
interface CreateInvitationRequest {
  email: string;
  roleId: number;
}

interface Invitation {
  id: number;
  email: string;
  role: {
    id: number;
    name: string;
    description: string;
  };
  status: InvitationStatus;
  expiresAt: string;
  inviter: {
    id: number;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  acceptedAt?: string;
}

enum InvitationStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
}
```

### Auth Types

```typescript
interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  permissions: Permission[];
}

interface Permission {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}
```

## Wildcard Permissions

The system supports wildcard permissions for simplified access control:

- `user:all` - All user-related permissions
- `role:all` - All role-related permissions
- `permission:all` - All permission-related permissions
- `global:all` - All permissions across all resources

**Example:**

```tsx
// User with 'user:all' permission can access any user permission
<PermissionGuard permission="user:create">  // ✅ Allowed
<PermissionGuard permission="user:update">  // ✅ Allowed
<PermissionGuard permission="user:delete">  // ✅ Allowed

// User with 'global:all' permission can access anything
<PermissionGuard permission="role:create">  // ✅ Allowed
<PermissionGuard permission="permission:read">  // ✅ Allowed
```

## Integration Example

```tsx
import React from "react";
import InvitationsPage from "../components/invitations/InvitationsPage";
import PermissionGuard from "../components/auth/PermissionGuard";

const AdminDashboard = () => {
  return (
    <div>
      <h1>Admin Dashboard</h1>

      <PermissionGuard
        permission="user:create"
        fallback={<div>You need user:create permission</div>}
      >
        <InvitationsPage />
      </PermissionGuard>
    </div>
  );
};
```

## Next Steps

1. **User Management**: Create components for managing existing users
2. **Role Management**: Build UI for creating and editing roles
3. **Permission Management**: Create interface for managing permissions
4. **User Profile**: Update user profile components to work with new role system
5. **Dashboard**: Create role-based dashboard views
6. **Audit Log**: Track invitation and role changes

## Security Notes

- All API calls are protected by JWT authentication
- Permission checks happen both on frontend and backend
- Wildcard permissions provide flexible but secure access control
- Invitation tokens expire automatically
- Role assignments are validated on the backend
