import { Controller, Get, Patch, Delete, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessagesService } from './messages.service';

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('groups/:groupId/messages')
  @ApiOperation({ summary: 'Get message history' })
  async getMessages(@Param('groupId') groupId: string, @Query() query: any) {
    // TODO: Get paginated message history with cursor
    return { message: 'Get messages endpoint - TODO' };
  }

  @Patch('messages/:messageId')
  @ApiOperation({ summary: 'Edit message' })
  async editMessage(@Param('messageId') messageId: string, @Body() body: any) {
    // TODO: Edit message (sender only, within edit window)
    return { message: 'Edit message endpoint - TODO' };
  }

  @Delete('messages/:messageId')
  @ApiOperation({ summary: 'Delete message' })
  async deleteMessage(@Param('messageId') messageId: string) {
    // TODO: Delete message (sender or moderator+)
    return { message: 'Delete message endpoint - TODO' };
  }

  @Post('groups/:groupId/read')
  @ApiOperation({ summary: 'Mark messages as read' })
  async markAsRead(@Param('groupId') groupId: string, @Body() body: any) {
    // TODO: Update last read message ID
    return { message: 'Mark as read endpoint - TODO' };
  }
}