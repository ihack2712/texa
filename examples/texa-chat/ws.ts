// Exports
import type { Application, WebSocket } from "./deps.ts";

type Client = WebSocket & { name: string };
type Room = Map<string, Client>;
type Rooms = Map<string, Room>;

// The different rooms.
const rooms: Rooms = new Map();

/**
 * Send a message to everybody in a room.
 * @param room The room ID or room map.
 * @param message The message to send.
 * @param except The socket to exclude.
 */
async function broadcast (room: Room | string, message: string, except?: Client): Promise<void>
{
	if (typeof room === "string" && rooms.has(room)) room = rooms.get(room)!;
	else if (!room || (typeof room === "string" && !rooms.has(room))) return;
	for (let [ , socket ] of room as Room)
		if (socket !== except)
			await socket.send(message).catch(console.error);
}

/**
 * The web socket events.
 */
export default (app: Application) => app.on("connection", async (socket: Client) => {
	
	const roomID = socket.req.originalUrl.pathname;
	
	socket.on("message", async data => {
		let _: any;
		try
		{
			_ = JSON.parse(data);
		} catch (error)
		{
			return await socket.close(1003, error.message);
		}
		
		if (typeof _ !== "object" || _ === null)
			return await socket.close(1002, "The message should a JSON object.");
		
		if (_.name && socket.name)
			return await socket.close(1008, "Socket name is already set.");
		else if (_.name && !socket.name)
			if (typeof _.name !== "string")
				return await socket.close(1002, "The name property should be a string.");
			else if (rooms.has(roomID) && rooms.get(roomID)!.has(_.name))
				return await socket.close(4001, "The name is already in use.");
			else if (!/^[a-z0-9_A-Z_]+$/gi.test(_.name) || _.name.length > 32 || _.name.length < 3)
				return await socket.close(4002, "The name property must only contain characters A-Z a-z 0-9 and _, and must be between 3 and 32 characters.");
			else
			{
				if (!rooms.has(roomID)) rooms.set(roomID, new Map());
				const room = rooms.get(roomID)!;
				room.set(_.name, socket);
				socket.name = _.name;
				let names: string[] = [];
				for (let [, s ] of room) names.push(s.name!);
				await socket.send(JSON.stringify({ welcome: socket.name, connected: room.size, names }));
				await broadcast(room, JSON.stringify({ type: "joined", name: socket.name, ts: Date.now() }), socket);
			}
		else if (!socket.name && _.message)
			return await socket.close(1002, "The socket should be welcomed before sending or receiving any messages.");
		else if (socket.name && _.message)
			if (typeof _.message !== "string")
				return await socket.close(1002, "The message property should be a string.");
			else if (_.message.length < 1)
				return;
			else if (_.message.length > 2000)
				return await socket.send(JSON.stringify({ error: "Message must be shorter than 2000 characters." }));
			else
				return await broadcast(roomID, JSON.stringify({ type: "message", name: socket.name, ts: Date.now(), message: _.message }));
		else return await socket.close(1002, "Not understood!");
	});
	
	socket.on("close", async () => {
		if (rooms.has(roomID) && socket.name)
		{
			console.log("%s disconnected from %s", socket.name, roomID);
			const room = rooms.get(roomID)!;
			room.delete(socket.name);
			if (room.size < 1)
			{
				rooms.delete(roomID);
				console.log("Deleting room %s", roomID);
			}
			else
			{
				await broadcast(room, JSON.stringify({ type: "left", name: socket.name, ts: Date.now() }), socket);
				console.log("Sending farewell message to the rest of the room.");
			}
		} else
		{
			console.log("Disconnected from no room.");
		}
	});
	
});
