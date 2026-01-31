/**
 * Form Discovery - Client-Safe Module
 *
 * This module provides role information that works on both server and client.
 * For auto-discovery from file system, see form-discovery.server.ts
 *
 * When you add a new form file with role metadata:
 * 1. The form will be auto-discovered on the server (API routes, form loading)
 * 2. Update STATIC_ROLES below to make it appear in client-side role selection
 */

export interface DiscoveredRole {
  id: string;
  title: string;
  experience: string;
  targetScore: string;
  estimatedTime: string;
  description: string;
  formFile: string;
  sortOrder: number;
}

/**
 * Static role configuration
 *
 * This list is used for client-side rendering.
 * Keep it in sync with your form files.
 *
 * To add a new role:
 * 1. Create the .form.md file with role metadata in frontmatter
 * 2. Add an entry here for client-side display
 */
const STATIC_ROLES: DiscoveredRole[] = [
  {
    id: "junior",
    title: "Junior Implementation",
    experience: "0-2 years",
    targetScore: "60-75 points",
    estimatedTime: "60-90 minutes",
    description:
      "SQL and data analysis assessment for junior implementation roles (0-2 years experience)",
    formFile: "junior-implementation.form.md",
    sortOrder: 1,
  },
  {
    id: "mid",
    title: "Mid-Level Implementation",
    experience: "2-5 years",
    targetScore: "76-90 points",
    estimatedTime: "90-120 minutes",
    description:
      "SQL and data analysis assessment for mid-level implementation roles (2-5 years experience)",
    formFile: "mid-implementation.form.md",
    sortOrder: 2,
  },
  {
    id: "senior",
    title: "Senior Implementation",
    experience: "5+ years",
    targetScore: "91+ points",
    estimatedTime: "120-180 minutes",
    description:
      "SQL and data analysis assessment for senior implementation roles (5+ years experience)",
    formFile: "senior-implementation.form.md",
    sortOrder: 3,
  },
];

/**
 * Get all discovered roles
 * Returns the static list (safe for client-side use)
 */
export function discoverForms(): DiscoveredRole[] {
  return STATIC_ROLES;
}

/**
 * Get a specific role by ID
 */
export function getDiscoveredRole(roleId: string): DiscoveredRole | null {
  return STATIC_ROLES.find((r) => r.id === roleId) || null;
}

/**
 * Get form filename for a role ID
 */
export function getFormFileForRole(roleId: string): string | null {
  const role = getDiscoveredRole(roleId);
  return role ? role.formFile : null;
}

/**
 * Check if a role exists
 */
export function roleExists(roleId: string): boolean {
  return getDiscoveredRole(roleId) !== null;
}

/**
 * Get all role IDs
 */
export function getAllRoleIds(): string[] {
  return STATIC_ROLES.map((r) => r.id);
}
