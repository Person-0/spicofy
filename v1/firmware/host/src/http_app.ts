import { randomUUID } from "crypto";
import express from "express";
import { callbackRequestData, EnvFile } from "./schemas";

const HTTP_PORT = 8192;
const randomString = (len: number) => {
	let str = "";
	while (str.length < len) {
		const gen = randomUUID().replaceAll("-", "");
		str += gen.slice(0, len - str.length);
	}
	return str;
}

export class HTTP_APP {
	app = express();
	allowAuthFlow = false;
	onCodeReceived: null | ((code: string) => void) = null;

	constructor(ENV: EnvFile) {
		this.app.use(express.json());

		this.app.get("/", (req, res) => {
			res.send({
				allowAuthFlow: this.allowAuthFlow
			});
		});

		// returns true if res.send was called
		const ensureAuthFlowAllowed = (res: express.Response) => {
			if (!this.allowAuthFlow) {
				res.send({
					error: true,
					message: "auth flow not enabled yet"
				});
				return true;
			}
			return false;
		}

		this.app.get("/authorize", (req, res) => {
			if (ensureAuthFlowAllowed(res)) return;

			const scopes = [
				'user-read-playback-state',
				'user-modify-playback-state',
				'user-read-currently-playing'
			];

			const params = new URLSearchParams({
				response_type: 'code',
				client_id: ENV.clientId,
				scope: scopes.join(" "),
				redirect_uri: ENV.redirectURI,
				state: randomString(16)
			});

			res.redirect(
				'https://accounts.spotify.com/authorize?' +
				params.toString()
			);
		});

		this.app.get("/callback", (req, res) => {
			if (ensureAuthFlowAllowed(res)) return;

			const parsed = callbackRequestData.safeParse(req.query);
			if (parsed.error) {
				res.send({
					error: true,
					message: "Invalid URL Search params"
				});
				return;
			}

			if (this.onCodeReceived) {
				res.send({
					error: false
				});

				this.onCodeReceived(parsed.data.code);
			} else {
				res.send({
					error: true,
					message: "onCodeReceived handler unset"
				});
			}
		});
	}

	start = () => {
		this.app.listen(HTTP_PORT, () => {
			console.log(
				`[HTTP INFO] http_app listening on 127.0.0.1:${HTTP_PORT}`
			);
		})
	}
}