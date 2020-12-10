// Imports
import type { MatchFunction, Diagnostics, MiddlewareCallback } from "../deps.ts";
import type { MiddlewareFn } from "../types.ts";
import type { Request } from "../structure/Request.ts";
import type { Response } from "../structure/Response.ts";
import { Middleware, match } from "../deps.ts";

class Proxy extends Middleware<MiddlewareFn> {
	#matcher: MatchFunction;
	public constructor(
		public readonly path: string,
		end: boolean,
		args: MiddlewareCallback<MiddlewareFn>[]
	) {
		super();
		this.use(...args);
		this.#matcher = match(path, { end });
	}
	public async run(req: Request, res: Response): Promise<Diagnostics<MiddlewareFn>> {
		const result = this.#matcher(req.url.pathname) as false | any;
		if (!result) {
			return {
				success: true,
				discontinued: false,
				proxies: 0,
				ran: 0,
				reachedLast: true,
				total: 0,
				totalRan: 0,
				lastNextCalled: true
			};
		}
		const pre = req.url.pathname.substring(0, result.path.length);
		req.url.pathname = req.url.pathname.substring(result.path.length, req.url.pathname.length);
		for (let key in result.params) {
			const value = result.params[key];
			req.params[key] = value;
		}
		const diagnostics = await super.run(req, res);
		req.url.pathname = pre + req.url.pathname;
		return diagnostics;
	}
}

export const isMethodMiddleware: (method: string) => MiddlewareCallback<MiddlewareFn> = (method: string) => async (req, res, next) => await next(req.method.toLowerCase().trim() === method.toLowerCase().trim());

export class RouteMiddleware extends Middleware<MiddlewareFn> {

	private use_end(path: string | MiddlewareCallback<MiddlewareFn>, ...middleware: MiddlewareCallback<MiddlewareFn>[]): this {
		if (typeof path === "string") {
			super.use(new Proxy(path, true, middleware));
		} else {
			super.use(path, ...middleware);
		}
		return this;
	}

	public use(path: string | MiddlewareCallback<MiddlewareFn>, ...middleware: MiddlewareCallback<MiddlewareFn>[]): this {
		if (typeof path === "string") {
			super.use(new Proxy(path, false, middleware));
		} else {
			super.use(path, ...middleware);
		}
		return this;
	}

	/**
	 * Accept all methods.
	 * @param path The path that triggers the middleware to be run.
	 * @param middleware The middleware.
	 */
	public all(path: string, ...middleware: MiddlewareCallback<MiddlewareFn>[]): this {
		this.use_end(path, ...middleware);
		return this;
	}

	/**
	 * GET request.
	 * @param path The path that triggers the middlewares to be run.
	 * @param middleware The middleware.
	 */
	public get(path: string, ...middleware: MiddlewareCallback<MiddlewareFn>[]): this {
		return this.all(path, isMethodMiddleware("get"), ...middleware);
	}

	/**
	 * POST request.
	 * @param path The path that triggers the middlewares to be run.
	 * @param middleware The middleware.
	 */
	public post(path: string, ...middleware: MiddlewareCallback<MiddlewareFn>[]): this {
		return this.all(path, isMethodMiddleware("post"), ...middleware);
	}

	/**
	 * PUT request.
	 * @param path The path that triggers the middlewares to be run.
	 * @param middleware The middleware.
	 */
	public put(path: string, ...middleware: MiddlewareCallback<MiddlewareFn>[]): this {
		return this.all(path, isMethodMiddleware("put"), ...middleware);
	}

	/**
	 * PATCH request.
	 * @param path The path that triggers the middlewares to be run.
	 * @param middleware The middleware.
	 */
	public patch(path: string, ...middleware: MiddlewareCallback<MiddlewareFn>[]): this {
		return this.all(path, isMethodMiddleware("patch"), ...middleware);
	}

	/**
	 * DELETE request.
	 * @param path The path that triggers the middlewares to be run.
	 * @param middleware The middleware.
	 */
	public delete(path: string, ...middleware: MiddlewareCallback<MiddlewareFn>[]): this {
		return this.all(path, isMethodMiddleware("delete"), ...middleware);
	}

}
