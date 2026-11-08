import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, UsePipes, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GroupsService } from './groups.service';
import { DiscoverGroupsDto } from './dto/discover-groups.dto';
import { ZodValidationPipe } from 'nestjs-zod';

@ApiTags('Groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get('discover')
  @ApiOperation({ summary: 'Discover public groups' })
  @ApiResponse({ status: 200, description: 'Public groups retrieved' })
  @UsePipes(ZodValidationPipe)
  async discoverGroups(@Query() query: DiscoverGroupsDto) {
    return this.groupsService.discoverPublicGroups(query.limit, query.after);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Get my groups' })
  @ApiResponse({ status: 200, description: 'User groups retrieved' })
  async getMyGroups(@Request() req) {
    return this.groupsService.getUserGroups(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get group details' })
  @ApiResponse({ status: 200, description: 'Group details retrieved' })
  async getGroup(@Param('id') id: string) {
    // TODO: Get group details (check member permissions)
    return { message: 'Get group endpoint - TODO' };
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join public group' })
  @ApiResponse({ status: 200, description: 'Joined group successfully' })
  async joinGroup(@Param('id') id: string, @Request() req) {
    return this.groupsService.joinPublic(id, req.user.id);
  }

  @Post('join-by-code')
  @ApiOperation({ summary: 'Join VIP group by invite code' })
  @ApiResponse({ status: 200, description: 'Joined VIP group successfully' })
  async joinByCode(@Body() body: { code: string }) {
    // TODO: Join VIP group by invite code
    return { message: 'Join by code endpoint - TODO' };
  }

  @Get('preview-by-code/:code')
  @ApiOperation({ summary: 'Preview VIP group by invite code' })
  @ApiResponse({ status: 200, description: 'Group preview retrieved' })
  async previewByCode(@Param('code') code: string) {
    // TODO: Get VIP group preview for join page
    return { message: 'Preview by code endpoint - TODO' };
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Leave group' })
  @ApiResponse({ status: 200, description: 'Left group successfully' })
  async leaveGroup(@Param('id') id: string) {
    // TODO: Leave group
    return { message: 'Leave group endpoint - TODO' };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update group (Owner/Admin only)' })
  @ApiResponse({ status: 200, description: 'Group updated successfully' })
  async updateGroup(@Param('id') id: string, @Body() updateGroupDto: any) {
    // TODO: Update group (name, description, avatar)
    return { message: 'Update group endpoint - TODO' };
  }

  @Post(':id/invite-code/regenerate')
  @ApiOperation({ summary: 'Regenerate invite code (VIP groups)' })
  @ApiResponse({ status: 200, description: 'Invite code regenerated' })
  async regenerateInviteCode(@Param('id') id: string) {
    // TODO: Regenerate invite code for VIP group
    return { message: 'Regenerate invite code endpoint - TODO' };
  }
}