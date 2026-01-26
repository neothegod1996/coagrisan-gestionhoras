import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "./roles.decorator";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      throw new HttpException(
        {
          success: false,
          message: "No se encontraron roles requeridos",
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new HttpException(
        {
          success: false,
          message: "Debes estar autenticado",
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      const hasRequiredRole = requiredRoles.some((role) => payload.role === role);
      if (!hasRequiredRole) {
        throw new HttpException(
          {
            success: false,
            message: "No tienes permisos para esta acción",
          },
          HttpStatus.UNAUTHORIZED,
        );
      }
      return hasRequiredRole;
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error?.message || "Token inválido o expirado",
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
