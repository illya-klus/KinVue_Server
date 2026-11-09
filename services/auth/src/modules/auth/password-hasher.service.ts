import { Injectable } from "@nestjs/common";
import { argon2id, hash, verify } from "argon2";

export const ARGON2ID_PASSWORD_OPTIONS = Object.freeze({
  type: argon2id,
  memoryCost: 19 * 1024,
  timeCost: 2,
  parallelism: 1,
  hashLength: 32,
});

@Injectable()
export class PasswordHasherService {
  public hashPassword(password: string): Promise<string> {
    return hash(password, ARGON2ID_PASSWORD_OPTIONS);
  }

  public verifyPassword(
    encodedHash: string,
    password: string,
  ): Promise<boolean> {
    return verify(encodedHash, password);
  }
}
