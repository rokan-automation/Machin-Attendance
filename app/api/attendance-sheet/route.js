// app/api/attendance-sheet/route.js
//
// ক্লাসভিত্তিক হাজিরা সিট।
// ব্যবহার: GET /api/attendance-sheet?class=Five&date=2026-09-27
//
// এই রুটটা যা করে:
// ১) ওই ক্লাসের সব ছাত্রের তালিকা আনে (roll অনুযায়ী সাজানো)
// ২) ওই নির্দিষ্ট তারিখে কারা কারা attendances টেবিলে "present"
//    হিসেবে সেভ আছে সেটা আনে
// ৩) দুটো মিলিয়ে প্রতিটা ছাত্রের পাশে present/absent বসিয়ে
//    একটা সম্পূর্ণ হাজিরা সিট বানিয়ে ফেরত দেয়
//
// যে ছাত্রের সেদিনের attendances-এ কোনো রেকর্ড নেই, তাকে
// স্বয়ংক্রিয়ভাবে "absent" ধরা হচ্ছে।

import { supabaseAdmin } from "@/lib/supabaseClient";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const className = searchParams.get("class");
  const date = searchParams.get("date");

  if (!className || !date) {
    return Response.json(
      { success: false, message: "class এবং date — দুটোই আবশ্যক (যেমন ?class=Five&date=2026-09-27)।" },
      { status: 400 }
    );
  }

  // ১) ওই ক্লাসের সব ছাত্র আনা
  const { data: students, error: studentsError } = await supabaseAdmin
    .from("students")
    .select("id, name, roll, class, device_user_id")
    .eq("class", className)
    .order("roll", { ascending: true });

  if (studentsError) {
    console.error("[attendance-sheet GET] ছাত্র তালিকা আনতে সমস্যা:", studentsError);
    return Response.json(
      { success: false, message: "ছাত্র তালিকা আনতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }

  if (!students || students.length === 0) {
    return Response.json({
      success: true,
      class: className,
      date,
      sheet: [],
      summary: { total: 0, present: 0, absent: 0 },
    });
  }

  // ২) ওই তারিখের attendances রেকর্ড আনা (শুধু এই ছাত্রদের জন্য)
  const studentIds = students.map((s) => s.id);

  const { data: attendanceRecords, error: attendanceError } = await supabaseAdmin
    .from("attendances")
    .select("student_id, punch_time, status")
    .eq("date", date)
    .in("student_id", studentIds);

  if (attendanceError) {
    console.error("[attendance-sheet GET] হাজিরা রেকর্ড আনতে সমস্যা:", attendanceError);
    return Response.json(
      { success: false, message: "হাজিরা রেকর্ড আনতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }

  // দ্রুত খোঁজার জন্য student_id -> attendance রেকর্ড ম্যাপ বানানো
  const attendanceMap = new Map();
  for (const record of attendanceRecords) {
    attendanceMap.set(record.student_id, record);
  }

  // ৩) প্রতিটা ছাত্রের সাথে তার হাজিরা স্ট্যাটাস মিলিয়ে সিট বানানো
  const sheet = students.map((student) => {
    const record = attendanceMap.get(student.id);
    return {
      student_id: student.id,
      name: student.name,
      roll: student.roll,
      class: student.class,
      status: record ? record.status : "absent",
      punch_time: record ? record.punch_time : null,
    };
  });

  const presentCount = sheet.filter((row) => row.status === "present").length;

  return Response.json({
    success: true,
    class: className,
    date,
    sheet,
    summary: {
      total: sheet.length,
      present: presentCount,
      absent: sheet.length - presentCount,
    },
  });
}