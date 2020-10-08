// Imports
import { Pair } from "./Pair.ts";
import { Status } from "../deps.ts";
import { ResponseHeaders } from "./ResponseHeaders.ts";

/**
 * A response object.
 */
export class Response
{
	
	public get WRITABLE (): boolean { return this.pair.WRITABLE; }
	
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
	 * Send and end the response.
	 * @param body A final piece of chunk to add in the response body.
	 */
	public async end (body?: string): Promise<this>
	{
		if (!this.pair.WRITABLE)
			throw new Error(Pair.NOT_WRITABLE);
		if (body) this.content += body;
		this.pair.ENDING = true;
		let err: Error | null = null;
		try
		{
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
