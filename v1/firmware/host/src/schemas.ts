import * as z from "zod";

// env

export const envFile = z.object({
	clientId: z.coerce.string().min(1),
	clientSecret: z.coerce.string().min(1),
	redirectURI: z.string().startsWith("http"),
	maxPortSearchTries: z.coerce.number().int().min(1),
	portSearchPollTimeMS: z.coerce.number().int().min(1),
});
export type EnvFile = z.infer<typeof envFile>;

// serial

export const packet = z.tuple([
	z.string().min(1),
	z.any()
]);
export type Packet = z.infer<typeof packet>;

export const keyNames = z.union([
	z.literal("MUTE"),
	z.literal("PREVIOUS"),
	z.literal("TOGGLE"),
	z.literal("NEXT"),
	z.literal("MISC")
]);
export type KeyName = z.infer<typeof keyNames>;

// http app

export const callbackRequestData = z.object({
	code: z.string().min(1),
	state: z.string().optional().nullable()
});

// spotify api

export const erroredRequestInfo = z.object({
	error: z.object({
		status: z.number().int(),
		message: z.string()
	})
});

export const authTokenRequest = z.object({
	access_token: z.string(),
	token_type: z.string(),
	scope: z.string(),
	expires_in: z.number().int(),
	refresh_token: z.string().optional().nullable(),
});
export type AuthTokenResponse = z.infer<typeof authTokenRequest>;

const artist = z.object({
	name: z.string()
});
const album = z.object({
	name: z.string(),
	artists: z.array(artist),
	images: z.array(z.object({
		url: z.string(),
		height: z.number().int(),
		width: z.number().int()
	}))
});
export const playbackStateRequest = z.object({
	currently_playing_type: z.union([
		z.literal("track"),
		z.literal("episode"),
		z.literal("ad"),
		z.literal("unknown")
	]),
	is_playing: z.boolean(),
	progress_ms: z.number().int(),
	item: z.object({
		duration_ms: z.number().int(),
		name: z.string(),
		artists: z.array(artist).optional(),
		album: album.optional()
	}),
	actions: z.object({
		interrupting_playback: z.boolean().optional(),
		pausing: z.boolean().optional(),
		resuming: z.boolean().optional(),
		seeking: z.boolean().optional(),
		skipping_next: z.boolean().optional(),
		skipping_prev: z.boolean().optional(),
		toggling_repeat_context: z.boolean().optional(),
		toggling_shuffle: z.boolean().optional(),
		toggling_repeat_track: z.boolean().optional(),
		transferring_playback: z.boolean().optional()
	})
});
export type playbackStateResponse = z.infer<typeof playbackStateRequest>;