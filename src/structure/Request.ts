// Imports
import type { Address } from "../types.ts";
import type { Pair } from "./Pair.ts";
import { RequestHeaders } from "./RequestHeaders.ts";
import { extractType } from "../util/utils.ts";
import { Status } from "../deps.ts";

// deno-lint-ignore no-explicit-any
type AnyObject = { [key: string]: any };

/**
 * A server request object.
 */
export class Request
{
	
	#_body?: string;
	#body?: any;
	#initiated: boolean = false;
	
	/** A unix timestamp in ms at since the request object was created. */
	public readonly at: number = Date.now();
	
	/** A URL object. */
	public readonly url: URL;
	
	/** Added an original URL property. */
	public readonly originalUrl: URL;
	
	/** The request method. */
	public readonly method: string;
	
	/** The request headers. */
	public readonly headers: RequestHeaders = new RequestHeaders(this.pair._request);
	
	/** The request parameters. */
	public readonly params: AnyObject = { };
	
	/** Meta information on the request. */
	public readonly meta: AnyObject = { };
	
	/** The original request body. */
	public get _body (): string | void { return this.#_body; }
	
	/** The request body. */
	public get body (): any | void { return this.#body; }
	
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
		this.originalUrl = new URL(`${pair._request.headers.has("sec-websocket-version") ? "ws" : "http"}${secure ? "s" : ""}://${hostname}:${port}${pair._request.url}`);
		this.method = pair._request.method;
	}
	
	public async _init (): Promise<void>
	{
		if (this.#initiated) return;
		this.#initiated = true;
		this.#_body = (await Deno.readAll(this.pair._request.body)).reduce((str, char) => str += String.fromCharCode(char), "");
		if (
			this.headers.has("content-type") &&
			typeof this.headers.get("content-type")! === "string"
		) {
			const mediaType = extractType(this.headers.get("content-type")! as string);
			if (mediaType === "application/json")
			{
				try
				{
					this.#body = JSON.parse(this.#_body);
				} catch (error)
				{
					await this.pair.response.status(Status.BadRequest).end();
				}
			}
		}
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
