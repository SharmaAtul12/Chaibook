import {Router} from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import {bulkDeleteSources, createSource, deleteSource, getSource, importWebsite, importYoutube, listSources, uploadPdf } from '../controllers/source.controller.js';
import { uploadSinglePdf } from '../middlewares/upload.middleware.js';

/**
 * Creates an Express Router that inherits route parameters (like workspaceId) from its parent router, 
 * allowing child routes to access req.params.workspaceId without redefining it.
 */
export const sourceRoutes = Router({mergeParams: true});


sourceRoutes.post("/upload",uploadSinglePdf, asyncHandler(uploadPdf));
sourceRoutes.post("/import/website", asyncHandler(importWebsite));
sourceRoutes.post("/import/youtube", asyncHandler(importYoutube));

sourceRoutes.get("/", asyncHandler(listSources));
sourceRoutes.post("/", asyncHandler(createSource));
sourceRoutes.post("/bulk-delete", asyncHandler(bulkDeleteSources));
sourceRoutes.get("/:sourceId", asyncHandler(getSource));
sourceRoutes.delete("/:sourceId", asyncHandler(deleteSource));
