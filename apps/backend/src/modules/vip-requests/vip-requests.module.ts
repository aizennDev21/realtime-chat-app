import { Module } from '@nestjs/common';
import { VipRequestsController } from './vip-requests.controller';
import { VipRequestsService } from './vip-requests.service';

@Module({
  controllers: [VipRequestsController],
  providers: [VipRequestsService],
  exports: [VipRequestsService],
})
export class VipRequestsModule {}