import * as z from "zod";

export const envFile = z.object({
    clientId: z.coerce.string().min(1),
    maxPortSearchTries: z.coerce.number().int().min(1),
    portSearchPollTimeMS: z.coerce.number().int().min(1),
});
export type EnvFile = z.infer<typeof envFile>;