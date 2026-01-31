import { discoverFormsFromDirectory } from "@/lib/form-discovery.server";
import { NextResponse } from "next/server";

/**
 * GET /api/roles
 * Returns all available assessment roles, auto-discovered from /forms directory
 */
export async function GET() {
  const roles = discoverFormsFromDirectory();
  return NextResponse.json(roles);
}
