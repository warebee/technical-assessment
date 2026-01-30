/**
 * Role Configuration
 *
 * Manages assessment roles configuration.
 * Roles are defined statically but can be extended by adding new form files.
 */

export interface RoleInfo {
  id: string;
  title: string;
  experience: string;
  targetScore: string;
  estimatedTime: string;
  description: string;
  formFile: string;
}

/**
 * Static role configuration
 * This matches the form files in the /forms directory
 * To add a new role, add an entry here and create the corresponding .form.md file
 */
const ROLES_CONFIG: RoleInfo[] = [
  {
    id: 'junior',
    title: 'Junior Implementation',
    experience: '0-2 years',
    targetScore: '60-75 points',
    estimatedTime: '60-90 minutes',
    description: 'SQL and data analysis assessment for junior implementation roles (0-2 years experience)',
    formFile: 'junior-implementation.form.md',
  },
  {
    id: 'mid',
    title: 'Mid-Level Implementation',
    experience: '2-5 years',
    targetScore: '76-90 points',
    estimatedTime: '90-120 minutes',
    description: 'SQL and data analysis assessment for mid-level implementation roles (2-5 years experience)',
    formFile: 'mid-implementation.form.md',
  },
  {
    id: 'senior',
    title: 'Senior Implementation',
    experience: '5+ years',
    targetScore: '91+ points',
    estimatedTime: '120-180 minutes',
    description: 'SQL and data analysis assessment for senior implementation roles (5+ years experience)',
    formFile: 'senior-implementation.form.md',
  },
];

/**
 * Get all available roles
 * Returns the static configuration of available assessment roles
 */
export function getAvailableRoles(): RoleInfo[] {
  return ROLES_CONFIG;
}

/**
 * Get information for a specific role
 */
export function getRoleInfo(roleId: string): RoleInfo | null {
  return ROLES_CONFIG.find((r) => r.id === roleId) || null;
}

/**
 * Get information for multiple roles
 */
export function getMultipleRolesInfo(roleIds: string[]) {
  const rolesInfo = roleIds
    .map((roleId) => {
      const info = getRoleInfo(roleId);
      return info ? { role: roleId, info } : null;
    })
    .filter(Boolean) as Array<{ role: string; info: RoleInfo }>;

  // Calculate total estimated time (take max of all selected roles)
  const timeRanges = rolesInfo.map(({ info }) => {
    const match = info.estimatedTime.match(/(\d+)-(\d+)/);
    if (match) {
      return { min: parseInt(match[1]), max: parseInt(match[2]) };
    }
    return { min: 0, max: 0 };
  });

  const totalMin = timeRanges.length > 0 ? Math.max(...timeRanges.map((t) => t.min)) : 0;
  const totalMax = timeRanges.length > 0 ? Math.max(...timeRanges.map((t) => t.max)) : 0;
  const totalEstimatedTime = totalMin > 0 ? `${totalMin}-${totalMax} minutes` : 'Not specified';

  return {
    totalEstimatedTime,
    roles: rolesInfo,
  };
}

/**
 * Get default role IDs
 */
export function getDefaultRoleIds(): string[] {
  return ROLES_CONFIG.map((r) => r.id);
}

/**
 * Get form filename for a role
 */
export function getFormFile(roleId: string): string | null {
  const role = getRoleInfo(roleId);
  return role ? role.formFile : null;
}
