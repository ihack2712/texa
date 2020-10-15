// Imports
import type { HeaderValue } from "../types.ts";
import { Status, contentType, extname, STATUS_TEXT } from "../deps.ts";
import { Pair } from "./Pair.ts";
import { ResponseHeaders } from "./ResponseHeaders.ts";

/**
 * A response object.
 */
export class Response
{
	
	public get WRITABLE (): boolean { return this.pair.WRITABLE; }
	
	#filePath?: string;
	#content: string = "" as string;
	#statusCode: Status = Status.OK;
	
	/** The headers to send back. */
	public readonly headers: ResponseHeaders = new ResponseHeaders(this);
	
	/** The status code to respond with. */
	public get statusCode (): Status { return this.#statusCode; }
	/** The status code to respond with. */
	public set statusCode (code: Status)
	{
		if (!this.pair.WRITABLE)
			throw new Error(Pair.NOT_WRITABLE);
		this.#statusCode = code;
	}
	
	/** The body content. */
	public get content (): string { return this.#content; }
	/** The body content. */
	public set content (chunk: string)
	{
		if (!this.pair.WRITABLE)
			throw new Error(Pair.NOT_WRITABLE);
		this.#content = chunk;
	}
	
	/**
	 * Initiate a new response object.
	 * @param pair The request/response pair object.
	 */
	public constructor (private readonly pair: Pair)
	{
		
	}
	
	/**
	 * Set the status code to respond with.
	 * @param code The status code.
	 * @returns for chainable purposes.
	 */
	public status (code: Status): this
	{
		if (!this.pair.WRITABLE)
			throw new Error(Pair.NOT_WRITABLE);
		this.statusCode = code;
		return this;
	}
	
	/**
	 * Write some data to the body.
	 * @param chunk The chunk to add.
	 */
	public write (chunk?: string): this
	{
		if (!this.pair.WRITABLE)
			throw new Error(Pair.NOT_WRITABLE);
		if (chunk) this.content += chunk;
		return this;
	}
	
	/**
	 * Send file contents in response. File contents are loaded in
	 * .end().
	 * @param path The file path to read.
	 */
	public file (path: string): this
	{
		this.#filePath = path;
		return this;
	}
	
	/**
	 * Send a json response and end the response.
	 * @param data The data to send.
	 */
	// deno-lint-ignore no-explicit-any
	public async json (data: any): Promise<this>
	{
		if (!this.pair.WRITABLE)
			throw new Error(Pair.NOT_WRITABLE);
		this.headers.set("Content-Type", "application/json; charset=utf-8");
		return await this.end(JSON.stringify(data));
	}
	
	/**
	 * Set the Content-Type response header.
	 * @param type The MIME type.
	 */
	public type (type: string): this
	{
		this.headers.set("Content-Type", type);
		return this;
	}
	
	/**
	 * Send and end the response.
	 * @param body A final piece of chunk to add in the response body.
	 */
	public async end (body?: string): Promise<this>
	{
		if (!this.pair.WRITABLE)
			throw new Error(Pair.NOT_WRITABLE);
		this.pair.ENDING = true;
		if (body) this.#content += body;
		const headers = this.headers.toHeadersObject();
		if (this.#filePath)
		{
			this.#content = await Deno.readTextFile(this.#filePath);
			headers.set("Content-Type", contentType(extname(this.#filePath)) || "text/plain; charset=utf-8");
		}
		let err: Error | null = null;
		try
		{
			headers.set("Content-Length", this.#content.length.toString());
			headers.set("X-Powered-By", "Texa");
			if (!this.content && this.statusCode >= 400)
				this.#content = STATUS_TEXT.has(this.statusCode) ? `${this.statusCode} - ${STATUS_TEXT.get(this.statusCode)}` : "";
			await this.pair._request.respond({
				body: this.#content,
				headers: headers,
				status: this.#statusCode
			});
		} catch (error)
		{
			err = error;
		}
		this.pair.ENDED = true;
		this.pair.ENDING = false;
		if (err) throw err;
		return this;
	}
	
	/**
	 * **Alias**: <Response>.headers.get(key: string)
	 */
	public get (key: string): HeaderValue | void
	{
		return this.headers.get(key);
	}
	
	/**
	 * **Alias**: <Response>.headers.set(key: string, value: HeaderValue)
	 * @returns Response object.
	 */
	public set (key: string, value: HeaderValue): this
	{
		this.headers.set(key, value);
		return this;
	}
	
	/**
	 * **Alias**: <Response>.headers.has(key: string)
	 */
	public has (key: string): boolean
	{
		return this.headers.has(key);
	}
	
	/**
	 * **Alias**: <Response>.headers.delete(key: string)
	 * @returns Response object.
	 */
	public delete (key: string): this
	{
		this.headers.delete(key);
		return this;
	}
	
}
