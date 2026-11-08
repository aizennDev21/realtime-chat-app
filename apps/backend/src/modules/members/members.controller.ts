import { Controller, Get, Patch, Delete, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MembersService } from './members.service';

@ApiTags('Members')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups/:groupId/members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  @ApiOperation({ summary: 'Get group members' })
  async getMembers(@Param('groupId') groupId: string, @Query() query: any) {
    return { message: 'Get members endpoint - TODO' };
  }

  @Patch(':userId')
  @ApiOperation({ summary: 'Update member role' })
  async updateMember(@Param('groupId') groupId: string, @Param('userId') userId: string, @Body() body: any) {
    return { message: 'Update member endpoint - TODO' };
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Kick member' })
  async kickMember(@Param('groupId') groupId: string, @Param('userId') userId: string) {
    return { message: 'Kick member endpoint - TODO' };
  }

  @Post(':userId/ban')
  @ApiOperation({ summary: 'Ban member' })
  async banMember(@Param('groupId') groupId: string, @Param('userId') userId: string, @Body() body: any) {
    return { message: 'Ban member endpoint - TODO' };
  }
}