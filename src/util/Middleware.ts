// Imports
import type { Request } from "../structure/Request.ts";
import type { Response } from "../structure/Response.ts";
import type { NextFn } from "../types.ts";

/**
 * A middleware object.
 */
export class Middleware
{
	
	/**
	 * The run mechanism.
	 * @param req The server request.
	 * @param res The server response.
	 * @param next The next function.
	 */
	public async run (req: Request, res: Response, next: NextFn)
	{
		await next();
	}
	
}
