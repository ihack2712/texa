# Texa

A web-framework inspired by [Oak](https://deno.land/x/oak) and [Express](https://npmjs.com/package/express), with built-in support for WebSocket connections.

## Features
- TLS
- Middlewares
- Router
- WebSockets
- Sleek request & response objects.

## Todos

- Cookies.
- `<Response>.file(path: string)`.
- Serve static files middleware.

## Importing

```ts
import { Application, Router } from "https://deno.land/x/texa/mod.ts";
```

## Creating an app

```ts
const app = new Application("127.0.0.1:3000");
```

## Disabling WebSockets

```ts
const app = new Application("127.0.0.1:3000", {
	allowWebSocket: false
});
```

## WebSockets

```ts
app.on("connection", async socket => {
	socket.on("message", async message => {
		// text message
	});
	socket.on("binary", async data => {
		// binary message
	});
	socket.on("ping", async data => {
		// ping event
	});
	socket.on("pong", async data => {
		// pong event
	});
	socket.on("close", async (closer, reason, message) => {
		// Close event
	});
});
```

## Adding middleware

```ts
app.use(
	async (req, res, next) => {
		let err: Error | null = null;
		try
		{
			await next();
		} catch (error)
		{
			err = error;
			await res.status(500).end("Internal server error, if you're a developer you can check the server logs.");
		}
		console.log(
			"%s %dms %s%s",                       // The log template.
			req.method,                           // The request method.
			Date.now() - req.at,                  // The amount of ms it took from start to finish.
			res.statusCode,                       // The status code that was sent back.
			req,url.pathname,                     // The requested resource.
			err !== null ? ` - ${err.stack}` : "" // Include an error if an error occured.
		);
	}
);
```

## Creating a router.

```ts
const router = new Router();
app.use(router);
```

## Adding routes

```ts
router.get("/hello", async (req, res) => {
	await res.end("World");
});
```

## Adding middleware to routers.

```ts
router.use(
	async (req, res, next) => {
		// Do something.
		await next();
	}
);
```

Or only run on a specific path.

```ts
router.use(
	"/path",
	async (req, res, next) => {
		res.end(req.url.pathname);
	}
);
```

## Router params

All request methods on the router, or the use method, accepts a path, which can contain a parameter.

```ts
router.get("/user/:param", async (req, res) => {
	console.log(req.params);
	// { param: ... }
});
```

Here are the possible param options.
```ts
"/:requiredParam"
"/:requiredParam(withRegex)"
"/:optionalParam?"
"/:optionalParam(withRegex)?"
"/:zeroOrMoreOccurances*"
"/:zeroOrMoreOccurances(withRegex)*"
"/:oneOrMoreOccurances+"
"/:oneOrMoreOccurances(withRegex)+"
```

## Middleware on object.

```ts
import { Middleware } from "https://deno.land/x/texa/mod.ts";

class MyMiddleware extends Middleware
{
	public value: string = "World";
	
	public run: Middleware["run"] = async (req, res, next) => {
		res.headers.set("X-Hello", this.value);
		await next();
	};
}

const middleware = new MyMiddleware();
app.use(middleware);

middleware.value = "Something else now";
```

## HTTP and HTTPS

```ts
// Imports
import { Application, Router } from "https://deno.land/x/texa/mod.ts";

// Create application.
const app = new Router();

app.get("/", async (req, res) => {
	res.end("Welcome home!");
});

// Create http app.
const httpApp = new Application("0.0.0.0:80")
	.use(app);

// Create https app.
const httpsApp = new Application("0.0.0.0:443", {
	certFile: "/path/to/cert.pem",
	keyFile: "/path/to/key.pem"
}).use(app);

// Start listening for requests on both servers.
httpApp.start().catch(console.error);
httpApp.start().catch(console.error);
```
