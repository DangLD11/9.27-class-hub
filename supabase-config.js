// Supabase public configuration for the 9.27 Class Hub.
// Publishable/anon keys are safe to expose in frontend code when RLS is configured correctly.
const SUPABASE_URL = "https://khqqyaljgaoqtgaihbid.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_odRg_QIv5-2cHWwioVQbvg_rBCT43DD";

window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
