// src/auth/auth.service.ts
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { PrismaClient, role } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { WpPayload } from 'src/types/auth';
import { ValidateAuthDto } from './dto/validate-auth.dto';
import { User } from 'src/types';

const prisma = new PrismaClient();

const WpRoles = {
  'superadmin': role.admin,
  'administrator': role.manager,
  'gestor': role.manager,
  'socio': role.manager,
  'trabajador': role.employee,
  'subscriber': role.employee
}

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) { }

  async validate(body: ValidateAuthDto) {
    const wp_token = body.wp_token;

    let payload: WpPayload;
    try {
      payload = jwt.verify(wp_token, process.env.WP_JWT_SECRET as string) as WpPayload; // Verify wp token
      if (!payload) throw new HttpException('WP token inválido o expirado', HttpStatus.UNAUTHORIZED);
    } catch (e) {
      throw new HttpException('WP token inválido o expirado', HttpStatus.UNAUTHORIZED);
    }

    const wp_id = payload?.id;
    const email = payload?.email;
    const name = payload?.name;

    if (!wp_id) {
      throw new HttpException('WP token: no se encontró user id', HttpStatus.UNAUTHORIZED);
    }
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { wp_id: wp_id },
          { wp_email: email }
        ]
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          wp_id: Number(wp_id),
          wp_email: email,
          wp_name: name,
          role: WpRoles[payload?.role],
          partner_id: WpRoles[payload?.role] === role.admin ? null : payload?.partner_id,
        },
      });

      if ([role.employee, role.manager].includes(WpRoles[payload?.role])) {
        const partner = await prisma.user.findFirst({
          where: { partner_id: payload?.partner_id, role: role.manager },
          select: { id: true }
        });
        if (!partner) {
          throw new HttpException('WP token: no se encontró partner', HttpStatus.UNAUTHORIZED);
        }
        await prisma.employee.create({
          data: {
            user_id: user.id,
            first_name: name,
            email,
            partner_id: partner.id,
          },
        });
      }
    } else {
      const updateUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          wp_email: email ?? user.wp_email,
          wp_name: name ?? user.wp_name,
          role: WpRoles[payload?.role],
          partner_id: WpRoles[payload?.role] === role.admin ? null : payload?.partner_id,
        },
        select: { id: true, role: true, employee: { select: { id: true }}}
      });
      if ([role.employee, role.manager].includes(user.role as any) && !updateUser?.employee?.id) {
        const partner = await prisma.user.findFirst({
          where: { partner_id: payload?.partner_id, role: role.manager },
          select: { id: true }
        });
        if (!partner) {
          throw new HttpException('WP token: no se encontró partner', HttpStatus.UNAUTHORIZED);
        }
        await prisma.employee.create({
          data: {
            user_id: updateUser.id,
            first_name: name.split(' ')[0],
            last_name: name.split(' ').slice(1).join(' '),
            email: email ?? user.wp_email,
            alias: name.toUpperCase(),
            partner_id: partner.id,
          },
        });
      }
    }

    const access_token = this.jwtService.sign(
      { sub: user.id, role: user.role, wp_id: user.wp_id, partner_id: user.partner_id },
      { secret: process.env.JWT_SECRET, expiresIn: '30d' }
    );

    return {
      ...user,
      access_token,
    };
  }

  async profile(user: User) {
    const { partner_id, ...rest } = user;
    let response: any = {
      ...rest,
    }
    if(partner_id) {
      const partner = await prisma.user.findFirst({
        where: { OR: [{ partner_id: partner_id }, { id: partner_id }], role: role.manager },
        select: { id: true }
      });
      if(partner) response.partner_id = partner.id;
    };
    return response;
  }
}