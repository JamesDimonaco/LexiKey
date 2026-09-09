import { QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Caller checks for Convex functions.
 *
 * Convex `query` and `mutation` are callable by anyone who knows the
 * deployment URL, and that URL ships in the client bundle. A `userId` argument
 * is therefore a request, not a fact — without one of these checks, any
 * visitor can read or modify any account's data by passing someone else's id.
 *
 * Anonymous practice never reaches Convex (it lives in localStorage), so every
 * function that touches a user's data can safely require a signed-in caller.
 *
 * One function deliberately does not: teacherSignups.join takes an address
 * from a visitor with no account. It validates its own input instead — see the
 * note there.
 */

/** Assert the caller is signed in as `clerkId` */
export async function requireClerkId(
  ctx: QueryCtx | MutationCtx,
  clerkId: string,
): Promise<void> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  if (identity.subject !== clerkId) {
    throw new Error("Not authorised for this account");
  }
}

/** Assert the caller owns `userId`, and return that user */
export async function requireUser(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const user = await ctx.db.get(userId);
  if (!user || user.clerkId !== identity.subject) {
    throw new Error("Not authorised for this account");
  }

  return user;
}
