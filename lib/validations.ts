import { z } from "zod";
import {
  BID_MESSAGE_MAX,
  LISTING_DESCRIPTION_MAX,
  LISTING_DESCRIPTION_MIN,
  LISTING_TITLE_MAX,
  LISTING_TITLE_MIN,
  NEED_DESCRIPTION_MAX,
  NEED_DESCRIPTION_MIN,
  NEED_HEADLINE_MAX,
  NEED_HEADLINE_MIN,
  REVIEW_COMMENT_MAX,
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

// Phone + OTP (primary auth going forward — see components/auth/PhoneOtpFields.tsx).
// authSchema above is kept for the legacy "log in with email instead" bridge.
const phoneNumber = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{7,14}$/, "Enter a valid phone number with country code");

export const phoneSchema = z.object({ phone: phoneNumber });
export type PhoneInput = z.infer<typeof phoneSchema>;

export const otpSchema = z.object({
  token: z.string().trim().length(6, "Enter the 6-digit code"),
});
export type OtpInput = z.infer<typeof otpSchema>;

export const buyerSignupSchema = z.object({
  role: z.literal("buyer"),
  fullName: z.string().trim().min(1).max(100),
  email: z.string().trim().email(),
});

export const sellerSignupSchema = z.object({
  role: z.literal("seller"),
  fullName: z.string().trim().min(1).max(100),
  email: z.string().trim().email(),
  whatsappNumber: phoneNumber,
  businessName: z.string().trim().min(1).max(150),
});

export const completeProfileSchema = z.discriminatedUnion("role", [
  buyerSignupSchema,
  sellerSignupSchema,
]);
export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;

export const needPostSchema = z.object({
  headline: z.string().trim().min(NEED_HEADLINE_MIN).max(NEED_HEADLINE_MAX),
  description: z.string().trim().min(NEED_DESCRIPTION_MIN).max(NEED_DESCRIPTION_MAX),
  categoryId: z.string().uuid(),
  budget: z.coerce.number().min(0).optional().or(z.literal("")),
  locationCity: z.string().trim().min(1).max(100),
});
export type NeedPostInput = z.infer<typeof needPostSchema>;

export const bidSchema = z.object({
  amount: z.coerce.number().min(0),
  message: z.string().trim().max(BID_MESSAGE_MAX).optional().or(z.literal("")),
});
export type BidInput = z.infer<typeof bidSchema>;

export const reviewSchema = z.object({
  isPositive: z.boolean(),
  comment: z.string().trim().max(REVIEW_COMMENT_MAX).optional().or(z.literal("")),
});
export type ReviewInput = z.infer<typeof reviewSchema>;
