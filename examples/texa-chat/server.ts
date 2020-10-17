// Imports
import { Application, Static, __dirname } from "./deps.ts";
import { addr } from "./config.ts";
import ws from "./ws.ts";

// Create a new application.
const app = new Application(addr);

// Add websocket event on the app.
ws(app);

const WWW = __dirname(import.meta) + "/www";
const INDEX = WWW + "/index.html";

// Serve static files.
app.use(new Static(WWW));
app.use(async (req, res) => await res.file(INDEX).end());

// Print the server origin.
console.log(app.origin);

// Start the application.
await app.start();
