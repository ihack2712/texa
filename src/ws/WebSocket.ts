// Imports
import type { Application } from "../Application.ts";
import type { DenoWebSocket } from "../deps.ts";
import { isWebSocketCloseEvent, isWebSocketPingEvent, isWebSocketPongEvent, EventEmitter } from "../deps.ts";

const zero = 0n;
const max = 2n**11n-1n;
let count: bigint = 0n as bigint;
const base: string = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ" as string;
const len = BigInt(base.length);

/**
 * Encode a big integer to Base62.
 * @param n The big integer.
 */
function encodeId (n: bigint): string
{
	let str = "";
	while (n > zero)
	{
		str = base.charAt(Number(n % len)) + str;
		n /= len;
	}
	return str;
}

/**
 * A remote websocket connection wrapper.
 */
export class WebSocket extends EventEmitter<{
	/**
	 * A binary message has been received.
	 * @param data The binary data that was sent.
	 * @event binary
	 */
	binary (data: Uint8Array): unknown | Promise<unknown>
	
	/**
	 * A text message has been received.
	 * @param data The text data that was sent.
	 * @event message
	 */
	message (data: string): unknown | Promise<unknown>
	
	/**
	 * The websocket has been closed.
	 * @param closer The entity that closed the connection.
	 * @param code The status code that was sent in the closure.
	 * @param reason The reason this websocket was closed.
	 * @event close
	 */
	close (closer: "client" | "server", code?: number, reason?: string): unknown | Promise<unknown>
	
	/**
	 * The server has been pinged.
	 * @param data The ping data.
	 * @event ping
	 */
	ping (data: Uint8Array): unknown | Promise<unknown>
	
	/**
	 * The websocket has responded to the server's ping.
	 * @param data The response data.
	 * @event pong
	 */
	pong (data: Uint8Array): unknown | Promise<unknown>
	
	/**
	 * An error occured on the connection.
	 * @param error The error that occured.
	 * @event error
	 */
	error (error: Error): unknown | Promise<unknown>
}> {
	
	public readonly id: string = encodeId(BigInt(Date.now() << 11) | (count = (count + 1n) % max));
	
	public get isClosed (): boolean
	{
		return this.ws.isClosed;
	}
	
	/**
	 * Initiate a new remote WebSocket wrapper.
	 * @param sockets The websocket map.
	 * @param ws The WebSocket remote.
	 */
	public constructor (private readonly sockets: Map<string, WebSocket>, private readonly ws: DenoWebSocket)
	{
		super();
		
		(async () => {
			try
			{
				for await (let event of ws)
				{
					if (isWebSocketCloseEvent(event))
					{
						sockets.delete(this.id);
						this.emitSync("close", "client", event.code, event.reason);
					}
					if (isWebSocketPingEvent(event))
						this.emitSync("ping", event[1])
					if (isWebSocketPongEvent(event))
						this.emitSync("pong", event[1])
					if (event instanceof Uint8Array)
						this.emitSync("binary", event);
					if (typeof event === "string")
						this.emitSync("message", event);
				}
			} catch (error)
			{
				sockets.delete(this.id);
				if (!this.isClosed)
				{
					await this.close(1000, "Failed to receive frame.").catch(error => this.emitSync("error", error));
				}
				this.emitSync(error);
			}
		})();
	}
	
	/**
	 * Gracefully attempt to close the connection.
	 * @param code The status code.
	 * @param reason The reason this websocket is closing.
	 */
	public async close (code?: number, reason?: string)
	{
		this.sockets.delete(this.id);
		if (!code && !reason)
			await this.ws.close();
		else if (code && !reason)
			await this.ws.close(code);
		else if (code && reason)
			await this.ws.close(code, reason);
		else
			await this.ws.close();
		this.emitSync("close", "server", code, reason);
	}
	
	/**
	 * Forcefully close the websocket connection.
	 */
	public closeForce (): this
	{
		this.sockets.delete(this.id);
		this.ws.closeForce();
		this.emitSync("close", "server");
		return this;
	}
	
	/**
	 * Send a message to the 
	 * @param message The message to send.
	 */
	public async send (...args: Parameters<DenoWebSocket["send"]>)
	{
		await this.ws.send(...args);
	}
	
}
