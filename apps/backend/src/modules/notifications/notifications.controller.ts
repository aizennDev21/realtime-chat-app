import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  async getNotifications(@Query() query: any) {
    return { message: 'Get notifications endpoint - TODO' };
  }

  @Post('read')
  @ApiOperation({ summary: 'Mark notifications as read' })
  async markAsRead(@Body() body: any) {
    return { message: 'Mark notifications read endpoint - TODO' };
  }
}