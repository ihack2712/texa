// Imports
import type { ServerRequest } from "../deps.ts";
import type { HeaderValue } from "../types.ts";
import { ReadonlyMap } from "./ReadonlyMap.ts";

/**
 * The request headers.
 */
export class RequestHeaders extends ReadonlyMap<string, HeaderValue>
{
	
	/**
	 * Initiate a new request headers object.
	 * @param _request The original request object.
	 */
	public constructor (_request: ServerRequest)
	{
		const map = new Map();
		for (let [ key, value ] of _request.headers.entries())
		{
			let numberValue: number | bigint = Number(value);
			if (!Number.isNaN(numberValue))
				if (!Number.isSafeInteger(numberValue))
					map.set(key, BigInt(value))
				else
					map.set(key, numberValue);
			else if (/^(y|yes|enabled?|on|true)$/gi.test(value.trim()))
				map.set(key, true)
			else if (/^(n|no|disabled?|off|false)$/gi.test(value.trim()))
				map.set(key, false)
			else map.set(key, value);
		}
		super(map);
	}
	
}
