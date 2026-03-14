import { z } from 'zod';

const algerianPhoneRegex = /^(05|06|07)\d{8}$/;

export const registerSchema = z.object({
  full_name: z.string().min(2, 'الاسم يجب أن يحتوي على الأقل على حرفين').max(100),
  phone_number: z.string().regex(algerianPhoneRegex, 'رقم هاتف غير صالح (مثال: 0555123456)'),
  wilaya: z.string().optional(),
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z
    .string()
    .min(8, 'كلمة المرور: 8 أحرف على الأقل')
    .regex(/[A-Z]/, 'يجب أن تحتوي على الأقل حرف كبير')
    .regex(/[0-9]/, 'يجب أن تحتوي على الأقل رقم')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'يجب أن تحتوي على الأقل رمز خاص'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirm_password'],
});

export const loginSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().min(1, 'يرجى إدخال كلمة المرور'),
});

export type RegisterForm = z.infer<typeof registerSchema>;
export type LoginForm = z.infer<typeof loginSchema>;
