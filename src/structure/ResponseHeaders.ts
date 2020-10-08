// Imports
import type { Response } from "./Response.ts";
import type { HeaderValue } from "../types.ts";
import { Pair } from "./Pair.ts";

/**
 * A writable map of response headers.
 */
export class ResponseHeaders extends Map<string, HeaderValue>
{
	
	/** The response object. */
	private readonly res: Response;
	
	/**
	 * Initiate a new response header object.
	 * @param res The response object.
	 */
	public constructor (res: Response)
	{
		super();
		this.res = res;
	}
	
	/**
	 * Set a header on the response object.
	 * @param key The header name.
	 * @param value The header value.
	 */
	public set (key: string, value: HeaderValue): this
	{
		if (!this.res.WRITABLE)
			throw new Error(Pair.NOT_WRITABLE);
		return super.set(key, value);
	}
	
	/**
	 * Delete a header from the response object.
	 * @param key The header name.
	 */
	public delete (key: string): boolean
	{
		if (!this.res.WRITABLE)
			throw new Error(Pair.NOT_WRITABLE);
		return super.delete(key);
	}
	
	/**
	 * Append text to some header value.
	 * @param key The header name.
	 * @param value The value to append.
	 */
	public append (key: string, value: string): this
	{
		if (!this.res.WRITABLE)
			throw new Error(Pair.NOT_WRITABLE);
		return super.set(key, (super.get(key) || "") + value);
	}
	
	/**
	 * Turn the response headers into a Headers object.
	 */
	public toHeadersObject (): Headers
	{
		const headers = new Headers();
		for (let [ key, value ] of this.entries())
			headers.set(key, value.toString());
		return headers;
	}
	
}
