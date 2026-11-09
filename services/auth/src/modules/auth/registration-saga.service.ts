import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { AuthIdentityRepository } from "./auth-identity.repository.js";
import { PasswordHasherService } from "./password-hasher.service.js";
import type { RegistrationInput } from "./registration-input.js";
import { UsersProfileClient } from "./users-profile.client.js";

export const REGISTRATION_RETRY_SLEEP = Symbol("REGISTRATION_RETRY_SLEEP");
export type RegistrationRetrySleep = (milliseconds: number) => Promise<void>;
const RETRY_BACKOFF_MS = [100, 250] as const;

@Injectable()
export class RegistrationSagaService {
  public constructor(
    private readonly identities: AuthIdentityRepository,
    private readonly passwordHasher: PasswordHasherService,
    private readonly users: UsersProfileClient,
    @Inject(REGISTRATION_RETRY_SLEEP)
    private readonly sleep: RegistrationRetrySleep,
  ) {}

  public async register(
    input: RegistrationInput,
  ): Promise<{ userId: string; status: "ACTIVE" }> {
    const userId = randomUUID();
    const passwordHash = await this.passwordHasher.hashPassword(input.password);
    await this.identities.createPending(userId, input.email, passwordHash);

    await this.identities.transitionStatus(
      userId,
      "PENDING",
      "PROFILE_CREATING",
    );
    const profileInput = {
      userId,
      username: input.username,
      displayName: input.displayName,
    };
    try {
      for (let attempt = 0; ; attempt += 1) {
        try {
          await this.users.createProfile(profileInput);
          break;
        } catch (error) {
          if (
            !(error instanceof ServiceUnavailableException) ||
            attempt >= RETRY_BACKOFF_MS.length
          ) {
            throw error;
          }
          await this.sleep(RETRY_BACKOFF_MS[attempt]);
        }
      }
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        await this.identities.compensateRegistration(userId);
      }
      throw error;
    }
    await this.identities.transitionStatus(
      userId,
      "PROFILE_CREATING",
      "ACTIVE",
    );

    return { userId, status: "ACTIVE" };
  }
}
