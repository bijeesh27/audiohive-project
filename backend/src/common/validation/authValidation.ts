import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[!@#$%^&*(),.?":{}|<>]/,
    "Password must contain at least one special character",
  );

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters"),

  email: z.string().trim().email("Invalid email address"),

  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),

  password: z.string().min(1, "Password is required"),
});

export const otpSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
  purpose: z.enum(["register", "forget"]),
});

export const forgetPasswordSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Current password is required"),
  password: passwordSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: passwordSchema,
});

export const registerWorkspaceSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name must not exceed 100 characters"),

  workspaceAdminName: z
    .string()
    .trim()
    .min(2, "Admin name must be at least 2 characters")
    .max(50, "Admin name must not exceed 50 characters"),

  workspaceAdminEmail: z
    .string()
    .trim()
    .email("Please enter a valid email address"),

  workspaceSlug: z
    .string()
    .trim()
    .min(3, "Workspace slug must be at least 3 characters")
    .max(50, "Workspace slug must not exceed 50 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Workspace slug can contain only lowercase letters, numbers, and hyphens"
    ),
  planId: z.string().min(1, "Plan ID is required"),
  status: z.string().optional(),
  amountPaid: z.number().optional(),
});

export const registerAdminSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters"),

  password: passwordSchema,
  
  token: z.string().min(1, "Token is required"),
});