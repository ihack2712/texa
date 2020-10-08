// Imports
import type { Request } from "./structure/Request.ts";
import type { Response } from "./structure/Response.ts";
import type { Middleware } from "./util/Middleware.ts";

/** A kind header value. */
export type HeaderValue = string | number | boolean | bigint;

/** A kind header object. */
export type HeadersObject = { [key: string]: HeaderValue };

/** An address. */
export type Address = {
	hostname: string,
	port: number
};

export type NextFn = (callNext?: boolean) => Promise<void>;

/**
 * A middleware function instead of a middleware object.
 * @param req The request object.
 * @param res The response object.
 * @param next Run the next middleware.
 */
export type MiddlewareFn = (req: Request, res: Response, next: NextFn) => Promise<unknown> | unknown;

/** Middleware that can be used as an addon on the application. */
export type Addon = MiddlewareFn | Middleware;

export type MiddlewareDiagnostics = {
	middleware: number,
	failed: boolean,
	ran: number,
	continue: boolean,
	error?: Error
};
