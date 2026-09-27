// app/dashboard/page.js
//
// অ্যাডমিন ড্যাশবোর্ড — নতুন ছাত্র যোগ করার ফর্ম এবং
// বিদ্যমান ছাত্রদের তালিকা এক পেজেই দেখানো হচ্ছে।
//
// "use client" দেওয়া হয়েছে কারণ এই পেজে useState, ফর্ম
// ইন্টারঅ্যাকশন ইত্যাদি ব্রাউজার-সাইড ফিচার ব্যবহার হচ্ছে।

"use client";

import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null); // { type: "success" | "error", text: string }

  const [form, setForm] = useState({
    name: "",
    roll: "",
    class: "",
    device_user_id: "",
    guardian_phone: "",
  });

  // পেজ লোড হওয়ার সাথে সাথে ছাত্র তালিকা আনা
  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    setLoading(true);
    try {
      const res = await fetch("/api/students");
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
      }
    } catch (err) {
      console.error("ছাত্র তালিকা আনতে সমস্যা:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: "ছাত্র সফলভাবে যোগ হয়েছে!" });
        setForm({
          name: "",
          roll: "",
          class: "",
          device_user_id: "",
          guardian_phone: "",
        });
        fetchStudents(); // তালিকা রিফ্রেশ করা
      } else {
        setMessage({ type: "error", text: data.message || "কিছু একটা সমস্যা হয়েছে।" });
      }
    } catch (err) {
      console.error("ছাত্র যোগ করতে সমস্যা:", err);
      setMessage({ type: "error", text: "সার্ভারের সাথে সংযোগ করা যায়নি।" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">ছাত্র ব্যবস্থাপনা ড্যাশবোর্ড</h1>

      {/* ------------------ নতুন ছাত্র যোগ করার ফর্ম ------------------ */}
      <div className="border rounded-lg p-5 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-4">নতুন ছাত্র যোগ করুন</h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">নাম *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
              placeholder="ছাত্রের পূর্ণ নাম"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              মেশিন ইউজার আইডি (device_user_id) *
            </label>
            <input
              type="text"
              name="device_user_id"
              value={form.device_user_id}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
              placeholder="যেমন: 1, 2, 3..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">রোল</label>
            <input
              type="text"
              name="roll"
              value={form.roll}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="রোল নম্বর"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">ক্লাস</label>
            <input
              type="text"
              name="class"
              value={form.class}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="যেমন: Five"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">অভিভাবকের ফোন নম্বর</label>
            <input
              type="text"
              name="guardian_phone"
              value={form.guardian_phone}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="01XXXXXXXXX"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "যোগ করা হচ্ছে..." : "ছাত্র যোগ করুন"}
            </button>
          </div>
        </form>

        {message && (
          <p
            className={`mt-3 text-sm ${
              message.type === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>

      {/* ------------------ ছাত্রদের তালিকা ------------------ */}
      <div className="border rounded-lg p-5 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-4">
          ছাত্র তালিকা ({students.length} জন)
        </h2>

        {loading ? (
          <p>লোড হচ্ছে...</p>
        ) : students.length === 0 ? (
          <p className="text-gray-500">এখনো কোনো ছাত্র যোগ করা হয়নি।</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4">নাম</th>
                  <th className="py-2 pr-4">রোল</th>
                  <th className="py-2 pr-4">ক্লাস</th>
                  <th className="py-2 pr-4">মেশিন আইডি</th>
                  <th className="py-2 pr-4">অভিভাবকের ফোন</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b">
                    <td className="py-2 pr-4">{s.name}</td>
                    <td className="py-2 pr-4">{s.roll || "-"}</td>
                    <td className="py-2 pr-4">{s.class || "-"}</td>
                    <td className="py-2 pr-4">{s.device_user_id}</td>
                    <td className="py-2 pr-4">{s.guardian_phone || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}