import { flattenError, type ZodError } from "zod";


/**
 *  ZodError is the error object produced when Zod validation fails.
 *   flattenError() converts the complex ZodError into a simpler structure containing formErrors and fieldErrors.
 *    .fieldErrors extracts only field-specific validation messages (e.g., email, password).
 *    getZodFieldErrors() is a helper function that returns these field errors in a frontend-friendly format.
 */

export function getZodFieldErrors(error: ZodError) {
    return flattenError(error).fieldErrors;
}