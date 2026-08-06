import { z } from "zod";

export const CHAT_MODELS = ["gpt-4o-mini", "gpt-4o"] as const;

/**
 * createWorkspaceSchema defines all validation rules for creating a workspace.
 */

export const createWorkspaceSchema = z.object({
    title: z.string().trim().min(1, "Title is required").max(120),
    description: z.string().trim().max(500).optional(),
    icon: z.string().trim().max(8).optional(),
    defaultModel: z.enum(CHAT_MODELS).optional(),
});

/**
 * updateWorkspaceSchema uses .partial() to make every field optional and 
 * .refine() to ensure at least one field is provided during updates.
 */


export const updateWorkspaceSchema = createWorkspaceSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one field is required" },
);

/**
 * z.infer automatically generates TypeScript types from the Zod schemas, keeping validation and types synchronized.
 */

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;

/**
 * workspaceIdParamSchema validates route parameters like workspaceId before they're used in the application.
 */

export const workspaceIdParamSchema = z.object({
    workspaceId: z.string().trim().min(1),
});