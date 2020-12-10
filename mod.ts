// Imports
import { dirname as _dirname } from "./src/deps.ts";

// Exports
export * from "./src/middleware/Router.ts";
export * from "./src/middleware/static.ts";
export * from "./src/structure/Cookies.ts";
export * from "./src/structure/Pair.ts";
export * from "./src/structure/ReadonlyMap.ts";
export * from "./src/structure/Request.ts";
export * from "./src/structure/Response.ts";
export * from "./src/structure/RequestHeaders.ts";
export * from "./src/structure/ResponseHeaders.ts";
export * from "./src/util/RouteMiddleware.ts";
export * from "./src/util/utils.ts";
export * from "./src/ws/WebSocket.ts";
export * from "./src/Application.ts";
export * from "./src/types.ts";

export function __filename(meta: ImportMeta): string {
	return meta.url.substring(7, meta.url.length);
}

export function __dirname(meta: ImportMeta): string {
	return _dirname(__filename(meta));
}
