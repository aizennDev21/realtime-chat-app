import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, type: string, title: string, body?: string, data?: any) {
    // TODO: Create notification
    return null;
  }

  async findUserNotifications(userId: string, unreadOnly = false, cursor?: string, limit = 20) {
    // TODO: Get user notifications
    return null;
  }

  async markAsRead(userId: string, notificationIds: string[]) {
    // TODO: Mark notifications as read
    return null;
  }

  async markAllAsRead(userId: string) {
    // TODO: Mark all notifications as read
    return null;
  }

  async getUnreadCount(userId: string) {
    // TODO: Get unread notification count
    return 0;
  }
}