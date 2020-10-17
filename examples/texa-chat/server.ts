// Imports
import { Application, Static, Router, __dirname } from "./deps.ts";
import { addr } from "./config.ts";
import ws from "./ws.ts";
import { css, html, js } from "./files.ts";

// Create a new application.
const app = new Application(addr);

// Add websocket event on the app.
ws(app);

const WWW = __dirname(import.meta) + "/www";
const INDEX = WWW + "/index.html";

// Create a router.
const router = new Router();
router.get("/index.css", async (req, res) => await res.type("text/css").end(css));
router.get("/index.js", async (req, res) => await res.type("application/javascript").end(js));

// Serve static files.
app.use(new Static(WWW));
app.use(router);
app.use(async (req, res) => await res.type("text/html").end(html));

// Print the server origin.
console.log(app.origin);

// Start the application.
await app.start();
