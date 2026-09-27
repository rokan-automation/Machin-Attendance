// app/api/students/route.js
//
// এই রুটটা আপনার নিজের অ্যাডমিন ড্যাশবোর্ডের জন্য।
// GET  -> সব ছাত্রের তালিকা ফেরত দেয়
// POST -> নতুন ছাত্র যোগ করে (ফর্ম থেকে সাবমিট হওয়া ডাটা)

import { supabaseAdmin } from "@/lib/supabaseClient";

// -----------------------------------------------------------
// GET: সব ছাত্রের তালিকা
// -----------------------------------------------------------
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("students")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[students GET] ছাত্র তালিকা আনতে সমস্যা:", error);
    return Response.json(
      { success: false, message: "ছাত্র তালিকা আনতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }

  return Response.json({ success: true, students: data });
}

// -----------------------------------------------------------
// POST: নতুন ছাত্র যোগ করা (ফর্ম থেকে)
// -----------------------------------------------------------
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, roll, class: studentClass, device_user_id, guardian_phone } = body;

    // ন্যূনতম যাচাই — নাম আর device_user_id ছাড়া ছাত্র যোগ করা যাবে না
    if (!name || !device_user_id) {
      return Response.json(
        { success: false, message: "নাম এবং device_user_id (মেশিনের ID) আবশ্যক।" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("students")
      .insert({
        name,
        roll: roll || null,
        class: studentClass || null,
        device_user_id: String(device_user_id),
        guardian_phone: guardian_phone || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[students POST] ছাত্র যোগ করতে সমস্যা:", error);

      // device_user_id ডুপ্লিকেট হলে বিশেষ মেসেজ
      if (error.code === "23505") {
        return Response.json(
          { success: false, message: "এই device_user_id দিয়ে ইতিমধ্যে একজন ছাত্র আছে।" },
          { status: 409 }
        );
      }

      return Response.json(
        { success: false, message: "ছাত্র যোগ করতে সমস্যা হয়েছে।" },
        { status: 500 }
      );
    }

    return Response.json({ success: true, student: data });
  } catch (error) {
    console.error("[students POST] অপ্রত্যাশিত এরর:", error);
    return Response.json(
      { success: false, message: "সার্ভারে অপ্রত্যাশিত সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}