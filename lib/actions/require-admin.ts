// ADMIN check for server actions. Unlike requireRole() (pages), it never redirects: an action
// answers with a result the client can show. Uses getVerifiedSession(), which re-reads the
// user from the DB (01-auth decisions), so a deleted or re-roled admin is refused at once.

import { getVerifiedSession, type SessionUser } from "@/lib/auth/guards";
import { fail, UNAUTHORIZED, type ActionFailure } from "@/lib/actions/result";

export type AdminCheck = { ok: true; user: SessionUser } | { ok: false; result: ActionFailure };

export async function requireAdminAction(): Promise<AdminCheck> {
  const session = await getVerifiedSession();
  if (session.state !== "ok" || session.user.role !== "ADMIN") return { ok: false, result: fail(UNAUTHORIZED) };
  return { ok: true, user: session.user };
}
