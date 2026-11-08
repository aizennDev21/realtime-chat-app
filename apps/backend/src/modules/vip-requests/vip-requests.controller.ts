import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VipRequestsService } from './vip-requests.service';

@ApiTags('VIP Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vip-requests')
export class VipRequestsController {
  constructor(private readonly vipRequestsService: VipRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit VIP group request' })
  async submitRequest(@Body() createVipRequestDto: any) {
    // TODO: Create VIP group request
    return { message: 'Submit VIP request endpoint - TODO' };
  }

  @Get('mine')
  @ApiOperation({ summary: 'Get my VIP requests' })
  async getMyRequests() {
    // TODO: Get user's VIP requests with status
    return { message: 'Get my requests endpoint - TODO' };
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel pending VIP request' })
  async cancelRequest(@Param('id') id: string) {
    // TODO: Cancel pending VIP request
    return { message: 'Cancel request endpoint - TODO' };
  }
}