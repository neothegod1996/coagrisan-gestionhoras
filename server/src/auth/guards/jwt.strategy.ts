import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { role } from "@prisma/client";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "src/prisma.service";

interface JwtPayload {
  sub: string;
  wp_email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload) {
    let user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
      select: {
        id: true,
        wp_id: true,
        wp_name: true,
        wp_email: true,
        role: true,
        partner_id: true,
        employee: {
          select: {
            id: true,
          },
        },
      }
    });
    if(!user) return;
    const partner = await this.prisma.user.findFirst({
      where: { partner_id: user.partner_id, role: role.manager },
      select: { id: true },
    });
    if(user && partner?.id && user?.role !== role.admin) user.partner_id = partner?.id;
    if (!user) {
      throw new HttpException(
        {
          success: false,
          message: "Unauthorized",
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    return user;
  }
}
