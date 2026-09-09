import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Teacher interest list.
 *
 * Every other function in this deployment requires a signed-in caller. This
 * one cannot: the people it exists for are teachers weighing LexiKey up before
 * they would ever make an account, and asking them to sign up first defeats
 * the point of asking at all.
 *
 * That makes it a public write endpoint on a URL that ships in the client
 * bundle, so the handler assumes hostile input — the address is length-capped
 * and shape-checked before anything is stored, a repeat address writes nothing
 * rather than adding a row, and a filled honeypot is dropped silently.
 *
 * None of that is a rate limit. A determined script can still insert unique
 * addresses in a loop; the guards here raise the cost of the lazy version and
 * keep the table honest. Revisit if the list ever fills with noise.
 */

/** RFC 5321 caps a forward path at 254 characters */
const MAX_EMAIL_LENGTH = 254;

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Add an address to the list. Idempotent, so a double-submit is harmless.
 */
export const join = mutation({
  args: {
    email: v.string(),
    /** Honeypot. A real person leaves this empty because they never see it. */
    website: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { email, website }) => {
    // Silently, so a bot cannot tell a rejection from a success and retry.
    if (website) return null;

    const normalised = email.trim().toLowerCase();

    if (
      normalised.length > MAX_EMAIL_LENGTH ||
      !EMAIL_SHAPE.test(normalised)
    ) {
      throw new Error("That does not look like an email address");
    }

    const existing = await ctx.db
      .query("teacherSignups")
      .withIndex("by_email", (q) => q.eq("email", normalised))
      .first();

    if (!existing) {
      await ctx.db.insert("teacherSignups", {
        email: normalised,
        createdAt: Date.now(),
      });
    }

    return null;
  },
});
