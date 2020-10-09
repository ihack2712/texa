// Imports
import { Pair } from "./Pair.ts";
import { Status, contentType, extname } from "../deps.ts";
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
	public async json (data: any): Promise<this>
	{
		if (!this.pair.WRITABLE)
			throw new Error(Pair.NOT_WRITABLE);
		this.headers.set("Content-Type", "application/json; charset=utf-8")
		return await this.end(JSON.stringify(data));
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
		if (body) this.content += body;
		if (this.#filePath)
		{
			this.#content = await Deno.readTextFile(this.#filePath);
			this.headers.set("Content-Type", contentType(extname(this.#filePath)) || "text/plain; charset=utf-8");
		}
		let err: Error | null = null;
		try
		{
			this.headers
				.set("Content-Length", this.#content.length)
				.set("X-Powered-By", "Texa");
			await this.pair._request.respond({
				body: this.#content,
				headers: this.headers.toHeadersObject(),
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
	
}
