// Imports
import type { Addon, MiddlewareFn } from "../types.ts";
import { SubMiddleware } from "../util/SubMiddleware.ts";

export const isProtocolMiddleware: (method: string) => MiddlewareFn = (method: string) => async (req, res, next) => await next(req.method.toLowerCase().trim() === method.toLowerCase().trim());

/**
 * A router object to route different requests.
 */
export class Router extends SubMiddleware
{
	
	/**
	 * Accept all methods.
	 * @param path The path that triggers the middleware to be run.
	 * @param middleware The middleware.
	 */
	public all (path: string, ...middleware: Addon[]): this
	{
		this.use_end(path, ...middleware);
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
