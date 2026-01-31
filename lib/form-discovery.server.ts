/**
 * Form Discovery - Server-Side Module
 *
 * Auto-discovers forms from the /forms directory by reading frontmatter.
 * This module uses Node.js fs and can only run on the server.
 */

import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import matter from "gray-matter";

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
 * Auto-discover all forms from the /forms directory
 * Reads frontmatter from each .form.md file to extract role metadata
 */
export function discoverFormsFromDirectory(): DiscoveredRole[] {
  const formsDir = join(process.cwd(), "forms");
  const roles: DiscoveredRole[] = [];

  try {
    const files = readdirSync(formsDir);

    for (const file of files) {
      if (!file.endsWith(".form.md")) continue;

      try {
        const filePath = join(formsDir, file);
        const content = readFileSync(filePath, "utf-8");
        const { data: frontmatter } = matter(content);

        // Extract role metadata from frontmatter
        const roleData = frontmatter.markform?.role;
        if (!roleData?.id) {
          console.warn(`Form ${file} missing role.id in frontmatter, skipping`);
          continue;
        }

        roles.push({
          id: roleData.id,
          title: roleData.title || frontmatter.markform?.title || "Untitled",
          experience: roleData.experience || "Not specified",
          targetScore: frontmatter.markform?.target_score || "Not specified",
          estimatedTime: roleData.estimated_time || "Not specified",
          description: frontmatter.markform?.description || "",
          formFile: file,
          sortOrder: roleData.sort_order ?? 999,
        });
      } catch (err) {
        console.error(`Failed to parse form ${file}:`, err);
      }
    }

    // Sort by sortOrder
    roles.sort((a, b) => a.sortOrder - b.sortOrder);

    return roles;
  } catch (err) {
    console.error("Failed to read forms directory:", err);
    return [];
  }
}

/**
 * Get a specific role by ID (server-side)
 */
export function getDiscoveredRoleServer(roleId: string): DiscoveredRole | null {
  const roles = discoverFormsFromDirectory();
  return roles.find((r) => r.id === roleId) || null;
}

/**
 * Get form filename for a role ID (server-side)
 */
export function getFormFileForRoleServer(roleId: string): string | null {
  const role = getDiscoveredRoleServer(roleId);
  return role ? role.formFile : null;
}

/**
 * Get all role IDs (server-side)
 */
export function getAllRoleIdsServer(): string[] {
  return discoverFormsFromDirectory().map((r) => r.id);
}
