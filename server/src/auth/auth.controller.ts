import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  UseGuards,
  Req,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Response } from "express";
import { ValidateAuthDto } from "./dto/validate-auth.dto";
import { JwtAuthGuard } from "./guards/jwt.guard";
import { RequestWithUser } from "src/types";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("validate")
  async validate(
    @Res() res: Response,
    @Body() body: ValidateAuthDto,
  ) {
    const user = await this.authService.validate(body);
    return res.status(201).json({
      success: true,
      data: user,
      message: "Usuario validado con éxito",
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  async profile(
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ) { 
    const user = await this.authService.profile(req.user);
    return res.status(200).json({
      data: user,
      success: true,
      message: "Profile obtained successfully",
    });
  }
}
