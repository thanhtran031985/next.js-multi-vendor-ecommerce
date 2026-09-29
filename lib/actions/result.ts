// Result type of admin server actions (task 03). Shared with client components (types and
// plain helpers only). Actions never throw raw errors to the client: expected failures come
// back as { success: false }, unexpected ones are logged on the server and reported with a
// generic message.

import { z } from "zod";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export type ActionFailure = Extract<ActionResult<never>, { success: false }>;

export const UNAUTHORIZED = "Unauthorized";
export const INVALID_INPUT = "Please check the highlighted fields";
export const UNEXPECTED_ERROR = "Something went wrong. Please try again.";

export function ok<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function fail(error: string, fieldErrors?: Record<string, string[]>): ActionFailure {
  return fieldErrors ? { success: false, error, fieldErrors } : { success: false, error };
}

/** A failed Zod parse as an action result: every message per field. */
export function invalidInput(error: z.ZodError): ActionFailure {
  return fail(INVALID_INPUT, z.flattenError(error).fieldErrors as Record<string, string[]>);
}

/** Logs an unexpected error with its context and returns the generic failure. */
export function unexpected(context: string, err: unknown): ActionFailure {
  console.error(`[${context}]`, err);
  return fail(UNEXPECTED_ERROR);
}
