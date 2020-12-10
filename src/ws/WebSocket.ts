// Imports
import type { Application } from "../Application.ts";
import type { Request } from "../structure/Request.ts";
import type { Response } from "../structure/Response.ts";
import type { DenoWebSocket } from "../deps.ts";
import { isWebSocketCloseEvent, isWebSocketPingEvent, isWebSocketPongEvent, Event } from "../deps.ts";

const zero = 0n;
const max = 2n ** 11n - 1n;
let count: bigint = 0n as bigint;
const base: string = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ" as string;

/**
 * Encode a big integer to Base62.
 * @param n The big integer.
 */
function encodeId(n: number): string {
	let str = "";
	while (Math.floor(n) > zero) {
		str = base.charAt(Math.floor(n) % base.length) + str;
		n = Math.floor(Math.floor(n) / base.length);
	}
	return str;
}

/**
 * A remote websocket connection wrapper.
 */
export class WebSocket {

	#id: string;
	public get id(): string { return this.#id; }

	public readonly onerror = new Event<[error: Error]>();
	public readonly onpong = new Event<[data: Uint8Array]>();
	public readonly onping = new Event<[data: Uint8Array]>();
	public readonly onclose = new Event<[closer: "client" | "server", code?: number, reason?: string]>();
	public readonly onmessage = new Event<[data: string]>();
	public readonly onbinary = new Event<[data: Uint8Array]>();

	public get isClosed(): boolean {
		return this.ws.isClosed;
	}

	/**
	 * Initiate a new remote WebSocket wrapper.
	 * @param sockets The websocket map.
	 * @param ws The WebSocket remote.
	 */
	public constructor(
		private readonly sockets: Map<string, WebSocket>,
		private readonly ws: DenoWebSocket,
		public readonly req: Request,
		public readonly res: Response
	) {
		const id = encodeId(Number((BigInt(Date.now()) << 11n) | (count = (count + 1n) % max)));
		this.#id = id;
		(async () => {
			try {
				for await (let event of ws) {
					if (isWebSocketCloseEvent(event)) {
						sockets.delete(id);
						this.onclose.dispatch("client", event.code, event.reason);
					}
					if (isWebSocketPingEvent(event))
						this.onping.dispatch(event[1]);
					if (isWebSocketPongEvent(event))
						this.onpong.dispatch(event[1]);
					if (event instanceof Uint8Array)
						this.onbinary.dispatch(event);
					if (typeof event === "string")
						this.onmessage.dispatch(event);
				}
			} catch (error) {
				sockets.delete(id);
				if (!this.isClosed) {
					await this.close(1000, "Failed to receive frame.").catch(error => this.onerror.dispatch(error));
				}
				this.onerror.dispatch(error);
			}
		})();
	}

	public __init() {
	}

	/**
	 * Gracefully attempt to close the connection.
	 * @param code The status code.
	 * @param reason The reason this websocket is closing.
	 */
	public async close(code?: number, reason?: string) {
		this.sockets.delete(this.id);
		if (!code && !reason)
			await this.ws.close();
		else if (code && !reason)
			await this.ws.close(code);
		else if (code && reason)
			await this.ws.close(code, reason);
		else
			await this.ws.close();
		this.onclose.dispatch("server", code, reason);
	}

	/**
	 * Forcefully close the websocket connection.
	 */
	public closeForce(): this {
		this.sockets.delete(this.id);
		this.ws.closeForce();
		this.onclose.dispatch("server");
		return this;
	}

	/**
	 * Send a message to the 
	 * @param message The message to send.
	 */
	public async send(...args: Parameters<DenoWebSocket["send"]>) {
		await this.ws.send(...args);
	}

}
