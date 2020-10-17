export const css = `html, body
{
	width: 100%;
	height: 100%;
	margin: 0;
	padding: 0;
	background-color: #191919;
	color: white;
}

.chat
{
	display: block;
	float: left;
	width: calc(100% - 300px);
	height: calc(100% - 50px);
	border: 0px;
	border-bottom: 1px solid #646464;
	overflow-y: scroll;
	box-sizing: border-box;
	padding: 10px;
}

.members
{
	display: block;
	float: left;
	width: 300px;
	height: calc(100% - 50px);
	border-bottom: 1px solid #646464;
	border-left: 1px solid #646464;
	box-sizing: border-box;
	padding: 10px;
}

#message
{
	width: calc(100% - 150px);
	height: 50px;
	border: 0;
	outline: 0;
	background-color: #191919;
	color: white;
	padding: 10px;
	font-size: 16px;
	font-family: monospace;
	float: left;
}

button
{
	float: left;
	width: 150px;
	height: 50px;
	border: 0;
	outline: 0;
	background-color: #3399CC;
	padding: 0;
	color: white;
}

button:hover
{
	background-color: #44AADD;
}

button:active
{
	background-color: #55BBEE;
}

.chat > div
{
	display: inline-block;
	width: 100%;
	float: left;
	font-family: monospace;
	margin-bottom: 10px;
	line-height: 1.5;
}

.chat > div > span
{
	display: inline-block;
	float: left;
	margin-right: 10px;
}

.chat > div > span:nth-last-child(1)
{
	margin-right: 0;
}

.chat > div > span:nth-child(1)
{
	color: gray;
}

.chat > div > span:nth-child(2)
{
	color: lime;
}

.chat > div > span.system
{
	color: yellow !important;
}
`;

export const js = `(() => {
	
	// Don't expose functions to window.
	
	const msg = document.querySelector("#message");
	const sendBtn = document.querySelector("button");
	const connected = document.querySelector(".members");
	const chat = document.querySelector(".chat");
	
	const _connected = new Map();
	
	sendBtn.addEventListener("click", () => messageEvt());
	msg.addEventListener("keydown", evt => {
		if (evt.keyCode === 13)
		{
			evt.preventDefault();
			messageEvt();
		}
	});
	
	function scrollDown ()
	{
		chat.scrollTop = chat.scrollHeight;
	}
	
	function getTS (ts)
	{
		const _ = document.createElement("span");
		_.innerText = \`\${ts.getDate().toString().padStart(2, "0")}/\${(ts.getMonth()+1).toString().padStart(2, "0")}/\${ts.getFullYear()} \${ts.getHours().toString().padStart(2, "0")}:\${ts.getMinutes().toString().padStart(2, "0")}:\${ts.getSeconds().toString().padStart(2, "0")}\`;
		return _;
	}
	
	function addSystemMessage (ts, content)
	{
		const msg = document.createElement("div");
		msg.appendChild(getTS(ts));
		const c = document.createElement("span");
		c.classList.add("system");
		c.innerHTML = content;
		msg.appendChild(c);
		chat.appendChild(msg);
		scrollDown();
	}
	
	function addMessage (ts, name, content)
	{
		const msg = document.createElement("div");
		msg.appendChild(getTS(ts));
		const a = document.createElement("span");
		a.innerText = name;
		msg.appendChild(a);
		// const c = document.createElement("span");
		// c.innerText = content;
		// msg.appendChild(c);
		msg.append(": " + content);
		chat.appendChild(msg);
		scrollDown();
	}
	
	function addChatEntry ({ system, name, ts, content })
	{
		if (system) return addSystemMessage(ts, content);
		addMessage(ts, name, content);
	}
	
	function addConnected (name, print = false)
	{
		if (_connected.has(name)) return;
		const field = document.createElement("div");
		field.innerText = name;
		connected.appendChild(field);
		_connected.set(name, field);
	}
	
	function removeConnected (name)
	{
		field = _connected.get(name);
		if (!field) return;
		field.remove();
	}
	
	function joinedRoom (name, members)
	{
		addConnected(name);
		for (let member of members) addConnected(member);
		msg.disabled = false;
		sendBtn.disabled = false;
	}
	
	function processData (data)
	{
		console.log(data);
		if (typeof data !== "object" || data === null) return;
		if (data.welcome) return joinedRoom(data.welcome, data.names);
		if (data.type)
		{
			if (data.ts) data.ts = new Date(data.ts);
			if (data.type === "joined")
			{
				addConnected(data.name, true);
				addChatEntry({ system: true, ts: data.ts, content: \`\${data.name} joined the chat!\` });
			} else if (data.type === "left")
			{
				removeConnected(data.name);
				addChatEntry({ system: true, ts: data.ts, content: \`\${data.name} has left the chat!\` });
			} else if (data.type === "message")
			{
				addChatEntry({ ts: data.ts, name: data.name, content: data.message });
			}
		}
	}
	
	const ws = new WebSocket(
		(
			window.location.protocol === "http:"
			? "ws://"
			: "wss://"
		) + window.location.host
		+ window.location.pathname
	);
	
	function sendMessage (message)
	{
		if (!message) return;
		ws.send(JSON.stringify({ message }));
	}
	
	function messageEvt ()
	{
		const m = msg.value;
		msg.value = "";
		sendMessage(m);
	}
	
	function startApp ()
	{
		const name = prompt("Username: ");
		ws.send(JSON.stringify({ name }));
	}
	
	function stopApp ()
	{
		msg.disabled = true;
		sendBtn.disabled = true;
	}
	
	ws.addEventListener("open", evt => {
		startApp();
	});
	
	ws.addEventListener("close", evt => {
		stopApp();
		alert(\`Connection terminated (\${evt.code}): \${evt.reason}\`);
	});
	
	ws.addEventListener("message", evt => {
		try
		{
			const content = JSON.parse(evt.data);
			processData(content);
		} catch (error)
		{
			console.error(error);
		}
	});
	
})();
`;

export const html = `<!DOCTYPE html5>
<html>
	<head>
		<meta charset="UTF-8" />
		<title>Texa Chat</title>
		<link rel="stylesheet" href="index.css" />
	</head>
	<body>
		<div class="chat"></div>
		<div class="members"></div>
		<input type="text" id="message" placeholder="Write a message..." disabled />
		<button disabled>Send</button>
		<script src="index.js"></script>
	</body>
</html>
`;
