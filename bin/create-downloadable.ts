#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-ffi

import { Storage } from "../db/storage.ts";
import { FullDownloadableDescription } from "../lib/types.ts";
const path = Deno.args[0];
if (!path) {
  console.error("Please provide a path to a file or directory");
  Deno.exit(1);
}
if (!path.startsWith("/")) {
  console.error("Please provide an absolute path");
  Deno.exit(1);
}

console.log("Path:", path);

async function askQuestion(question: string): Promise<string> {
  await Deno.stdout.write(new TextEncoder().encode(question + ": "));

  const buf = new Uint8Array(1024);
  const n = <number> await Deno.stdin.read(buf);
  return new TextDecoder().decode(buf.subarray(0, n)).trim();
}

async function getAvailableUntil(): Promise<Date | null> {
  const response = await askQuestion(
    "Available until (YYYY-MM-DD) or empty for unlimited",
  );
  if (response === "") {
    return null;
  }
  const date = new Date(response);
  if (isNaN(date.getTime())) {
    console.error("Invalid date");
    Deno.exit(1);
  }
  date.setHours(23, 59, 59, 999);
  return date;
}

const connection = new Storage();
let isDirectory = false;
try {
  const fileInfo = await Deno.stat(path);
  isDirectory = fileInfo.isDirectory;
} catch (e) {
  console.error("Error accessing file or directory", e);
  Deno.exit(1);
}
if (isDirectory) {
  console.error("Directory detected, not yet supported");
  Deno.exit(1);
}
console.log((isDirectory ? "Directory" : "File") + " detected");

const fullDescription: FullDownloadableDescription = {
  name: await askQuestion("Name"),
  description: await askQuestion("Description"),
  urlKey: await askQuestion("URL Key"),
  plainTextPassword: await askQuestion("Password"),
  availableUntil: await getAvailableUntil(),
  path,
  isDirectory,
};

console.log("Creating downloadable with the following details:");
console.log(fullDescription);
const result = await connection.createDownloadable(fullDescription);
console.log(result);
connection.close();
