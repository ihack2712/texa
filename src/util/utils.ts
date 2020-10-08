/**
 * Parse an address an turn into an object with hostname and port.
 * @param addr The address string.
 * @param defaultHost The default host if none was provided.
 * @param defaultPort The default port if none was provided.
 */
export function parseAddrFromStr(addr: string, defaultHost: string, defaultPort: number): {
	hostname: string,
	port: number
} {
	let url: URL;
	try {
		const host = addr.startsWith(":") ? `${defaultHost}${addr}` : addr;
		url = new URL(`http://${host}`);
	} catch {
		throw new TypeError("Invalid address.");
	}
	if (
		url.username ||
		url.password ||
		url.pathname != "/" ||
		url.search ||
		url.hash
	) {
		throw new TypeError("Invalid address.");
	}
	return {
		hostname: url.hostname! || defaultHost!,
		port: url.port === "" ? defaultPort! : Number(url.port)!,
	};
}
