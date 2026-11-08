import { Injectable, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import * as argon2 from 'argon2';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, username, password, display_name } = registerDto;

    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existingUser) {
      throw new ConflictException('Email atau username sudah terdaftar');
    }

    const passwordHash = await argon2.hash(password);

    return this.prisma.user.create({
      data: {
        email,
        username,
        displayName: display_name,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && (await argon2.verify(user.passwordHash, password))) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any, res: any) {
    const tokens = await this.generateTokens(user);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/auth/refresh',
      maxAge: parseInt(this.configService.get('REFRESH_TTL_DAYS') || '30') * 24 * 60 * 60 * 1000,
    });

    return { accessToken: tokens.accessToken };
  }

  async refreshToken(refreshToken: string): Promise<any> {
    // TODO: Implement token refresh with rotation
    return null;
  }

  async logout(userId: string, refreshToken?: string, res?: any) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash: refreshToken },
        data: { revokedAt: new Date() },
      });
    }
    res?.clearCookie('refreshToken', { path: '/auth/refresh' });
  }

  private async generateTokens(user: any) {
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: `${this.configService.get('JWT_ACCESS_TTL_SECONDS')}s`,
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: `${this.configService.get('REFRESH_TTL_DAYS')}d`,
    });
    return { accessToken, refreshToken };
  }
}
