import { KeyName, SendToMCUFn } from "./schemas";
import { SpotifyAPI } from "./spotify";

export class ControlsManager {
	_volumeHist = 0;
	sendToMCU: SendToMCUFn | undefined;

	spotify = new SpotifyAPI();
	volume = 0;
	isPlaying = false;
	isMuted = false;

	bindToMCU = (sendToMCU: SendToMCUFn) => {
		this.sendToMCU = sendToMCU;
	}

	update = async () => {
		if(!this.sendToMCU) {
			return;
		}
		
		const playerState = await this.spotify.getPlayerState();
		if(!playerState) {
			this.sendToMCU("state", {});
			return;
		}


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

		setTimeout(this.update, 150);
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