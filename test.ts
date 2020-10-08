// Imports
import {
	Application,
	Router
} from "./mod.ts";

const app = new Application("127.0.0.1:3001", {
	allowWebSocket: false
});

app.use(
	async (req, res, next) => {
		let err: Error | null = null;
		try
		{
			await next();
		} catch (error)
		{
			err = error;
			await res.status(500).end(error.stack);
		}
		console.log(`${req.method} ${Date.now() - req.at}ms ${res.statusCode} ${req.url.pathname}${err !== null ? ` - ${err.stack}` : ""}`);
	}
);

const router = new Router();
app.use(router);

router.get(
	"/hello",
	async (req, res, next) => await next(),
	async (req, res) => {
		console.log("Hello 1");
		res.end("World");
	}
);

router.get(
	"/hello",
	async (req, res, next) => await next(),
	async (req, res) => {
		console.log("Hello 2");
	}
);

console.log(
	`http%s://%s:%d`,
	app.secure ? "s" : "",
	app.addr.hostname,
	app.addr.port
);

await app.start();
