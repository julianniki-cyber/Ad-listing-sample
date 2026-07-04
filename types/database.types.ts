// Placeholder for Supabase-generated types.
//
// Once your Supabase project is set up (see SETUP.md), regenerate this file with:
//
//   npx supabase gen types typescript --project-id <your-project-ref> > types/database.types.ts
//
// The app currently relies on the hand-written types in types/index.ts, which mirror
// supabase/schema.sql. Regenerating this file is optional but recommended once your
// schema stabilizes, since it keeps types automatically in sync with the database.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
