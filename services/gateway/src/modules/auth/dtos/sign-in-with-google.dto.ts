import { IsNotEmpty, IsString } from "class-validator";

export class SignInWithGoogleDto {
  @IsString()
  @IsNotEmpty()
  googleToken: string;
}
