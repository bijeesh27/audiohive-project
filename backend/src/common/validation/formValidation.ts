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
  workspaceName: z.string().min(2, "Workspace name is required"),
  slug: z.string().min(3, "Slug is required"),
});

export const updateWorkspaceSchema = z.object({
  workspaceName: z.string().min(2, "Workspace name is required").optional(),
  slug: z.string().min(3, "Slug is required").optional(),
  status: z.enum(["active", "suspended", "archived"]).optional(),
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
