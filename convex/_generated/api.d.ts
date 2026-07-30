/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as appointments from "../appointments.js";
import type * as clerkAuth from "../clerkAuth.js";
import type * as crm from "../crm.js";
import type * as estimates from "../estimates.js";
import type * as http from "../http.js";
import type * as invitations from "../invitations.js";
import type * as invitationsInternal from "../invitationsInternal.js";
import type * as leadAssignments from "../leadAssignments.js";
import type * as lib_audit from "../lib/audit.js";
import type * as lib_authz from "../lib/authz.js";
import type * as lib_cal from "../lib/cal.js";
import type * as lib_events from "../lib/events.js";
import type * as lib_invitationPolicy from "../lib/invitationPolicy.js";
import type * as lib_userLifecycle from "../lib/userLifecycle.js";
import type * as migrations from "../migrations.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  appointments: typeof appointments;
  clerkAuth: typeof clerkAuth;
  crm: typeof crm;
  estimates: typeof estimates;
  http: typeof http;
  invitations: typeof invitations;
  invitationsInternal: typeof invitationsInternal;
  leadAssignments: typeof leadAssignments;
  "lib/audit": typeof lib_audit;
  "lib/authz": typeof lib_authz;
  "lib/cal": typeof lib_cal;
  "lib/events": typeof lib_events;
  "lib/invitationPolicy": typeof lib_invitationPolicy;
  "lib/userLifecycle": typeof lib_userLifecycle;
  migrations: typeof migrations;
  users: typeof users;
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
