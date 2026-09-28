// User-facing auth messages. Safe to import from client components.

/** The only message shown for any failed sign-in, so it never reveals which emails exist. */
export const INVALID_CREDENTIALS = "Invalid email or password";

export const EMAIL_TAKEN = "This email is already registered";

/** Auth.js refused to run (misconfiguration such as a missing AUTH_SECRET), not a bad password. */
export const SIGN_IN_UNAVAILABLE = "We couldn't sign you in right now. Please try again in a moment.";
