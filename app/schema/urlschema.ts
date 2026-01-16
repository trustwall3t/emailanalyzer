import { z } from 'zod';

export const ExtractRequestSchema = z.object({
	url: z.string().url('Invalid URL'),
});
