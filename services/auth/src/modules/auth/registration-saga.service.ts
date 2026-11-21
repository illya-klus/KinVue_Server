import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { AuthIdentityRepository } from "./auth-identity.repository.js";
import { PasswordHasherService } from "./password-hasher.service.js";
import type { RegistrationInput } from "./registration-input.js";
import { UsersProfileClient } from "./users-profile.client.js";

@Injectable()
export class RegistrationSagaService {
  public constructor(
    private readonly identities: AuthIdentityRepository,
    private readonly passwordHasher: PasswordHasherService,
    private readonly users: UsersProfileClient,
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
    await this.users.createProfile({
      userId,
      username: input.username,
      displayName: input.displayName,
    });
    await this.identities.transitionStatus(
      userId,
      "PROFILE_CREATING",
      "ACTIVE",
    );

    return { userId, status: "ACTIVE" };
  }
}
