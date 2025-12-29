import "./misc/console";
import { SerialPort } from "serialport";
import { choiceSelect, samplePortResponse } from "./misc/misc";
import { envFile, EnvFile, packet, Packet } from "./schemas";
import { HTTP_APP } from "./http_app";
import SPOTIFY from "./spotify";

console.log("==== Spicofy host service ====\n");

let ENV: EnvFile;
{
	let parsedRes = envFile.safeParse(process.env);
	if (parsedRes.error) {
		console.log("Invalid Env File: ", parsedRes.error.message);
		process.exit();
	}
	ENV = parsedRes.data;
}
type PortInfo = Awaited<ReturnType<typeof SerialPort.list>>[number];

async function getPort(tryIndex = 1): Promise<null | PortInfo> {
	const ports = samplePortResponse;//await SerialPort.list();
	const numPorts = ports.length;

	if (!numPorts) {
		console.log("Found no serial ports!");

		if (tryIndex >= ENV.maxPortSearchTries) {
			throw Error("No Serial Ports found");
		}

		console.log(`Retying in ${ENV.portSearchPollTimeMS} ms`);
		const timedPromise = new Promise((resolve) => {
			setTimeout(() => {
				resolve(getPort(tryIndex + 1));
			}, ENV.portSearchPollTimeMS);
		});

		return await timedPromise as null | PortInfo;
	}

	console.log(`Found ${numPorts} serial port${numPorts > 1 ? 's' : ''}.`);

	if (numPorts > 1) {
		console.log("Multiple serial ports found!");
		const selection = await choiceSelect(ports);

		if (selection.cancelled) {
			return null;
		} else {
			return selection.choiceData as PortInfo;
		}
	}

	return ports[0] as PortInfo;
}

async function main() {
	const app = new HTTP_APP(ENV);
	app.onCodeRecived = async (code) => {
		await SPOTIFY.getInitialAuthToken(code, ENV);
	};

	console.log("Scanning for serial ports...");

	let portGetErr = null;
	const portinf = await getPort().catch((err) => {
		portGetErr = err;
	});

	if (!portinf) {
		console.log("Error: Could not get serial port");
		if (portGetErr) {
			console.log("Exit Reason:", portGetErr);
		}
		//process.exit();
		return;
	}

	console.log("Connecting to ", portinf);

	const port = new SerialPort({
		path: portinf.path,
		baudRate: 115200
	});

	const sendToMCU = (label: string, data: Record<string, any>) => {
		if (!port.writable) {
			console.log("[HOST] DATA LOSS: PORT NOT WRITABLE!");
			return;
		}
		const packet = [label, data] satisfies Packet;
		console.log("[HOST]:", packet);
		port.write(JSON.stringify(packet));
	}

	port.on("data", (d) => {
		const rawmsg = d.toString().trim();
		let msg: Packet | null = null;
		try {
			const parsed = packet.safeParse(JSON.parse(rawmsg));
			if(parsed.error) {
				throw parsed.error;
			}
			msg = parsed.data;
		} catch (e) {
			console.log("[MCU PARSE ERROR!]", rawmsg);
			return;
		}

		switch(msg[0]) {
			default:
				console.log("[MCU]:", msg);

			case "ping":
				console.log("[MCU] Connected!\n");
				console.log("Please complete your Spotify Authentication");
				console.log("by going to the following link:");
				console.log("http://127.0.0.1:8192/authorize\n");
				app.allowAuthFlow = true;
				break;
		}
	});

	port.on("close", () => {
		console.log("[CONNECTION CLOSED]");
		process.exit();
	});
}

main();