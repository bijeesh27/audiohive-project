import { z } from "zod";
export const createOrganizationSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  slug: z.string().min(3, "Slug is required"),
  ownerName: z.string().min(2, "Owner name is required"),
  ownerEmail: z.string().email("Invalid email"),
});

export const updateOrganizationSchema = z.object({
  companyName: z.string().min(2, "Company name is required").optional(),
  slug: z.string().min(3, "Slug is required").optional(),
});

export const createWorkspaceSchema = z.object({
  workspaceName: z.string().trim().min(2, "Workspace name is required").max(100, "Workspace name cannot exceed 100 characters"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Slug must be at least 3 characters")
    .max(63, "Slug cannot exceed 63 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can contain only lowercase letters, numbers, and hyphens without leading or trailing hyphens"),
  description: z.string().max(500).optional(),
  workspaceAdminEmail: z.string().trim().email("Invalid admin email").optional().or(z.literal("")),
});

export const updateWorkspaceSchema = z.object({
  workspaceName: z.string().trim().min(2, "Workspace name is required").max(100).optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Slug must be at least 3 characters")
    .max(63, "Slug cannot exceed 63 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  status: z.enum(["active", "suspended", "archived"]).optional(),
  description: z.string().max(500).optional(),
  workspaceAdminEmail: z.string().trim().email("Invalid admin email").optional().or(z.literal("")),
});

export const createSubscriptionSchema = z.object({
  subscriptionName: z.string().min(2, "Subscription name is required"),
  price: z.number().min(0, "Price is required"),
  description: z.string().min(10, "Description is required"),
  maxWorkspaces: z.number().min(1, "Max workspaces is required"),
  features: z.array(z.string()).min(1, "Add at least one feature"),
  isActive: z.boolean().optional(),
});

export const updateSubscriptionSchema = z.object({
  data: z.object({
    subscriptionName: z.string().min(2, "Subscription name is required").optional(),
    price: z.number().min(0, "Price is required").optional(),
    description: z.string().min(10, "Description is required").optional(),
    maxWorkspaces: z.number().min(1, "Max workspaces is required").optional(),
    features: z.array(z.string()).min(1, "Add at least one feature").optional(),
    isActive: z.boolean().optional(),
  }),
  subscriptionId: z.string().min(1, "Subscription ID is required")
});

export const inviteWorkspaceAdminSchema = z.object({
  workspaceAdminName: z.string().min(2, "Admin name is required"),
  email: z.string().email("Invalid email"),
});

export const setUserWorkspacesSchema = z.object({
  workspaceIds: z.array(z.string().min(1, "Workspace ID is required")).min(1, "Select at least one workspace"),
});

export const analyticsQuerySchema = z.object({
  range: z.enum(["today", "7d", "30d", "custom"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});
