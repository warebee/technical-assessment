import { parseMarkformEnhanced } from "@/lib/markform-parser";
import { readFileSync } from "fs";
import { join } from "path";
import { notFound } from "next/navigation";
import Step3Client from "./Step3Client";

// Read form file server-side
function loadFormContent(roleId: string): string | null {
  const formFileMap: Record<string, string> = {
    junior: "junior-implementation.form.md",
    mid: "mid-implementation.form.md",
    senior: "senior-implementation.form.md",
  };

  const filename = formFileMap[roleId];
  if (!filename) return null;

  try {
    const filePath = join(process.cwd(), "forms", filename);
    return readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error(`Failed to load form for role ${roleId}:`, error);
    return null;
  }
}

export default function Step3Page() {
  // Pre-load all form files server-side
  // The client component will determine which one to use based on wizard state
  const forms: Record<string, ReturnType<typeof parseMarkformEnhanced> | null> = {};

  const roles = ["junior", "mid", "senior"];
  for (const role of roles) {
    const content = loadFormContent(role);
    if (content) {
      forms[role] = parseMarkformEnhanced(content);
    }
  }

  // If no forms loaded, show error
  if (Object.values(forms).every((f) => f === null)) {
    notFound();
  }

  return <Step3Client forms={forms} />;
}
