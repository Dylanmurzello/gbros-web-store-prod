// ARCHITECTURE FIX: 2025-09-30 - Form validation schemas so we don't accept garbage data 🗑️
// Using Zod for type-safe validation with proper error messages

import { z } from 'zod';

// Email validation - proper regex that actually works
const emailSchema = z.string()
  .min(1, 'Email is required')
  .email('Invalid email format - gotta be like name@example.com fr');

// Phone number validation - flexible but validates format
const phoneSchema = z.string()
  .regex(/^[\d\s\-\+\(\)]+$/, 'Phone number can only contain numbers, spaces, and - + ( )')
  .min(10, 'Phone number must be at least 10 digits')
  .optional()
  .or(z.literal(''));

// Postal code validation - flexible for international
const postalCodeSchema = z.string()
  .min(3, 'Postal code must be at least 3 characters')
  .max(10, 'Postal code too long');

// Login form validation
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string()
    .min(6, 'Password must be at least 6 characters - security matters bestie 🔒'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Checkout address validation
export const addressSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name too long'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name too long'),
  company: z.string().optional(),
  streetLine1: z.string()
    .min(5, 'Street address must be at least 5 characters - give us a real address bestie')
    .max(100, 'Address too long')
    .regex(/^[a-zA-Z0-9\s,.-]+$/, 'Street address contains invalid characters'),
  streetLine2: z.string().optional(),
  city: z.string()
    .min(2, 'City name must be at least 2 characters')
    .max(50, 'City name too long')
    .regex(/^[a-zA-Z\s.-]+$/, 'City name can only contain letters, spaces, periods, and hyphens'),
  province: z.string()
    .min(2, 'State/Province must be at least 2 characters')
    .max(50, 'State/Province too long')
    .regex(/^[a-zA-Z\s.-]+$/, 'State/Province can only contain letters, spaces, periods, and hyphens'),
  postalCode: postalCodeSchema
    .regex(/^[a-zA-Z0-9\s-]+$/, 'Postal code can only contain letters, numbers, spaces, and hyphens'),
  countryCode: z.string()
    .length(2, 'Country code must be 2 characters (e.g. US)'),
  phoneNumber: phoneSchema,
});

export type AddressFormData = z.infer<typeof addressSchema>;

// Full checkout form validation
export const checkoutSchema = z.object({
  email: emailSchema,
  ...addressSchema.shape,
  billingDifferent: z.boolean(),
  // Billing address fields (optional if billingDifferent is false)
  billingFirstName: z.string().optional(),
  billingLastName: z.string().optional(),
  billingCompany: z.string().optional(),
  billingStreetLine1: z.string().optional(),
  billingStreetLine2: z.string().optional(),
  billingCity: z.string().optional(),
  billingProvince: z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingCountryCode: z.string().optional(),
  // Payment handled by Square - no validation needed here 💳
}).superRefine((data, ctx) => {
  // If billing is different, validate those fields too
  if (data.billingDifferent) {
    if (!data.billingFirstName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Billing first name is required',
        path: ['billingFirstName'],
      });
    }
    if (!data.billingLastName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Billing last name is required',
        path: ['billingLastName'],
      });
    }
    if (!data.billingStreetLine1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Billing street address is required',
        path: ['billingStreetLine1'],
      });
    }
    if (!data.billingCity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Billing city is required',
        path: ['billingCity'],
      });
    }
    if (!data.billingPostalCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Billing postal code is required',
        path: ['billingPostalCode'],
      });
    }
    if (!data.billingCountryCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Billing country is required',
        path: ['billingCountryCode'],
      });
    }
  }
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

// Contact form validation
export const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: emailSchema,
  phoneNumber: phoneSchema,
  message: z.string()
    .min(10, 'Message must be at least 10 characters - tell us what you need!')
    .max(1000, 'Message too long - keep it under 1000 characters'),
});

export type ContactFormData = z.infer<typeof contactSchema>;

// Helper function to validate and return errors
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: boolean; 
  data?: T; 
  errors?: Record<string, string>;
} {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  // Convert Zod errors to field-level error map
  const errors: Record<string, string> = {};
  result.error.issues.forEach((err: z.ZodIssue) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  
  return { success: false, errors };
}
