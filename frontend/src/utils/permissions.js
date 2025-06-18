// Role-based permissions utility

// Role constants
export const ROLES = {
  OWNER: 1,
  MANAGER: 2,
  OPERATOR: 3
};

// Role names
export const ROLE_NAMES = {
  [ROLES.OWNER]: 'owner',
  [ROLES.MANAGER]: 'manager',
  [ROLES.OPERATOR]: 'operator'
};

// Get user data from localStorage or context
export function getCurrentUser() {
  try {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
}

// Save user data to localStorage
export function setCurrentUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user));
}

// Remove user data
export function removeCurrentUser() {
  localStorage.removeItem('currentUser');
}

// Check if user has required role or higher
export function hasRole(requiredRoleId) {
  const user = getCurrentUser();
  if (!user || !user.roleId) {
    return false;
  }
  
  // Lower role_id means higher permission (owner=1, manager=2, operator=3)
  return user.roleId <= requiredRoleId;
}

// Specific role checks
export function isOwner() {
  return hasRole(ROLES.OWNER);
}

export function isManager() {
  return hasRole(ROLES.MANAGER);
}

export function isOperator() {
  return hasRole(ROLES.OPERATOR);
}

// Feature-specific permission checks
export function canAccessSettings() {
  return isOwner();
}

export function canAccessExpenses() {
  return hasRole(ROLES.MANAGER); // Owner and Manager
}

export function canManageExpenseCategories() {
  return isOwner();
}

export function canManageMaintenanceCategories() {
  return isOwner();
}

export function canViewReports() {
  return true; // All roles can view reports
}

export function canManageCars() {
  return true; // All roles can manage cars
}

export function canManageMaintenance() {
  return true; // All roles can manage maintenance
}

// Navigation permissions
export function getVisibleNavigationItems() {
  const allItems = [
    { key: 'dashboard', path: '/dashboard', visible: true },
    { key: 'cars', path: '/cars', visible: canManageCars() },
    { key: 'maintenance', path: '/maintenance', visible: canManageMaintenance() },
    { key: 'expenses', path: '/expenses', visible: canAccessExpenses() },
    { key: 'reports', path: '/reports', visible: canViewReports() },
    { key: 'settings', path: '/settings', visible: canAccessSettings() }
  ];
  
  return allItems.filter(item => item.visible);
}

// Get user role display name
export function getUserRoleDisplayName() {
  const user = getCurrentUser();
  if (!user || !user.role) {
    return 'Unknown';
  }
  
  // Capitalize first letter
  return user.role.charAt(0).toUpperCase() + user.role.slice(1);
}

// Get role badge color
export function getRoleBadgeColor(roleId) {
  switch (roleId) {
    case ROLES.OWNER:
      return 'primary'; // Blue
    case ROLES.MANAGER:
      return 'success'; // Green
    case ROLES.OPERATOR:
      return 'secondary'; // Gray
    default:
      return 'secondary';
  }
}

// Permission error messages
export function getPermissionErrorMessage(feature) {
  const user = getCurrentUser();
  const userRole = user ? getUserRoleDisplayName() : 'Unknown';
  
  const messages = {
    settings: `Only owners can access settings. Your role: ${userRole}`,
    expenses: `Only owners and managers can access expenses. Your role: ${userRole}`,
    default: `You don't have permission to access this feature. Your role: ${userRole}`
  };
  
  return messages[feature] || messages.default;
} 