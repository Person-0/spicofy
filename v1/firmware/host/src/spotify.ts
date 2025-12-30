import {
	authTokenRequest,
	AuthTokenResponse,
	EnvFile,
	erroredRequestInfo,
	playbackStateRequest,
	playbackStateResponse
} from "./schemas";

export class SpotifyAPI {
	TOKEN: null | string = null;
	refreshToken: null | string = null;
	normalAuthString: string | null = null;
	authed = false;

	fetch = async (
		method: 'GET' | 'PUT' | 'POST',
		url: string,
		auth: boolean = false,
		body: null | {} = null,
		bodyType: 'application/json' | 'application/x-www-form-urlencoded'
			= 'application/json',
		headers: Record<string, string> = {},
		isText = false,
		retryIndex = 0
	): Promise<{ [recordName: string]: any } | String> => {

		const options: RequestInit = { method };

		if (this.TOKEN && auth) {
			headers['Authorization'] = 'Bearer ' + this.TOKEN;
		}

		if ((['PUT', 'POST'].includes(method)) && body) {
			if (bodyType === 'application/json') {
				options.body = JSON.stringify(body);
			} else if (bodyType === 'application/x-www-form-urlencoded') {
				options.body = new URLSearchParams(body);
			}
			headers['Content-Type'] = bodyType;
		}

		options.headers = headers;

		const fres = await fetch(url, options);
		let response;
		if (isText) {
			response = await fres.text() as String;
		} else {
			response = await fres.json() as {};
		}

		const errorParse = erroredRequestInfo.safeParse(response);
		if (errorParse.success) {
			const data = errorParse.data;

			console.log("[SPOTIFY] FETCH FAILED: ", data.error.message);

			if (retryIndex < 1 && data.error.status === 401) {
				console.log(
					"[SPOTIFY] Invalid access token, trying to refresh"
				);
				this.authed = false;
				await this.refreshAuthToken();
				return this.fetch(
					method,
					url,
					auth,
					body,
					bodyType,
					headers,
					isText,
					retryIndex + 1
				);
			} else {
				throw Error(errorParse.data.error.message);
			}
		}

		return response;
	}


	_authTokenRequest = async (requestBody: {}) => {
		if (!this.normalAuthString) {
			throw Error("_authTokenRequest() called without normalAuthString!");
		}

		let isError = false;
		const res = await this.fetch(
			'POST',
			'https://accounts.spotify.com/api/token',
			false,
			requestBody,
			'application/x-www-form-urlencoded',
			{
				'Authorization': this.normalAuthString
			}
		).catch(e => {
			isError = true;
			console.log("[SPOTIFY] Failed to get Access Token:", e);
		});

		if (isError) return null;

		const parsed = authTokenRequest.safeParse(res);
		if (parsed.error) {
			console.log(
				"[SPOTIFY] Failed to get Access Token:", parsed.error.message
			);
			return null;
		}

		return parsed.data;
	}

	getInitialAuthToken = async (code: string, ENV: EnvFile) => {

		this.normalAuthString = 'Basic ' + Buffer
			.from(ENV.clientId + ":" + ENV.clientSecret)
			.toString('base64');

		const data = await this._authTokenRequest({
			code,
			redirect_uri: ENV.redirectURI,
			grant_type: 'authorization_code',
		});

		if (!data) {
			console.log("Could not get initial auth token!");
			return;
		}

		this.onAuthTokenResponse(data);
	}

	refreshAuthToken = async () => {
		if (!this.refreshToken) {
			throw Error("refreshAuthToken() called without refreshToken!");
		} else if (!this.normalAuthString) {
			throw Error("refreshAuthToken() called without normalAuthString!");
		}

		const data = await this._authTokenRequest({
			grant_type: 'refresh_token',
			refresh_token: this.refreshToken
		});

		if (!data) {
			console.log("Could not refresh auth token!");
			return;
		}

		await this.onAuthTokenResponse(data);
	}

	onAuthTokenResponse = async (data: AuthTokenResponse) => {
		this.TOKEN = data.access_token;
		this.authed = true;
		console.log("[SPOTIFY] Auth Token saved!");

		if (data.refresh_token) {
			this.refreshToken = data.refresh_token;
			console.log("[SPOTIFY] Refresh Token saved!");
		}

		setTimeout(this.refreshAuthToken, data.expires_in * 1000);
	}

	getPlayerState = async (): Promise<null | playbackStateResponse> => {
		let isError = false;
		const response = await this.fetch(
			"GET",
			"https://api.spotify.com/v1/me/player",
			true
		).catch(e => {
			isError = true;
			console.log("[SPOTIFY] Failed to get player state:", e);
		});
		if (isError) return null;
		const parsed = playbackStateRequest.safeParse(response);
		if (parsed.error) {
			console.log(
				"[SPOTIFY] Failed to get player state:",
				parsed.error.message
			);
			return null;
		}
		return parsed.data;
	}

	authedPutRequests = async (reqName: string, url: string, body?: {}) => {
		if (!this.authed) {
			console.log(`[SPOTIFY] ${reqName}() called without auth`);
			return;
		}
		await this.fetch(
			"PUT",
			url,
			true,
			body,
			body ? 'application/json' : undefined,
			{},
			true
		).catch(e => {
			console.log(`[SPOTIFY] ${reqName}() called without auth`, e);
		});
	}

	resumePlayer = () => this.authedPutRequests(
		'resumePlayer',
		'https://api.spotify.com/v1/me/player/play',
		{
			position_ms: 0
		}
	)

	pausePlayer = () => this.authedPutRequests(
		'pausePlayer',
		'https://api.spotify.com/v1/me/player/pause'
	)

	skipToPrevious = () => this.authedPutRequests(
		'skipToPrevious',
		'https://api.spotify.com/v1/me/player/previous'
	)

	skipToNext = () => this.authedPutRequests(
		'skipToNext',
		'https://api.spotify.com/v1/me/player/next'
	)

	setPlayerVolume = (_volume: number) => {
		if (_volume < 0 || _volume > 100) {
			console.log(
				"[SPOTIFY] setPlayerVolume() called with invalid volume"
			);
			return;
		}
		const volume = Math.floor(_volume).toString();
		return this.authedPutRequests(
			'setPlayerVolume',
			'https://api.spotify.com/v1/me/player/volume?volume_percent=' +
			volume
		);
	}
}