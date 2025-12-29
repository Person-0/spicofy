import * as z from "zod";

export const envFile = z.object({
	clientId: z.coerce.string().min(1),
	clientSecret: z.coerce.string().min(1),
	redirectURI: z.string().startsWith("http"),
	maxPortSearchTries: z.coerce.number().int().min(1),
	portSearchPollTimeMS: z.coerce.number().int().min(1),
});
export type EnvFile = z.infer<typeof envFile>;

export const packet = z.tuple([
	z.string().min(1),
	z.record(z.string(), z.any())
]);
export type Packet = z.infer<typeof packet>;

export const callbackRequestData = z.object({
	code: z.string().min(1),
	state: z.string().optional().nullable()
});

export const erroredRequestInfo = z.object({
	error: z.object({
		status: z.number().int(),
		message: z.string()
	})
});

export const authTokenRequest = z.object({
	access_token: z.string(),
	token_type:	z.string(),
	scope: z.string(),
	expires_in: z.number().int(),
	refresh_token: z.string().optional().nullable(),
});
export type AuthTokenResponse = z.infer<typeof authTokenRequest>;