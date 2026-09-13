"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

import { Eye, EyeOff, ArrowLeft, AlertCircle } from "lucide-react";

import { login } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  const { setAuth } = useAuthStore();
  const hydrated = useAuthStore((state) => state.hydrated);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const demoCredentials = {
    email: "test1@gmail.com",
    password: "1234",
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const data = await login(formData);
      setAuth(data.user, data.token);
      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!hydrated) {
    return null;
  }

  return (
    <div className="w-full max-w-[460px] rounded-[32px] bg-white p-8 shadow-sm sm:p-10 relative">
      {/* Back to LP */}
      <Link
        href="/"
        className="absolute left-6 top-6 sm:left-8 sm:top-8 flex items-center justify-center w-9 h-9 rounded-full border border-[#E7E7E7] hover:border-[#1F1F1F] text-[#7B7B7B] hover:text-[#1F1F1F] bg-[#FAFAFA] hover:bg-white transition-all group shadow-sm"
        title="Back to home"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
      </Link>

      {/* Logo */}
      <div className="flex justify-center">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="VedaAI"
            width={42}
            height={42}
            className="rounded-xl"
          />

          <span className="text-[28px] font-bold text-[#1F1F1F]">
            VedaAI
          </span>
        </div>
      </div>

      {/* Heading */}
      <div className="mt-8 text-center">
        <h1 className="text-[28px] font-bold text-[#1F1F1F]">
          Welcome Back
        </h1>

        <p className="mt-2 text-sm text-[#7B7B7B]">
          Login to continue generating AI-powered question papers.
        </p>
      </div>

      {/* Session Expired Banner */}
      {reason === "session_expired" && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-medium text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>Your session has expired due to inactivity. Please log in again to continue.</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="rounded-2xl border border-[#E7E7E7] bg-[#FAFAFA] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm text-[#5F5F5F]">
              <p className="font-semibold text-[#303030]">Demo account</p>
              <p>Email: {demoCredentials.email}</p>
              <p>Password: {demoCredentials.password}</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setFormData({
                  email: demoCredentials.email,
                  password: demoCredentials.password,
                })
              }
              className="rounded-lg border border-[#D9D9D9] px-3 py-2 text-xs font-medium text-[#303030] transition hover:bg-[#F2F2F2]"
            >
              Use Demo
            </button>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[#303030]">
            Email Address
          </label>

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
            className="h-14 w-full rounded-2xl border border-[#E7E7E7] bg-white px-5 text-sm text-[#303030] outline-none transition placeholder:text-[#A1A1A1] focus:border-[#303030]"
          />
        </div>

        {/* Password */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[#303030]">
            Password
          </label>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
              className="h-14 w-full rounded-2xl border border-[#E7E7E7] bg-white px-5 pr-14 text-sm text-[#303030] outline-none transition placeholder:text-[#A1A1A1] focus:border-[#303030]"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-[#8B8B8B]"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500">
            {error}
          </p>
        )}

        {/* Button */}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex h-14 w-full items-center justify-center rounded-2xl bg-[#1F1F1F] text-sm font-medium text-white transition hover:bg-black disabled:opacity-60"
        >
          {loading ? "Logging In..." : "Login"}
        </button>
      </form>

      {/* Footer */}
      <p className="mt-8 text-center text-sm text-[#7B7B7B]">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-semibold text-[#1F1F1F] hover:text-black"
        >
          Create Account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-veda-gray px-4 py-10">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}