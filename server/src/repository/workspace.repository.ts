import prisma from "../lib/db.js";
import type {
    CreateWorkspaceInput,
    UpdateWorkspaceInput,
} from "../validators/workspace.validator.js";

/**
 * workspaceSelect defines the fields returned by every query, avoiding repetition and ensuring consistent responses.
 * So hame .select mm bar bar ye sabhi chize likhne ki zarurat nahi hai.we will simply use workspaceSelect in every query to get the same fields.
 */

export const workspaceSelect = {
    id: true,
    title: true,
    description: true,
    icon: true,
    defaultModel: true,
    createdAt: true,
    updatedAt: true,
} as const;

/**
 * WorkspaceRecord defines the TypeScript type for a workspace record (row) . 
 * because we have to tell strictly ki workspace record me kya kya fields honge aur unka type kya hoga.
 */

export type WorkspaceRecord = {
    id: string;
    title: string;
    description: string | null;
    icon: string | null;
    defaultModel: string;
    createdAt: Date;
    updatedAt: Date;
};

export function findWorkspacesByUserId(userId: string) {
    return prisma.workspace.findMany({
        where: { userId },
        select: workspaceSelect,
        orderBy: { updatedAt: "desc" },
    });
}

export function findWorkspaceByIdAndUserId(
    workspaceId: string,
    userId: string,
) {
    return prisma.workspace.findFirst({
        where: { id: workspaceId, userId },
        select: workspaceSelect,
    });
}

export function createWorkspaceRecord(
    userId: string,
    data: CreateWorkspaceInput,
) {
    return prisma.workspace.create({
        data: {
            userId,
            ...data,
        },
        select: workspaceSelect,
    });
}

export function updateWorkspaceRecord(
    workspaceId: string,
    data: UpdateWorkspaceInput,
) {
    return prisma.workspace.update({
        where: { id: workspaceId },
        data,
        select: workspaceSelect,
    });
}

export async function deleteWorkspaceRecord(workspaceId: string) {
    await prisma.workspace.delete({
        where: { id: workspaceId },
    });
}