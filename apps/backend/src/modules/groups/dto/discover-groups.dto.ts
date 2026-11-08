import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const DiscoverGroupsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  after: z.string().optional(), // for cursor-based pagination
});

export class DiscoverGroupsDto extends createZodDto(DiscoverGroupsSchema) {}
