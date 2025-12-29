import { SerialPort } from "serialport";
import { choiceSelect, samplePortResponse } from "./misc";
import { envFile, EnvFile } from "./schemas";

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
	console.log("Scanning for serial ports...");

	let portGetErr = null;
	const port = await getPort().catch((err) => {
		portGetErr = err;
	});

	if (!port) {
		console.log("Error: Could not get serial port");
		if (portGetErr) {
			console.log("Exit Reason:", portGetErr);
		}
		process.exit();
	}

	console.log("selection:", port);
}

main();