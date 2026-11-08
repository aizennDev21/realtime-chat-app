import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadsService } from './uploads.service';

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('presign')
  @ApiOperation({ summary: 'Get presigned upload URL' })
  async presignUpload(@Body() body: any) {
    // TODO: Generate presigned upload URL for S3/MinIO
    return { message: 'Presign upload endpoint - TODO' };
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete file upload' })
  async completeUpload(@Param('id') id: string) {
    // TODO: Verify and complete file upload
    return { message: 'Complete upload endpoint - TODO' };
  }
}