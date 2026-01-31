/**
 * Role Configuration
 *
 * Manages assessment roles configuration.
 * Roles are auto-discovered from form files in the /forms directory.
 *
 * To add a new role:
 * 1. Create a new .form.md file in /forms (e.g., intern-implementation.form.md)
 * 2. Add role metadata to the frontmatter:
 *    ```yaml
 *    markform:
 *      role:
 *        id: intern
 *        title: Intern Implementation
 *        experience: "0 years"
 *        estimated_time: "45-60 minutes"
 *        sort_order: 0
 *    ```
 * 3. The role will be auto-detected - no code changes needed!
 */

import { discoverForms, getDiscoveredRole, DiscoveredRole } from './form-discovery';

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
 * Convert DiscoveredRole to RoleInfo for backward compatibility
 */
function toRoleInfo(role: DiscoveredRole): RoleInfo {
  return {
    id: role.id,
    title: role.title,
    experience: role.experience,
    targetScore: role.targetScore,
    estimatedTime: role.estimatedTime,
    description: role.description,
    formFile: role.formFile,
  };
}

/**
 * Get all available roles
 * Auto-discovers roles from form files in /forms directory
 */
export function getAvailableRoles(): RoleInfo[] {
  return discoverForms().map(toRoleInfo);
}

/**
 * Get information for a specific role
 */
export function getRoleInfo(roleId: string): RoleInfo | null {
  const role = getDiscoveredRole(roleId);
  return role ? toRoleInfo(role) : null;
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
 * Get default role IDs (all discovered roles)
 */
export function getDefaultRoleIds(): string[] {
  return discoverForms().map((r) => r.id);
}

/**
 * Get form filename for a role
 */
export function getFormFile(roleId: string): string | null {
  const role = getRoleInfo(roleId);
  return role ? role.formFile : null;
}
