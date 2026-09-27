// lib/supabaseClient.js
//
// এই ফাইলে দুইটা আলাদা ক্লায়েন্ট এক্সপোর্ট করা হচ্ছে:
//
// 1) supabase          -> anon key দিয়ে, ব্রাউজার/ফ্রন্টএন্ড থেকে
//                          ব্যবহারের জন্য (RLS মেনে চলে)।
// 2) supabaseAdmin      -> service_role key দিয়ে, শুধু সার্ভার-সাইড
//                          কোডে (API routes) ব্যবহারের জন্য। এটা RLS
//                          বাইপাস করে, তাই এটা কখনো ক্লায়েন্ট/ব্রাউজার
//                          কোডে import করবেন না।
//
// ZKTeco মেশিনের ADMS রুট (app/api/iclock/cdata/route.js) সবসময়
// supabaseAdmin ব্যবহার করবে, কারণ মেশিন কোনো ইউজার লগইন ছাড়াই
// ডাটা পাঠায়, তাই RLS-এর নিয়ম এখানে কাজ করবে না।

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL environment variable টা সেট করা নেই। .env.local ফাইলে যোগ করুন।"
  );
}

// --- ফ্রন্টএন্ড / সাধারণ ব্যবহারের জন্য (anon key, RLS মানবে) ---
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- সার্ভার-সাইড অ্যাডমিন ক্লায়েন্ট (service_role key, RLS বাইপাস) ---
// শুধুমাত্র app/api/... এর মতো সার্ভার-সাইড ফাইলে ব্যবহার করুন।
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;