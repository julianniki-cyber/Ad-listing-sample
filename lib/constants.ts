export const MAX_IMAGES_PER_LISTING = 6;
export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const LISTING_TITLE_MIN = 3;
export const LISTING_TITLE_MAX = 120;
export const LISTING_DESCRIPTION_MIN = 10;
export const LISTING_DESCRIPTION_MAX = 5000;

export const LISTINGS_PAGE_SIZE = 24;

export const LISTING_IMAGES_BUCKET = "listing-images";

export const AADHAAR_DOCS_BUCKET = "seller-documents";

export const NEED_HEADLINE_MIN = 3;
export const NEED_HEADLINE_MAX = 120;
export const NEED_DESCRIPTION_MIN = 10;
export const NEED_DESCRIPTION_MAX = 3000;
export const BID_MESSAGE_MAX = 1000;
export const REVIEW_COMMENT_MAX = 1000;

export const NEED_POSTS_PAGE_SIZE = 20;

// Must stay in sync with the `v_cost` constant inside the reveal_bids()
// Postgres function in supabase/schema.sql — this value is display-only.
export const REVEAL_COST_CREDITS = 5;
