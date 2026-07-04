import { z } from "zod";
import {
  LISTING_DESCRIPTION_MAX,
  LISTING_DESCRIPTION_MIN,
  LISTING_TITLE_MAX,
  LISTING_TITLE_MIN,
} from "./constants";

export const listingSchema = z.object({
  title: z.string().trim().min(LISTING_TITLE_MIN).max(LISTING_TITLE_MAX),
  description: z
    .string()
    .trim()
    .min(LISTING_DESCRIPTION_MIN)
    .max(LISTING_DESCRIPTION_MAX),
  price: z.coerce.number().min(0),
  categoryId: z.string().uuid(),
  locationCity: z.string().trim().min(1).max(100),
  locationState: z.string().trim().max(100).optional().or(z.literal("")),
});

export type ListingInput = z.infer<typeof listingSchema>;

export const profileSchema = z.object({
  fullName: z.string().trim().min(1).max(100),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const authSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6).max(72),
});

export type AuthInput = z.infer<typeof authSchema>;
