import { BadRequestException } from "@nestjs/common";

export interface RegistrationInput {
  email: string;
  password: string;
  username: string;
  displayName: string;
}

export function validateRegistrationInput(input: unknown): RegistrationInput {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new BadRequestException("Invalid registration request");
  }

  const value = input as Record<string, unknown>;
  const email =
    typeof value["email"] === "string"
      ? value["email"].trim().toLowerCase()
      : "";
  const rawUsername =
    typeof value["username"] === "string" ? value["username"] : "";
  const username = rawUsername.trim().toLowerCase();
  const rawDisplayName =
    typeof value["displayName"] === "string" ? value["displayName"] : "";
  const displayName = rawDisplayName.trim();
  const password =
    typeof value["password"] === "string" ? value["password"] : "";

  if (
    !email ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new BadRequestException("Invalid registration request");
  }
  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    throw new BadRequestException("Invalid registration request");
  }
  if (displayName.length < 1 || displayName.length > 100) {
    throw new BadRequestException("Invalid registration request");
  }
  const passwordBytes = Buffer.byteLength(password, "utf8");
  if (passwordBytes < 12 || passwordBytes > 1024) {
    throw new BadRequestException("Invalid registration request");
  }

  return { email, username, displayName, password };
}
