import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import type { Session } from "../lib/session.js";

/**
 * I'm going to add more types to an existing module.This is called "module augmentation" in TypeScript. 
 * It allows you to extend the types of an existing module without modifying the original module's code.
 * express-serve-static-core : Is the package where express defined the Request interface. By declaring a module with the same name, 
 * we can add our own properties to the Request interface. This reopens the existing Request interface.
 */

declare module "express-serve-static-core" {
    interface Request {
        session: Session;
    }
}

export async function requireAuth(req: Request, res: Response,next: NextFunction,): Promise<void> {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    req.session = session;
    next();
}