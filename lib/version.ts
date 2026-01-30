// CalVer versioning - managed via package.json
// Format: YYYY.MM.DD or YYYY.MM.DD.patch
import pkg from '../package.json';

export const VERSION = pkg.version;
export const APP_NAME = pkg.name;

// For logging
export function logVersion(context: string) {
  console.log(`[${context}] Version ${VERSION}`);
}
