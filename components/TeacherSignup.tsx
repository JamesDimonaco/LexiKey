"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { trackEvent } from "@/hooks/usePostHog";

type Props = {
  /** Which page the address came from, so the two can be compared */
  source: string;
};

/**
 * Email capture for teachers evaluating LexiKey.
 *
 * Nothing else on the site can reach a visitor after they leave, and a teacher
 * trying the free tier out on one student is not going to create a learner
 * account. This is the only way that person stays contactable.
 */
export function TeacherSignup({ source }: Props) {
  const join = useMutation(api.teacherSignups.join);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );
  // Bots fill every field they find. A human never sees this one.
  const [trap, setTrap] = useState("");
  const statusRef = useRef<HTMLParagraphElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;

    setStatus("sending");
    try {
      await join({ email, website: trap });
      setStatus("done");
      trackEvent("teacher_signup_completed", { source });
      // The form unmounts on success, so focus would otherwise fall to <body>
      // and a screen reader would announce nothing at all.
      requestAnimationFrame(() => statusRef.current?.focus());
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p
        ref={statusRef}
        tabIndex={-1}
        role="status"
        className="text-green-800 dark:text-green-300 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
      >
        Thanks — you&apos;re on the list. You&apos;ll hear from me when the
        classroom version is ready to try, and not otherwise.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label
        htmlFor="teacher-email"
        className="text-gray-700 dark:text-gray-300"
      >
        Leave your email and I&apos;ll tell you when classroom management and
        progress reports are ready. No newsletter.
      </label>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          id="teacher-email"
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          placeholder="you@school.sch.uk"
          autoComplete="email"
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white placeholder:text-gray-600 dark:placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="py-3 px-6 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
        >
          {status === "sending" ? "Adding…" : "Keep me posted"}
        </button>
      </div>

      <input
        type="text"
        name="website"
        value={trap}
        onChange={(e) => setTrap(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute w-px h-px -left-full overflow-hidden"
      />

      <p
        role="status"
        aria-live="polite"
        className="text-sm text-red-700 dark:text-red-400 empty:hidden"
      >
        {status === "error" && "That didn't go through. Check the address and try again."}
      </p>
    </form>
  );
}
