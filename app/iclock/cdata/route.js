// app/api/iclock/cdata/route.js
//
// ZKTeco ADMS (Push প্রোটোকল) এন্ডপয়েন্ট।
// মেশিনের ডিভাইস কনফিগে "Server Address" হিসেবে আপনার ডোমেইন
// আর "ADMS পাথ" হিসেবে /iclock/cdata বসাতে হবে, যেমন:
//
//     https://your-app.vercel.app/iclock/cdata   <-- ZKTeco default path
//
// কিন্তু যেহেতু Next.js App Router-এ আমরা এই ফাইলটা রেখেছি
// app/api/iclock/cdata/route.js -এ, তাই আসল URL হবে:
//
//     https://your-app.vercel.app/api/iclock/cdata
//
// মেশিনের সেটিংসে ঠিক এই পাথটাই বসাবেন (অনেক ZKTeco মডেলে
// "Server URL" ফিল্ডে পুরো পাথ নিজে বসানো যায়)।
//
// ZKTeco ADMS প্রোটোকলে দুই ধরনের রিকোয়েস্ট আসে:
//
//   1) GET  /iclock/cdata?SN=xxxx&options=all...
//      -> মেশিন চালু হওয়ার সময় বা পিরিয়ডিক্যালি হ্যান্ডশেক/কনফিগ
//         চাওয়ার জন্য পাঠায়। সার্ভারকে টেক্সট রেসপন্স দিতে হয়
//         (যেমন "OK" বা কনফিগ স্ট্রিং)।
//
//   2) POST /iclock/cdata?SN=xxxx&table=ATTLOG&Stamp=xxxx
//      -> আসল অ্যাটেনডেন্স ডাটা (পাঞ্চ লগ) পাঠায়, বডি প্লেইন-টেক্সট,
//         প্রতি লাইনে একটা পাঞ্চ রেকর্ড, ট্যাব (\t) দিয়ে আলাদা করা:
//
//         {PIN}\t{TIME}\t{STATUS}\t{VERIFY}\t{WORKCODE}\t...
//
//         উদাহরণ:
//         3\t2025-09-26 08:32:10\t0\t1\t0\t0\t0
//
//         এখানে PIN = device_user_id, TIME = পাঞ্চের সময়।
//
// দুই ক্ষেত্রেই মেশিনকে প্লেইন টেক্সট "OK" রেসপন্স দিতে হয় (JSON না),
// নাহলে মেশিন ধরে নেয় ডাটা পৌঁছায়নি এবং বারবার রিট্রাই করতে থাকে।

import { supabaseAdmin } from "@/lib/supabaseClient";

// -----------------------------------------------------------
// GET হ্যান্ডলার: মেশিনের প্রাথমিক হ্যান্ডশেক/কনফিগ রিকোয়েস্ট
// -----------------------------------------------------------
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const serialNumber = searchParams.get("SN") || "unknown-device";

  console.log(`[ZKTeco GET] হ্যান্ডশেক রিকোয়েস্ট এসেছে, ডিভাইস SN: ${serialNumber}`);

  return new Response("OK", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

// -----------------------------------------------------------
// POST হ্যান্ডলার: আসল অ্যাটেনডেন্স (পাঞ্চ) ডাটা রিসিভ করা
// -----------------------------------------------------------
export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get("table");
    const serialNumber = searchParams.get("SN") || "unknown-device";

    const rawBody = await request.text();

    console.log(
      `[ZKTeco POST] SN=${serialNumber}, table=${table}, body length=${rawBody.length}`
    );

    if (!rawBody || !rawBody.trim()) {
      return new Response("OK", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    if (table && table.toUpperCase() !== "ATTLOG") {
      console.log(`[ZKTeco POST] table=${table} — এই টেবিলের ডাটা প্রসেস করা হচ্ছে না, শুধু OK পাঠানো হলো।`);
      return new Response("OK", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const lines = rawBody
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    let processedCount = 0;
    let skippedCount = 0;

    for (const line of lines) {
      const columns = line.split("\t");

      if (columns.length < 2) {
        console.warn(`[ZKTeco POST] অস্বাভাবিক লাইন (কলাম কম), স্কিপ করা হলো: "${line}"`);
        skippedCount++;
        continue;
      }

      const devicePin = columns[0].trim();
      const punchTimeRaw = columns[1].trim();

      const isoLikeString = punchTimeRaw.replace(" ", "T");
      const punchDate = new Date(isoLikeString);

      if (isNaN(punchDate.getTime())) {
        console.warn(`[ZKTeco POST] সময় পার্স করা যায়নি, স্কিপ করা হলো: "${punchTimeRaw}"`);
        skippedCount++;
        continue;
      }

      const dateOnly = isoLikeString.split("T")[0];

      const { data: student, error: studentError } = await supabaseAdmin
        .from("students")
        .select("id, name, guardian_phone")
        .eq("device_user_id", devicePin)
        .maybeSingle();

      if (studentError) {
        console.error(`[ZKTeco POST] students টেবিল থেকে খুঁজতে সমস্যা:`, studentError);
        skippedCount++;
        continue;
      }

      if (!student) {
        console.warn(`[ZKTeco POST] device_user_id="${devicePin}" এর জন্য কোনো ছাত্র পাওয়া যায়নি।`);
        skippedCount++;
        continue;
      }

      const { error: attendanceError } = await supabaseAdmin
        .from("attendances")
        .upsert(
          {
            student_id: student.id,
            punch_time: punchDate.toISOString(),
            date: dateOnly,
            status: "present",
          },
          {
            onConflict: "student_id,date",
            ignoreDuplicates: true,
          }
        );

      if (attendanceError) {
        console.error(
          `[ZKTeco POST] attendances সেভ করতে সমস্যা (student_id=${student.id}):`,
          attendanceError
        );
        skippedCount++;
        continue;
      }

      processedCount++;
      console.log(
        `[ZKTeco POST] হাজিরা সেভ হয়েছে: ${student.name} (${dateOnly} ${punchTimeRaw})`
      );
    }

    console.log(
      `[ZKTeco POST] সারমর্ম: মোট লাইন=${lines.length}, প্রসেসড=${processedCount}, স্কিপড=${skippedCount}`
    );

    return new Response("OK", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("[ZKTeco POST] অপ্রত্যাশিত এরর:", error);

    return new Response("ERROR", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}