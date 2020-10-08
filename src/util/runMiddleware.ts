// Imports
import type { Pair } from "../structure/Pair.ts";
import type { Addon, MiddlewareDiagnostics, MiddlewareFn, NextFn } from "../types.ts";
import { Middleware } from "./Middleware.ts";

/**
 * Run through a bunch of middleware.
 */
export async function runMiddleware (middleware: Set<Addon>, request: Pair["request"], response: Pair["response"]): Promise<MiddlewareDiagnostics>
{
	const addons = [ ...middleware ];
	const diagnostics: MiddlewareDiagnostics = {
		failed: false,
		middleware: addons.length,
		ran: 0,
		continue: true
	};
	if (addons.length < 1) return diagnostics;
	let pos = 0;
	const createNextFunction = (): NextFn & { called: boolean } => {
		let nextPos = pos++;
		if (!addons[nextPos])
		{
			let meFn: NextFn & { called: boolean } = (async (callNext: boolean = true) => {
				meFn.called = true;
				if (!callNext) diagnostics.continue = false;
			}) as NextFn & { called: boolean };
			meFn.called = false;
			return meFn;
		}
		let _: NextFn & { called: boolean } = (async (callNext: boolean = true) => {
			_.called = true;
			try
			{
				if (callNext && !_.called)
				{
					const nextFn = createNextFunction() as NextFn & { called: boolean };
					let callFn: MiddlewareFn;
					const addon = addons[nextPos];
					if (addon instanceof Middleware)
						// deno-lint-ignore no-explicit-any
						callFn = async (...args: any[]) => (addon.run as any)(...args);
					else
						callFn = addon;
					await callFn(request, response, nextFn as NextFn);
					if (!nextFn.called) await nextFn(false);
					diagnostics.ran++;
				} else diagnostics.continue = false;
			} catch (error)
			{
				diagnostics.failed = true;
				diagnostics.error = error;
				diagnostics.continue = false;
				throw error;
			}
		}) as unknown as NextFn & { called: boolean };
		_.called = false;
		return _;
	};
	const next = createNextFunction();
	await next().catch(()=>{});
	return diagnostics;
}
