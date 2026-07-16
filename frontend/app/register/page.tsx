"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { apiRegister } from "../lib/api";
import { saveAuth } from "../lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Added a placeholder function so handleKeyDown stops throwing errors
  const handleRegister = async () => {
    setError("");
    if (!fullName || !email || !password) {
      setError("Please fill in all of the fields");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await apiRegister(email, password, fullName);
      if (!res.success) {
        setError(res.error || "Registration failed");
        return;
      }
      saveAuth(res.token, res.user);
      router.push("/");
    } catch {
      setError("Something went wrong. Try again");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleRegister();
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col justify-between px-4 py-8">
      <div className="flex-grow flex items-center justify-center w-full">
        <div className="w-full max-w-md my-auto">
          {/* Header Section */}
          <div className="text-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
              M
            </div>
            <h1 className="text-2xl font-bold text-white">Create Account</h1>
            <p className="text-slate-400 text-sm mt-1">Join Medbot today</p>
          </div>

          {/* Form Card */}
          <div className="bg-[#0d1b2e] border border-[#1e3a5f] rounded-2xl p-6 space-y-4">
            {error && (
              <div className="bg-red-500/10 border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="text-slate-300 text-sm font-medium block mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Dr. John Smith"
                className="w-full bg-[#111827] border border-[#1e3a5f] focus:border-blue-500 text-slate-200 placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-slate-300 text-sm font-medium block mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="doctor@hospital.com"
                className="w-full bg-[#111827] border border-[#1e3a5f] focus:border-blue-500 text-slate-200 placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-slate-300 text-sm font-medium block mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Minimum 8 characters"
                className="w-full bg-[#111827] border border-[#1e3a5f] focus:border-blue-500 text-slate-200 placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
              />
            </div>

            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-all text-sm"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>

            <p className="text-slate-300 text-sm text-center pt-1">
              Already have an account?{" "}
              <Link
                href={"/login"}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <p className="text-center text-slate-600 text-xs mt-6 w-full">
        MedBot • Powered By Gale Encyclopedia of Medicine
      </p>
    </div>
  );
}
