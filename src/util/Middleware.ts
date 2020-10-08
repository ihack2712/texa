// Imports
import type { Request } from "../structure/Request.ts";
import type { Response } from "../structure/Response.ts";

interface IMiddleware
{
	run (req: Request, res: Response, next: (callNext?: boolean) => Promise<void>): Promise<unknown> | unknown;
}

/**
 * A middleware object.
 */
export class Middleware implements IMiddleware
{
	
	/**
	 * The run mechanism.
	 * @param req The server request.
	 * @param res The server response.
	 * @param next The next function.
	 */
	public run: IMiddleware["run"] = async (req, res, next): Promise<void> =>
	{
		await next();
	}
	
}
