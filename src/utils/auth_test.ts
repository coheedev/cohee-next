import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();
const supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon_key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const auth_test = async () => {
  // supabase_url이 없으면 콘솔에서 에러 띄우고 종료하기
  if (!supabase_url) {
    console.error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
    process.exit(1);
  }

  if (!anon_key) {
    console.error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabase_url, anon_key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await supabase.auth.signUp({
    email: "cohee.ai@gmail.com",
    password: "tkwhckacl123",
  });
  console.log(data, error);

  if (error) {
    console.error("Error signing up:", error.message);
  } else {
    console.log("Sign up successful:", data);
  }
};
