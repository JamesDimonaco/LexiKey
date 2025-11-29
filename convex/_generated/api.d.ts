/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as assignments from "../assignments.js";
import type * as classrooms from "../classrooms.js";
import type * as practiceSessions from "../practiceSessions.js";
import type * as progressReports from "../progressReports.js";
import type * as struggleWords from "../struggleWords.js";
import type * as users from "../users.js";
import type * as wordLibrary from "../wordLibrary.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  assignments: typeof assignments;
  classrooms: typeof classrooms;
  practiceSessions: typeof practiceSessions;
  progressReports: typeof progressReports;
  struggleWords: typeof struggleWords;
  users: typeof users;
  wordLibrary: typeof wordLibrary;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
