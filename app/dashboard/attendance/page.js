// app/dashboard/attendance/page.js
//
// ক্লাসভিত্তিক হাজিরা সিট দেখার পেজ।
// ব্যবহারকারী একটা ক্লাস আর তারিখ বেছে নিলে সেই ক্লাসের সব
// ছাত্রের present/absent স্ট্যাটাস টেবিল আকারে দেখানো হয়।

"use client";

import { useState } from "react";

// আজকের তারিখ YYYY-MM-DD ফরম্যাটে বের করার ছোট্ট হেল্পার ফাংশন
function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function AttendanceSheetPage() {
  const [className, setClassName] = useState("");
  const [date, setDate] = useState(getTodayDate());
  const [sheet, setSheet] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();

    if (!className.trim()) {
      setError("ক্লাসের নাম দিন।");
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await fetch(
        `/api/attendance-sheet?class=${encodeURIComponent(className)}&date=${encodeURIComponent(date)}`
      );
      const data = await res.json();

      if (data.success) {
        setSheet(data.sheet);
        setSummary(data.summary);
      } else {
        setError(data.message || "হাজিরা সিট আনতে সমস্যা হয়েছে।");
        setSheet([]);
        setSummary(null);
      }
    } catch (err) {
      console.error("হাজিরা সিট আনতে সমস্যা:", err);
      setError("সার্ভারের সাথে সংযোগ করা যায়নি।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">ক্লাসভিত্তিক হাজিরা সিট</h1>

      {/* ------------------ সার্চ ফর্ম ------------------ */}
      <form
        onSubmit={handleSearch}
        className="border rounded-lg p-5 bg-white shadow-sm flex flex-wrap gap-4 items-end"
      >
        <div>
          <label className="block text-sm font-medium mb-1">ক্লাস</label>
          <input
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="যেমন: Five"
            className="border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">তারিখ</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "খোঁজা হচ্ছে..." : "হাজিরা সিট দেখুন"}
        </button>
      </form>

      {error && <p className="text-red-600">{error}</p>}

      {/* ------------------ সারমর্ম ------------------ */}
      {summary && (
        <div className="flex gap-4">
          <div className="border rounded-lg px-4 py-3 bg-white shadow-sm">
            <p className="text-sm text-gray-500">মোট ছাত্র</p>
            <p className="text-xl font-bold">{summary.total}</p>
          </div>
          <div className="border rounded-lg px-4 py-3 bg-green-50 shadow-sm">
            <p className="text-sm text-green-700">উপস্থিত</p>
            <p className="text-xl font-bold text-green-700">{summary.present}</p>
          </div>
          <div className="border rounded-lg px-4 py-3 bg-red-50 shadow-sm">
            <p className="text-sm text-red-700">অনুপস্থিত</p>
            <p className="text-xl font-bold text-red-700">{summary.absent}</p>
          </div>
        </div>
      )}

      {/* ------------------ হাজিরা সিট টেবিল ------------------ */}
      {searched && !loading && sheet.length > 0 && (
        <div className="border rounded-lg p-5 bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4">রোল</th>
                <th className="py-2 pr-4">নাম</th>
                <th className="py-2 pr-4">স্ট্যাটাস</th>
                <th className="py-2 pr-4">পাঞ্চের সময়</th>
              </tr>
            </thead>
            <tbody>
              {sheet.map((row) => (
                <tr key={row.student_id} className="border-b">
                  <td className="py-2 pr-4">{row.roll || "-"}</td>
                  <td className="py-2 pr-4">{row.name}</td>
                  <td className="py-2 pr-4">
                    {row.status === "present" ? (
                      <span className="text-green-700 font-medium">উপস্থিত</span>
                    ) : (
                      <span className="text-red-700 font-medium">অনুপস্থিত</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    {row.punch_time
                      ? new Date(row.punch_time).toLocaleTimeString("bn-BD")
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {searched && !loading && sheet.length === 0 && !error && (
        <p className="text-gray-500">এই ক্লাসে কোনো ছাত্র পাওয়া যায়নি।</p>
      )}
    </div>
  );
}