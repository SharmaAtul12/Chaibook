import {Router} from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import {bulkDeleteSources, createSource, deleteSource, getSource, listSources } from '../controllers/source.controller.js';

/**
 * Creates an Express Router that inherits route parameters (like workspaceId) from its parent router, 
 * allowing child routes to access req.params.workspaceId without redefining it.
 */
export const sourceRoutes = Router({mergeParams: true});


sourceRoutes.get("/", asyncHandler(listSources));
sourceRoutes.post("/", asyncHandler(createSource));
sourceRoutes.post("/bulk-delete", asyncHandler(bulkDeleteSources));
sourceRoutes.get("/:sourceId", asyncHandler(getSource));
sourceRoutes.delete("/:sourceId", asyncHandler(deleteSource));
