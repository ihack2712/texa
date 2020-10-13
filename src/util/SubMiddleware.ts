// Imports
import type { Addon, NextFn } from "../types.ts";
import type { Request } from "../structure/Request.ts";
import type { Response } from "../structure/Response.ts";
import { match } from "../deps.ts";
import { Middleware } from "./Middleware.ts";
import { runMiddleware } from "./runMiddleware.ts";

/**
 * A middleware that adds the ability to add more middleware.
 */
export class SubMiddleware extends Middleware
{
	
	#middleware: Set<Addon> = new Set();
	
	/**
	 * Run the middleware that is stored.
	 * @param req The request.
	 * @param res The response.
	 */
	public async run (req: Request, res: Response, next?: NextFn)
	{
		await runMiddleware(this.#middleware, req, res);
		if (next) await next();
	}
	
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
	 * Add a final path middleware to the application.
	 * @param middleware The middleware to add to the application.
	 */
	public use_end (path: string, ...middleware: Addon[]): this
	{
		this.addMiddlewares(true, path, ...middleware);
		return this;
	}
	
}
