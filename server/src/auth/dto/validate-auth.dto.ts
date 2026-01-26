import {
  IsNotEmpty,
  IsString,
} from "class-validator";

export class ValidateAuthDto {
  @IsNotEmpty()
  @IsString()
  wp_token: string;
}
