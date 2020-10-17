// Imports
import type { NextFn } from "../types.ts";
import type { Request } from "../structure/Request.ts";
import type { Response } from "../structure/Response.ts";
import { resolve, join, contentType, extname } from "../deps.ts";
import { Middleware } from "../util/Middleware.ts";
import { Status } from "https://deno.land/std@0.74.0/http/http_status.ts";

export type DirectoryListingFn = (entries: ({ size?: number, name: string })[]) => [ string, string ] | Promise<[ string, string ]>;
export type Handler = (pathname: string, req: Request, res: Response) => [ string, string ] | Promise<[ string, string ] | undefined> | undefined;
export type Handlers = { [key: string]: Handler };
export type HandlersMap = Map<string, Handler>;

/**
 * A static file server middleware.
 */
export class Static extends Middleware
{
	
	public static readonly startsWithDot = /^\./gi;
	/**
	 * Attempt to find an existing index within a directory.
	 * @param indexes The indexes to look for.
	 * @param dir The directory to look in.
	 */
	public static async findFile (indexes: Set<string>, vanityExtensions: Set<string>, path: string, throwOnPermissionDenied: boolean = true): Promise<string | void>
	{
		try
		{
			const info = await Deno.lstat(path);
			if (info.isFile) return path;
			for (let index of indexes)
			{
				const p = await Static.findFile(indexes, vanityExtensions, join(path, index), false);
				if (p) return p;
			}
		} catch (error)
		{
			if (throwOnPermissionDenied && error instanceof Deno.errors.PermissionDenied)
				throw error;
			if (error instanceof Deno.errors.NotFound)
			{
				if (extname(path) === "")
				{
					for (let ext of vanityExtensions)
					{
						const file = await Static.findFile(indexes, vanityExtensions, path + (Static.startsWithDot.test(ext) ? "" : ".") + ext);
						if (file) return file;
					}
				}
			}
			else throw error;
		}
	}
	
	/**
	 * A fallback incase an extension is not found on the static middleware.
	 */
	public static async fallback (file: string): Promise<[ string, string ]>
	{
		return [
			await Deno.readTextFile(file),
			contentType(extname(file)) || "text/plain"
		];
	}
	
	/**
	 * Get the entries of a directory.
	 * @param dir The directory path.
	 */
	public static async getEntries (dir: string): Promise<{ size?: number, name: string }[]>
	{
		const entries: { size?: number, name: string }[] = [ ];
		for await (let { isDirectory, isFile, name } of Deno.readDir(dir))
		{
			if (isDirectory) entries.push({ name });
			if (isFile)
			{
				const { size } = await Deno.lstat(join(dir, name));
				entries.push({ name, size });
			}
		}
		return entries;
	}
	
	/** The directory to serve. */
	public readonly dir: string;
	
	/** The index names */
	public indexes: Set<string> = new Set<string>().add("index.html").add("default.html");
	
	/** A function to create a directory listing. */
	public directoryListing?: DirectoryListingFn;
	
	/** An object of handlers. */
	public readonly handlers: HandlersMap = new Map();
	
	/** A set of vanity extensions. */
	public readonly vanityExtensions: Set<string> = new Set();;
	
	/**
	 * Initiate a new static file server middleware.
	 * @param dir The directory to serve static files from.
	 */
	public constructor (
		dir: string,
		options?: {
			indexes?: string[] | Set<string>
			handlers?: Handlers | HandlersMap,
			vanityExtensions?: string[] | Set<string>,
			directoryListing?: DirectoryListingFn
		}
	) {
		super();
		this.dir = resolve(Deno.cwd(), dir);
		
		if (options)
		{
			if (options.indexes instanceof Set || Array.isArray(options.indexes))
				for (let index of options.indexes)
					this.indexes.add(index);
			if (typeof options.directoryListing === "function")
				this.directoryListing = options.directoryListing;
			if (typeof options.handlers === "object" && options.handlers !== null)
				for (let [ key, value ] of options.handlers instanceof Map ? options.handlers : Object.entries(options.handlers))
					this.handlers.set(key, value);
			if (options.vanityExtensions instanceof Set || Array.isArray(options.vanityExtensions))
				for (let ext of options.vanityExtensions)
					this.vanityExtensions.add((Static.startsWithDot.test(ext) ? "" : ".") + ext);
		}
	}
	
	/**
	 * Run the middlewares on this static 
	 * @param req The request object.
	 * @param res The response object.
	 * @param next The next function.
	 */
	public async run (req: Request, res: Response, next: NextFn)
	{
		const _path = join(this.dir, resolve("/", req.url.pathname));
		try
		{
			const file = await Static.findFile(this.indexes, this.vanityExtensions, _path);
			if (!file && this.directoryListing)
			{
				const entries = await Static.getEntries(_path);
				const [ content, type ] = await this.directoryListing(entries);
				if (content)
				{
					await res.status(Status.OK).set("content-type", type || "text/plain").end(content);
				}
			} else if (file)
			{
				let extension = extname(file);
				extension = extension.substring(1, extension.length);
				let handler = Static.fallback as Handler;
				if (this.handlers.has(extension)) handler = this.handlers.get(extension)!;
				const [ content, type ] = (await handler(file, req, res)) || [];
				if (res.WRITABLE && content)
					await res.status(Status.OK).set("content-type", type || "text/plain").end(content);
			}
		} catch (error)
		{
			if (error instanceof Deno.errors.PermissionDenied)
				await res.status(Status.Forbidden).end();
			else if (error instanceof Deno.errors.NotFound) {}
			else throw error;
		}
		await next();
	}
	
}
