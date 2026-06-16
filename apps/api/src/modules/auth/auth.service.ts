import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { HashUtil } from '../../common/utils/hash.util';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { User } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && user.status === 'ACTIVE' && await HashUtil.compare(pass, user.passwordHash)) {
      return user;
    }
    return null;
  }

  async login(user: User): Promise<AuthResponseDto> {
    const payload = { email: user.email, sub: user.id, role: user.role };
    
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.generateRefreshToken();
    const expiresIn = parseInt(this.configService.get<string>('JWT_EXPIRES_IN_SEC') || '900', 10);

    // Save refresh token to user
    await this.prisma.refreshToken.create({
      data: { 
        token: await HashUtil.hash(refreshToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    const hashedPassword = await HashUtil.hash(registerDto.password);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        passwordHash: hashedPassword,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: registerDto.phone,
        role: registerDto.role,
      },
    });

    return this.login(user);
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    // In a real scenario, the token might contain user id, or we look it up.
    // For simplicity, we can do a reverse lookup if the token is completely random,
    // but we stored a hashed token. Let's assume the client sends user ID or the token is a JWT.
    // Better approach: make refresh token a long-lived JWT containing the user ID.
    throw new BadRequestException('Refresh token strategy needs user context or JWT implementation');
    // Implementation to be completed based on specific refresh token strategy chosen.
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  private generateRefreshToken(): string {
    return randomBytes(40).toString('hex');
  }
}
