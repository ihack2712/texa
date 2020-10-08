// Imports
import type { Addon, MiddlewareFn } from "../types.ts";
import { Middleware } from "../util/Middleware.ts";
import { runMiddleware } from "../util/runMiddleware.ts";
import { match } from "../deps.ts";

export const isProtocolMiddleware: (method: string) => MiddlewareFn = (method: string) => async (req, res, next) => await next(req.method.toLowerCase().trim() === method.toLowerCase().trim());

/**
 * A router object to route different requests.
 */
export class Router extends Middleware
{
	
	#middleware: Set<Addon> = new Set();
	
	/**
	 * Run the middleware associated with this router.
	 * @param req The request object.
	 * @param res The response object.
	 * @param next The next middleware function.
	 */
	public run: Middleware["run"] = async (req, res, next) => {
		await runMiddleware(this.#middleware, req, res);
		await next();
	};
	
	private addMiddlewares (end: boolean, path: string | Addon, ...middleware: Addon[]): void
	{
		if (typeof path === "string")
		{
			const matcher = match(path, { end });
			const set = new Set<Addon>();
			middleware.forEach(_ => set.add(_));
			this.use(async (req, res, next) => {
				// deno-lint-ignore no-explicit-any
				const result = matcher(req.url.pathname) as false | any;
				if (!result)
				{
					await next();
					return;
				}
				const pre = req.url.pathname.substring(0, result.path.length);
				req.url.pathname = req.url.pathname.substring(result.path.length, req.url.pathname.length);
				for (let key in result.params)
				{
					const value = result.params[key];
					req.params[key] = value;
				}
				const d = await runMiddleware(set, req, res);
				if (d.continue) req.url.pathname = pre + req.url.pathname;
				console.log(d.continue)
				await next(d.continue);
			});
		} else
		{
			[ path, ...middleware ].forEach(_ => this.#middleware.add(_));
		}
	}
	
	/**
	 * Add middleware to the application.
	 * @param middleware The middleware to add to the application.
	 */
	public use (path: string | Addon, ...middleware: Addon[]): this
	{
		this.addMiddlewares(false, path, ...middleware);
		return this;
	}
	
	/**
	 * Accept all methods.
	 * @param path The path that triggers the middleware to be run.
	 * @param middleware The middleware.
	 */
	public all (path: string, ...middleware: Addon[]): this
	{
		this.addMiddlewares(true, path, ...middleware);
		return this;
	}
	
	/**
	 * GET request.
	 * @param path The path that triggers the middlewares to be run.
	 * @param middleware The middleware.
	 */
	public get (path: string, ...middleware: Addon[]): this
	{
		return this.all(path, isProtocolMiddleware("get"), ...middleware);
	}
	
	/**
	 * POST request.
	 * @param path The path that triggers the middlewares to be run.
	 * @param middleware The middleware.
	 */
	public post (path: string, ...middleware: Addon[]): this
	{
		return this.all(path, isProtocolMiddleware("post"), ...middleware);
	}
	
	/**
	 * PUT request.
	 * @param path The path that triggers the middlewares to be run.
	 * @param middleware The middleware.
	 */
	public put (path: string, ...middleware: Addon[]): this
	{
		return this.all(path, isProtocolMiddleware("put"), ...middleware);
	}
	
	/**
	 * PATCH request.
	 * @param path The path that triggers the middlewares to be run.
	 * @param middleware The middleware.
	 */
	public patch (path: string, ...middleware: Addon[]): this
	{
		return this.all(path, isProtocolMiddleware("patch"), ...middleware);
	}
	
	/**
	 * DELETE request.
	 * @param path The path that triggers the middlewares to be run.
	 * @param middleware The middleware.
	 */
	public delete (path: string, ...middleware: Addon[]): this
	{
		return this.all(path, isProtocolMiddleware("delete"), ...middleware);
	}
	
}
