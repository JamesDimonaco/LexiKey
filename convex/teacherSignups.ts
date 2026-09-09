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
 * A coarse global write cap bounds the damage a script can do in one burst.
 * It is not per-caller — Convex mutations do not see an IP — so it is a
 * ceiling on the table, not fairness between callers. Set well above any
 * plausible burst of real teachers.
 */

/** RFC 5321 caps a forward path at 254 characters */
const MAX_EMAIL_LENGTH = 254;

/** Ceiling on new rows per window. Launch day will not come close. */
const MAX_SIGNUPS_PER_WINDOW = 20;
const WINDOW_MS = 60_000;

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Add an address to the list. Idempotent, so a double-submit is harmless.
 *
 * Returns whether the address was accepted. A tripped honeypot returns false
 * rather than throwing, so a bot cannot tell rejection from success from the
 * UI — but the caller can avoid counting it as a signup.
 */
export const join = mutation({
  args: {
    email: v.string(),
    /** Honeypot. A real person leaves this empty because they never see it. */
    website: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, { email, website }) => {
    // Silently, so a bot cannot tell a rejection from a success and retry.
    if (website) return false;

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

    // A repeat address is a success for the person and not a new row.
    if (existing) return true;

    const recent = await ctx.db
      .query("teacherSignups")
      .withIndex("by_createdAt", (q) => q.gt("createdAt", Date.now() - WINDOW_MS))
      .take(MAX_SIGNUPS_PER_WINDOW);

    if (recent.length >= MAX_SIGNUPS_PER_WINDOW) {
      throw new Error("Too many signups just now — try again in a minute");
    }

    await ctx.db.insert("teacherSignups", {
      email: normalised,
      createdAt: Date.now(),
    });

    return true;
  },
});
