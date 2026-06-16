import { Controller, Post, Body, UseGuards, Get, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Successful login', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Req() req: any, @Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    // req.user is set by LocalStrategy
    return this.authService.login(req.user);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered', type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request (e.g. email already exists)' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'New token generated', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user (invalidate refresh token)' })
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  async logout(@CurrentUser('id') userId: string) {
    await this.authService.logout(userId);
    return { success: true, message: 'Logged out successfully' };
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current logged in user details' })
  @ApiResponse({ status: 200, description: 'User details' })
  getProfile(@CurrentUser() user: User) {
    const { passwordHash, ...result } = user;
    return result;
  }
}
