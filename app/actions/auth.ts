"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn, signOut } from "@/auth";
import { findRoleUser } from "@/lib/auth/credentials";
import { INVALID_CREDENTIALS, SIGN_IN_UNAVAILABLE } from "@/lib/auth/messages";
import { registerCustomer, registerVendor } from "@/lib/auth/register";
import { loginPathForRole, safeCallbackUrl } from "@/lib/auth/roles";
import {
  customerRegisterInputFromForm,
  firstFieldErrors,
  loginInputFromForm,
  loginSchema,
  vendorRegisterInputFromForm,
  type CustomerRegisterField,
  type FormState,
  type LoginField,
  type VendorRegisterField,
} from "@/lib/validation/auth";

const SIGN_IN_AFTER_REGISTER_FAILED = "Your account was created, but we couldn't sign you in. Please sign in.";

/**
 * Shared by /login, /vendor/login and /admin/login: one auth flow for every role. After a
 * successful sign-in the user goes to the (sanitised) callbackUrl if it is inside their own
 * area, otherwise to their role home — so signing in on the "wrong" page is fine.
 */
export async function loginAction(_prev: FormState<LoginField>, formData: FormData): Promise<FormState<LoginField>> {
  const input = loginInputFromForm(formData);
  const values = { email: input.email };

  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: firstFieldErrors(parsed.error), values };
  const { email, password } = parsed.data;

  let signInUrl: unknown;
  try {
    signInUrl = await signIn("credentials", { email, password, redirect: false, redirectTo: "/" });
  } catch (err) {
    // CredentialsSignin (any failed authorize) and other auth failures: one generic message.
    if (err instanceof AuthError) return { formError: INVALID_CREDENTIALS, values };
    throw err;
  }
  // Configuration problems (UntrustedHost, MissingSecret, ...) are not thrown: Auth.js answers
  // with its error page instead and sets no session cookie. Don't treat that as a sign-in.
  if (isAuthErrorUrl(signInUrl)) {
    console.error("[auth] sign-in did not complete; Auth.js returned", String(signInUrl));
    return { formError: SIGN_IN_UNAVAILABLE, values };
  }

  const user = await findRoleUser(email);
  if (!user) return { formError: INVALID_CREDENTIALS, values };
  redirect(safeCallbackUrl(formData.get("callbackUrl"), user));
}

/**
 * Clears the session and returns the user to their own role's login page
 * (/login, /vendor/login or /admin/login). signOut() redirects by throwing; not caught.
 */
export async function signOutAction(): Promise<void> {
  const session = await auth();
  const role = session?.user?.role;
  await signOut({ redirectTo: role ? loginPathForRole(role) : "/login" });
}

/** True when signIn() came back with an Auth.js error/API URL instead of the requested redirect. */
function isAuthErrorUrl(value: unknown): boolean {
  try {
    const url = new URL(String(value), "http://covet.invalid");
    return url.searchParams.has("error") || url.pathname.startsWith("/api/auth");
  } catch {
    return true;
  }
}

/**
 * signIn() ends a successful sign-in by throwing Next's redirect. Only AuthError is handled
 * here; everything else, the redirect included, is rethrown so Next can act on it.
 */
async function signInAfterRegister(email: string, password: string, redirectTo: string): Promise<string | undefined> {
  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (err) {
    if (err instanceof AuthError) return SIGN_IN_AFTER_REGISTER_FAILED;
    throw err;
  }
}

export async function registerCustomerAction(
  _prev: FormState<CustomerRegisterField>,
  formData: FormData,
): Promise<FormState<CustomerRegisterField>> {
  const input = customerRegisterInputFromForm(formData);
  const values = { name: input.name, email: input.email, acceptTerms: input.acceptTerms ? "on" : "" };

  const result = await registerCustomer(input);
  if (!result.ok) return { fieldErrors: result.fieldErrors, values };

  const formError = await signInAfterRegister(result.email, input.password, "/dashboard");
  return { formError, values };
}

export async function registerVendorAction(
  _prev: FormState<VendorRegisterField>,
  formData: FormData,
): Promise<FormState<VendorRegisterField>> {
  const input = vendorRegisterInputFromForm(formData);
  const values = { name: input.name, storeName: input.storeName, email: input.email };

  const result = await registerVendor(input);
  if (!result.ok) return { fieldErrors: result.fieldErrors, values };

  const formError = await signInAfterRegister(result.email, input.password, "/vendor/pending");
  return { formError, values };
}
