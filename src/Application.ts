// Imports
import type { Server as DenoServer } from "./deps.ts";
import { WebSocket } from "./ws/WebSocket.ts";
import { serve, serveTLS, Event, acceptWebSocket } from "./deps.ts";
import { parseAddrFromStr } from "./util/utils.ts";
import { Pair } from "./structure/Pair.ts";
import { ReadonlyMap } from "./structure/ReadonlyMap.ts";
import { RouteMiddleware } from "./util/RouteMiddleware.ts";

/**
 * The application object.
 */
export class Application extends RouteMiddleware {

	#sockets: Map<string, WebSocket> = new Map();
	#allowSockets: boolean;

	/** Fired when a new websocket connection is made. */
	public readonly onconnection = new Event<[sock: WebSocket]>();

	/** Fired when the application fails to accept a websocket. */
	public readonly onwebsocketerror = new Event<[error: Error]>();

	/** Fired when an error occurs within the request itself or in any of the middlewares. */
	public readonly onrequesterror = new Event<[req: Pair["request"], res: Pair["response"], error: Error]>();

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

	public get origin(): string {
		return "http"
			+ (this.secure ? "s" : "") + "://"
			+ this.addr.hostname
			+ ":" + this.addr.port;
	}

	/**
	 * Initiate a new server.
	 * @param options The server options.
	 */
	public constructor(addr: string, options?: {
		certFile?: string,
		keyFile?: string,
		allowWebSocket?: boolean
	}) {
		super();

		const {
			certFile, keyFile,
			allowWebSocket
		} = options || {};

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
	public async start(): Promise<void> {
		for await (let _request of this._server) {
			const pair = new Pair(this, _request);
			await pair.init();
			if (pair.request.url.protocol === "wss:" || pair.request.url.protocol === "ws:") {
				const { conn, r: bufReader, w: bufWriter, headers } = _request;
				acceptWebSocket({
					conn,
					bufReader,
					bufWriter,
					headers,
				}).then(async ws => {
					const sock = new WebSocket(this.#sockets, ws, pair.request, pair.response);
					sock.__init();
					this.#sockets.set(sock.id, sock);
					if (!this.#allowSockets) {
						await sock.close(1000, "WebSocket connections are disabled!");
						return;
					}
					await this.onconnection.dispatch(sock);
				}).catch(async error => {
					await _request.respond({
						status: 400
					});
					this.onwebsocketerror.dispatch(error);
				});
			} else {
				super.run(pair.request, pair.response)
					.then(async diagnostic => {
						if (diagnostic.success === false)
							await this.onrequesterror.dispatch(pair.request, pair.response, diagnostic.error);
						if (pair.WRITABLE) await pair.response.end();
					}).catch(async error => {
						await this.onrequesterror.dispatch(pair.request, pair.response, error);
						if (pair.WRITABLE) await pair.response.end();
					});
			}
		}
	}

}
