import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // TODO: Add AdminGuard
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboardStats() {
    return { message: 'Admin stats endpoint - TODO' };
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  async getUsers(@Query() query: any) {
    return { message: 'Admin get users endpoint - TODO' };
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user (suspend/role change)' })
  async updateUser(@Param('id') id: string, @Body() body: any) {
    return { message: 'Admin update user endpoint - TODO' };
  }

  @Get('groups')
  @ApiOperation({ summary: 'Get all groups' })
  async getGroups(@Query() query: any) {
    return { message: 'Admin get groups endpoint - TODO' };
  }

  @Post('groups')
  @ApiOperation({ summary: 'Create group' })
  async createGroup(@Body() body: any) {
    return { message: 'Admin create group endpoint - TODO' };
  }

  @Get('vip-requests')
  @ApiOperation({ summary: 'Get VIP requests for review' })
  async getVipRequests(@Query() query: any) {
    return { message: 'Admin get VIP requests endpoint - TODO' };
  }

  @Post('vip-requests/:id/approve')
  @ApiOperation({ summary: 'Approve VIP request' })
  async approveVipRequest(@Param('id') id: string, @Body() body: any) {
    return { message: 'Admin approve VIP request endpoint - TODO' };
  }

  @Post('vip-requests/:id/reject')
  @ApiOperation({ summary: 'Reject VIP request' })
  async rejectVipRequest(@Param('id') id: string, @Body() body: any) {
    return { message: 'Admin reject VIP request endpoint - TODO' };
  }
}