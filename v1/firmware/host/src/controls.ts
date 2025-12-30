import { KeyName, Packet, playbackStateResponse, SendToMCUFn } from "./schemas";
import { SpotifyAPI } from "./spotify";

export class ControlsManager {
	_volumeHist = 0;
	sendToMCU: SendToMCUFn | undefined;

	spotify = new SpotifyAPI();
	volume = 0;
	isPlaying = false;
	isMuted = false;
	playbackState: playbackStateResponse | null;
	lastUpdateSent = -1;

	bindToMCU = (sendToMCU: SendToMCUFn) => {
		this.sendToMCU = sendToMCU;
	}

	constructor() {
		this.playbackState = null;
		setInterval(this.sendUpdateToMCU, 1e3);
	}

	updateState = async() => {
		this.playbackState = await this.spotify.getPlayerState();
	}

	sendUpdateToMCU = async () => {
		if (!this.sendToMCU) return;

		let delta = 0;
		const now = Date.now();
		if(this.lastUpdateSent < 0) {
			this.lastUpdateSent = now;
		} else {
			delta = now - this.lastUpdateSent;
		}

		const playerState = this.playbackState;
		if(!playerState) return;

		playerState.progress_ms += delta;
		if(playerState.progress_ms > playerState.item.duration_ms) {
			playerState.progress_ms = playerState.item.duration_ms;
			setTimeout(this.updateState, 250);
		}

		this.sendToMCU("state", [
			playerState.item.name,
			playerState.item.artists ? (
				playerState.item.artists.map(e => e.name).join(", ")
			) : "",
			playerState.progress_ms,
			playerState.item.duration_ms
		]);

		this.lastUpdateSent = now;
	}

	keyDown = (key: KeyName) => {
		console.log("[CONTROLS] KEY PRESS: " + key);
		switch (key) {

			case 'MUTE':
				this.isMuted = !this.isMuted;
				if (this.isMuted) {
					this._volumeHist = this.volume;
					this.volume = 0;
				} else {
					this.volume = this._volumeHist;
				}
				this.spotify.setPlayerVolume(this.volume);
				break;

			case 'NEXT':
				this.spotify.skipToNext();
				break;

			case 'PREVIOUS':
				this.spotify.skipToPrevious();
				break;

			case 'TOGGLE':
				this.isPlaying = !this.isPlaying;
				if (this.isPlaying) {
					this.spotify.resumePlayer();
				} else {
					this.spotify.pausePlayer();
				}
				break;

			case 'MISC':
				break;

		}

		setTimeout(this.updateState, 250);
	}

	volumeUpdate = (action: 'increase' | 'decrease') => {
		if (action === 'increase') {
			console.log("[CONTROL] VOLUME: +1");
			this.volume += 1;
			if (this.volume > 100) this.volume = 100;
		} else {
			console.log("[CONTROL] VOLUME: -1");
			this.volume -= 1;
			if (this.volume < 0) this.volume = 0;
		}
		this.spotify.setPlayerVolume(this.volume);
	}
}