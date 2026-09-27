// app/page.js
//
// এটাই এখন হোমপেজ (localhost:3000) — এখান থেকে পুরো
// অ্যাপের প্রধান অংশগুলোতে যাওয়া যাবে।

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">স্কুল ডিজিটাল হাজিরা সিস্টেম</h1>
      <p className="text-gray-600 mb-8">
        নিচে থেকে যা করতে চান সেটা বেছে নিন।
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/dashboard"
          className="block border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 className="text-lg font-semibold mb-1">ছাত্র ব্যবস্থাপনা</h2>
          <p className="text-sm text-gray-500">
            নতুন ছাত্র যোগ করুন এবং সব ছাত্রের তালিকা দেখুন।
          </p>
        </Link>

        <Link
          href="/dashboard/attendance"
          className="block border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 className="text-lg font-semibold mb-1">হাজিরা সিট</h2>
          <p className="text-sm text-gray-500">
            ক্লাস আর তারিখ বেছে সেই দিনের উপস্থিতি/অনুপস্থিতি দেখুন।
          </p>
        </Link>
      </div>
    </div>
  );
}