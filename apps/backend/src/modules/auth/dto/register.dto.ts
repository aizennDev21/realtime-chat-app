import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const RegisterSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  username: z.string()
    .min(3, 'Username minimal 3 karakter')
    .max(20, 'Username maksimal 20 karakter')
    .regex(/^[a-z0-9_]+$/, 'Username hanya boleh berisi huruf kecil, angka, dan underscore'),
  password: z.string()
    .min(8, 'Password minimal 8 karakter'),
  display_name: z.string()
    .min(1, 'Nama tampilan wajib diisi')
    .max(40, 'Nama tampilan maksimal 40 karakter'),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}
