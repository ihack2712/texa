// Imports
import type { Pair } from "./structure/Pair.ts";

/** A kind header value. */
export type HeaderValue = string | number | boolean | bigint;

/** A kind header object. */
export type HeadersObject = { [key: string]: HeaderValue };

/** An address. */
export type Address = {
	hostname: string,
	port: number
};

export type MiddlewareFn = (req: Pair["request"], res: Pair["response"]) => any;
