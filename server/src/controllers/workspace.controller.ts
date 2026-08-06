import type { Request, Response } from "express";
import {
    createWorkspaceForUser,
    deleteWorkspaceForUser,
    getWorkspaceByIdForUser,
    listWorkspacesByUser,
    updateWorkspaceForUser,
} from "../services/workspace.services.js";
import { ValidationError } from "../types/app-error.js";
import { getZodFieldErrors } from "../utils/zod-error.js";
import {
    createWorkspaceSchema,
    updateWorkspaceSchema,
    workspaceIdParamSchema,
} from "../validators/workspace.validator.js";


/**
 * Validates req.params using workspaceIdParamSchema to ensure the workspaceId is valid.
 *  Returns the validated workspaceId or throws a ValidationError if validation fails.
 */

function parseWorkspaceId(params: Request["params"]) {
    const parsed = workspaceIdParamSchema.safeParse(params);

    if (!parsed.success) {
        throw new ValidationError(
            "Invalid workspace id",
            getZodFieldErrors(parsed.error),
        );
    }

    return parsed.data;
}

/**
 * Validates the request body using createWorkspaceSchema before creating a workspace.
 *  Returns the validated input or throws a ValidationError if the body is invalid.
 */

function parseCreateBody(body: unknown) {
    const parsed = createWorkspaceSchema.safeParse(body);

    if (!parsed.success) {
        throw new ValidationError(
            "Validation failed",
            getZodFieldErrors(parsed.error),
        );
    }

    return parsed.data;
}

/**
 * Validates the request body using updateWorkspaceSchema for workspace updates.
 * Returns the validated update data or throws a ValidationError if validation fails.
 */

function parseUpdateBody(body: unknown) {
    const parsed = updateWorkspaceSchema.safeParse(body);

    if (!parsed.success) {
        throw new ValidationError(
            "Validation failed",
            getZodFieldErrors(parsed.error),
        );
    }

    return parsed.data;
}

/**
 * Retrieves all workspaces belonging to the authenticated user by calling the service layer.
 * Sends the list of workspaces as a JSON response (200 OK).
 */

export async function listWorkspaces(req: Request, res: Response) {
    const workspaces = await listWorkspacesByUser(req.session.user.id);
    res.json(workspaces);
}

/**
 * Validates the workspaceId, then fetches the corresponding workspace for the authenticated user.
 * Returns the workspace as JSON or lets the service throw a NotFoundError if it doesn't exist.
 */

export async function getWorkspace(req: Request, res: Response) {
    const { workspaceId } = parseWorkspaceId(req.params);
    const workspace = await getWorkspaceByIdForUser(
        workspaceId,
        req.session.user.id,
    );
    res.json(workspace);
}

/**
 * Validates the request body and creates a new workspace for the authenticated user.
 * Returns the created workspace with HTTP 201 (Created).
 */

export async function createWorkspace(req: Request, res: Response) {
    const input = parseCreateBody(req.body);
    const workspace = await createWorkspaceForUser(
        req.session.user.id,
        input,
    );
    res.status(201).json(workspace);
}

/**
 * Validates the request body and updates an existing workspace for the authenticated user.
 * Returns the updated workspace as JSON or lets the service throw a NotFoundError if it doesn't exist.
 */

export async function updateWorkspace(req: Request, res: Response) {
    const { workspaceId } = parseWorkspaceId(req.params);
    const input = parseUpdateBody(req.body);
    const workspace = await updateWorkspaceForUser(
        workspaceId,
        req.session.user.id,
        input,
    );
    res.json(workspace);
}

/**
 * Validates the workspaceId and deletes the corresponding workspace for the authenticated user.
 * Returns HTTP 204 (No Content) to indicate successful deletion without a response body.
 */

export async function deleteWorkspace(req: Request, res: Response) {
    const { workspaceId } = parseWorkspaceId(req.params);
    await deleteWorkspaceForUser(workspaceId, req.session.user.id);
    res.status(204).send();
}