import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { getVerifiedSession } from "@/lib/auth/guards";
import { getRoleHome, loginPathForRole } from "@/lib/auth/roles";

/**
 * Ends a session whose token no longer matches the DB (user deleted or role changed) and
 * sends the user to the login page of the area they were in.
 *
 * Only a genuinely stale session is signed out: a valid one is just sent home, so a link
 * to this URL from another site cannot log anyone out.
 */
export async function GET() {
  const session = await getVerifiedSession();
  if (session.state === "ok") redirect(getRoleHome(session.user));
  if (session.state === "signed-out") redirect("/login");
  await signOut({ redirectTo: loginPathForRole(session.tokenRole) });
}
