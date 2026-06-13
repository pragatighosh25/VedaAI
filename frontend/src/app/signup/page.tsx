"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { Eye, EyeOff, ArrowLeft } from "lucide-react";

import { signup } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function SignupPage() {
  const router = useRouter();

  const { setAuth,logout } = useAuthStore();

  const hydrated = useAuthStore((state) => state.hydrated);

   

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [formData, setFormData] =
    useState({
      name: "",
      email: "",
      password: "",
    });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const data = await signup(formData);
      
      setAuth(data.user, data.token);

      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Signup failed"
      );
    } finally {
      setLoading(false);
    }
  };
  if (!hydrated) {
    return null; 
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-veda-gray px-4 py-10">
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
            Create Account
          </h1>

          <p className="mt-2 text-sm text-[#7B7B7B]">
            Start generating AI-powered
            question papers effortlessly.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >
          {/* Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#303030]">
              Full Name
            </label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              required
              className="h-14 w-full rounded-2xl border border-[#E7E7E7] bg-white px-5 text-sm text-[#303030] outline-none transition placeholder:text-[#A1A1A1] focus:border-[#303030]"
            />
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
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create password"
                required
                className="h-14 w-full rounded-2xl border border-[#E7E7E7] bg-white px-5 pr-14 text-sm text-[#303030] outline-none transition placeholder:text-[#A1A1A1] focus:border-[#303030]"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
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
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-[#7B7B7B]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#1F1F1F] hover:text-black"
          >
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}