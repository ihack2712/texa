// Imports
import type { Address } from "../types.ts";
import type { Pair } from "./Pair.ts";
import { RequestHeaders } from "./RequestHeaders.ts";

// deno-lint-ignore no-explicit-any
type AnyObject = { [key: string]: any };

/**
 * A server request object.
 */
export class Request
{
	
	/** A unix timestamp in ms at since the request object was created. */
	public readonly at: number = Date.now();
	
	/** A URL object. */
	public readonly url: URL;
	
	/** The request method. */
	public readonly method: string;
	
	/** The request headers. */
	public readonly headers: RequestHeaders = new RequestHeaders(this.pair._request);
	
	/** The request parameters. */
	public readonly params: AnyObject = { };
	
	/** Meta information on the request. */
	public readonly meta: AnyObject = { };
	
	/** The requester's IP address. */
	public get ip (): string { return (this.pair._request.conn.remoteAddr as Address).hostname; }
	
	/**
	 * Initiate a new server request.
	 * @param pair The request/response pair object.
	 */
	public constructor (private readonly pair: Pair)
	{
		const { port, hostname } = pair.app.addr;
		const secure = pair.app.secure;
		this.url = new URL(`${pair._request.headers.has("sec-websocket-version") ? "ws" : "http"}${secure ? "s" : ""}://${hostname}:${port}${pair._request.url}`);
		this.method = pair._request.method;
	}
	
	/**
	 * Close the connection without sending a response.
	 */
	public close (): this
	{
		this.pair.ENDING = true;
		this.pair._request.conn.close();
		this.pair.ENDED = true
		this.pair.ENDING = false;
		return this;
	}
	
}
