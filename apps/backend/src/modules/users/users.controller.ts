import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  async getProfile() {
    // TODO: Get current user profile
    return { message: 'Get profile endpoint - TODO' };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(@Body() updateProfileDto: any) {
    // TODO: Update user profile (displayName, avatar)
    return { message: 'Update profile endpoint - TODO' };
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, description: 'Password changed' })
  async changePassword(@Body() changePasswordDto: any) {
    // TODO: Change password (revoke other sessions)
    return { message: 'Change password endpoint - TODO' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get public user profile' })
  @ApiResponse({ status: 200, description: 'Public profile retrieved' })
  async getPublicProfile(@Param('id') id: string) {
    // TODO: Get public user profile (limited info)
    return { message: 'Get public profile endpoint - TODO' };
  }
}