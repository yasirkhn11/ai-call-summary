// Load environment variables first
import dotenv from "dotenv";
dotenv.config(); // MUST be at the very top

import { createClient } from "@supabase/supabase-js";

// Read env variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Throw clear error if missing
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Supabase URL or KEY is missing! Check your .env file."
  );
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
