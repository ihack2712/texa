// Imports
import type { Application } from "../Application.ts";
import type { ServerRequest } from "../deps.ts";
import { Request } from "./Request.ts"
import { Response } from "./Response.ts"

/**
 * A pair of request and response object.
 */
export class Pair
{
	
	public static readonly NOT_WRITABLE: string = "The response is no longer writable!" as string;
	
	/** Whether or not the response is currently being sent. */
	public ENDING: boolean = false as boolean;
	
	/** Whether or not the response has been sent. */
	public ENDED: boolean = false as boolean;
	
	/** Whether or not properties are changable. */
	public get WRITABLE (): boolean { return !(this.ENDING || this.ENDED); }
	
	/** The generated request. */
	public readonly request: Request;
	
	/** The generated response. */
	public readonly response: Response;
	
	/**
	 * Initiate a new request and response pair.
	 * @param app The application object.
	 * @param _request The request object.
	 */
	public constructor (
		public readonly app: Application,
		public readonly _request: ServerRequest
	) {
		// Create a new request.
		this.request = new Request(this);
		
		// Create a new response.
		this.response = new Response(this);
	}
	
	public async init (): Promise<void>
	{
		await this.request._init();
	}
	
}
