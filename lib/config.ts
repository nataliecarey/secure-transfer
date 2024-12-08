import { join } from "jsr:@std/path";

export const sqliteFileLocation =
  Deno.env.get("SECURE_TRANSFER__SQLITE_FILE_LOCATION") ?? "test.db";
export const baseDir = join(import.meta.dirname || Deno.cwd(), "..");
export const publicWebDir = join(baseDir, "public");
export const viewsDir = join(baseDir, "views");
