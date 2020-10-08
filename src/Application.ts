// Imports
import type { Server as DenoServer } from "./deps.ts";
import type { Addon } from "./types.ts";
import { WebSocket } from "./ws/WebSocket.ts";
import { serve, serveTLS, EventEmitter, acceptWebSocket } from "./deps.ts";
import { parseAddrFromStr } from "./util/utils.ts";
import { Pair } from "./structure/Pair.ts";
import { ReadonlyMap } from "./structure/ReadonlyMap.ts";
import { runMiddleware } from "./util/runMiddleware.ts";

/**
 * The application object.
 */
export class Application extends EventEmitter<{
	/**
	 * Fired when a websocket is successfully accepted.
	 * @param sock The websocket that connected.
	 * @event connection
	 */
	connection (sock: WebSocket): unknown | Promise<unknown>
	
	/**
	 * Fired when a websocket failed to be accepted.
	 * @param error The error that was thrown.
	 * @event error
	 */
	error (error: Error): unknown | Promise<unknown>
	
	/**
	 * Fired when an error occurs at a normal request.
	 * @param req The request object.
	 * @param res The response object.
	 * @param error The error that was thrown.
	 */
	requestError (req: Pair["request"], res: Pair["response"], error: Error): unknown | Promise<unknown>
}> {
	
	#sockets: Map<string, WebSocket> = new Map();
	#middleware: Set<Addon> = new Set();
	#allowSockets: boolean;
	
	/** The websockets that are connected to the application. */
	public readonly sockets: ReadonlyMap<string, WebSocket> = new ReadonlyMap(this.#sockets);
	
	/** The Deno server. */
	private readonly _server: DenoServer;
	
	/** Whether or not the server is secure. */
	public readonly secure: boolean;
	
	/** The address that the server is hosted on. */
	public readonly addr: {
		readonly hostname: string,
		readonly port: number
	};
	
	/**
	 * Initiate a new server.
	 * @param options The server options.
	 */
	public constructor (addr: string, options?: {
		certFile?: string,
		keyFile?: string,
		allowWebSocket?: boolean
	}) {
		super();
		
		const {
			certFile, keyFile,
			allowWebSocket
		} = options || { };
		
		this.#allowSockets = allowWebSocket !== false;
		
		// #region Check whether or not to use a secure server.
		if (typeof certFile === "string" || typeof keyFile === "string")
			if (!certFile)
				throw new Error("Key file is specified, but a certificate file wasn't!");
			else if (!keyFile)
				throw new Error("Certificate file is specified, but a key file wasn't!");
			else this.secure = true;
		else this.secure = false;
		// #endregion
		
		// #region Get the address to serve the server on.
		const { port, hostname } = parseAddrFromStr(addr, "127.0.0.1", 0);
		// #endregion
		
		// #region Create server.
		this._server = this.secure
			? serveTLS({ certFile: certFile!, keyFile: keyFile!, port, hostname })
			: serve({ port, hostname });
		// #endregion
		
		// #region Set the address properties.
		const __addr = (this._server.listener.addr as ReturnType<typeof parseAddrFromStr>);
		this.addr = {
			hostname: __addr.hostname,
			port: __addr.port
		};
		// #endregion
	}
	
	/**
	 * Start accepting incoming connections.
	 */
	public async start (): Promise<void>
	{
		for await (let _request of this._server)
		{
			const pair = new Pair(this, _request);
			if (pair.request.url.protocol === "wss:" || pair.request.url.protocol === "ws:")
			{
				const { conn, r: bufReader, w: bufWriter, headers } = _request;
				acceptWebSocket({
					conn,
					bufReader,
					bufWriter,
					headers,
				}).then(async ws => {
					const sock = new WebSocket(this.#sockets, ws);
					this.#sockets.set(sock.id, sock);
					if (!this.#allowSockets)
					{
						await sock.close(1000, "WebSocket connections are disabled!");
						return;
					}
					await this.emit("connection", sock);
				}).catch(async error => {
					await _request.respond({
						status: 400
					});
					this.emitSync("error", error);
				});
			} else
			{
				runMiddleware(this.#middleware, pair.request, pair.response)
					.then(async diagnostic => {
						if (diagnostic.failed)
							await this.emit("requestError", pair.request, pair.response, diagnostic.error!);
						if (pair.WRITABLE) await pair.response.end();
					}).catch(async error => {
						await this.emit("requestError", pair.request, pair.response, error);
						if (pair.WRITABLE) await pair.response.end();
					});
			}
		}
	}
	
	/**
	 * Add middleware to the application.
	 * @param middleware The middleware to add to the application.
	 */
	public use (...middleware: Addon[]): this
	{
		middleware.forEach(_ => this.#middleware.add(_));
		return this;
	}
	
	/**
	 * Remove middleware from the application.
	 * @param middleware The middleware to remove from the application.
	 */
	public unuse (...middleware: Addon[]): this
	{
		middleware.forEach(_ => this.#middleware.delete(_));
		return this;
	}
	
}
