import { z } from "zod";

/**
 * POST /nearby
 */
export const nearbySchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type NearbyInput = z.infer<typeof nearbySchema>;
