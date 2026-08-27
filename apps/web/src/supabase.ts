import { createClient, type Session } from "@supabase/supabase-js";

export type Profile = { display_name: string | null; currency_code: string; locale: string; time_zone: string };
const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase = url && publishableKey ? createClient(url, publishableKey) : null;
export function getInitials(session: Session | null, profile: Profile | null): string {
  return (profile?.display_name || session?.user.email || "T").slice(0, 1).toUpperCase();
}
