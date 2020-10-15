// Imports
import { dirname as _dirname } from "./src/deps.ts";

// Exports
export * from "./src/Application.ts";
export * from "./src/types.ts";
export * from "./src/structure/Cookies.ts";
export * from "./src/structure/Pair.ts";
export * from "./src/structure/ReadonlyMap.ts";
export * from "./src/structure/Request.ts";
export * from "./src/structure/RequestHeaders.ts";
export * from "./src/structure/Response.ts";
export * from "./src/structure/ResponseHeaders.ts";
export * from "./src/util/Middleware.ts";
export * from "./src/util/runMiddleware.ts";
export * from "./src/util/utils.ts";
export * from "./src/middleware/Router.ts";
export * from "./src/middleware/static.ts";

export function filename (meta: ImportMeta): string
{
	return meta.url.substring(6, meta.url.length);
}

export function dirname (meta: ImportMeta): string
{
	return _dirname(filename(meta));
}
