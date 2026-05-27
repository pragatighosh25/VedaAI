"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import {
  Camera,
  Lock,
  LogOut,
  Save,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";

import {
  fetchProfile,
  updateProfile,
  changePassword,
} from "@/lib/api";

import { useAuthStore } from "@/store/authStore";

export default function SettingsPage() {
  const {
  user,
  updateUser,
  logout,
} = useAuthStore();

  const [loading, setLoading] =
    useState(false);

  const [passwordLoading, setPasswordLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [passwordMessage, setPasswordMessage] =
    useState("");

  const [profile, setProfile] =
    useState({
      name: "",
      email: "",
      schoolName: "",
      subject: "",
      className: "",
      avatar: "",
    });

  const [passwords, setPasswords] =
    useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await fetchProfile();

        setProfile({
          name: data.name || "",
          email: data.email || "",
          schoolName:
            data.schoolName || "",
          subject: data.subject || "",
          className:
            data.className || "",
          avatar: data.avatar || "",
        });
        updateUser(data);
      } catch (error) {
        console.error(error);
      }
    }

    loadProfile();
  }, [updateUser]);

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setProfile({
      ...profile,
      [e.target.name]:
        e.target.value,
    });
  };

  const handlePasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPasswords({
      ...passwords,
      [e.target.name]:
        e.target.value,
    });
  };

  const handleSaveProfile =
    async () => {
      setLoading(true);
      setMessage("");

      try {
        const updatedUser =
          await updateProfile(profile);

        updateUser(updatedUser);

        setMessage(
          "Profile updated successfully"
        );
      } catch {
        setMessage(
          "Failed to update profile"
        );
      } finally {
        setLoading(false);
      }
    };

  const handlePasswordUpdate =
    async () => {
      if (
        passwords.newPassword !==
        passwords.confirmPassword
      ) {
        setPasswordMessage(
          "Passwords do not match"
        );

        return;
      }

      setPasswordLoading(true);

      try {
        await changePassword({
          currentPassword:
            passwords.currentPassword,

          newPassword:
            passwords.newPassword,
        });

        setPasswordMessage(
          "Password updated successfully"
        );

        setPasswords({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } catch {
        setPasswordMessage(
          "Failed to update password"
        );
      } finally {
        setPasswordLoading(false);
      }
    };

  return (
    <DashboardLayout headerTitle="Settings">
      <div className="space-y-6">

        {/* Profile Card */}
        <div className="rounded-[32px] bg-white p-6 shadow-sm sm:p-8">
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1F1F1F]">
                Profile Settings
              </h1>

              <p className="mt-1 text-sm text-[#7B7B7B]">
                Manage your teacher
                profile and academic
                information.
              </p>
            </div>
          </div>

          {/* Avatar */}
          <div className="mt-8 flex items-center gap-5">
            <div className="relative">
              <div className="h-24 w-24 overflow-hidden rounded-full border border-[#EAEAEA]">
                <Image
                  src={
                    profile.avatar ||
                    "/avatar.svg"
                  }
                  alt="Avatar"
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />
              </div>

              <button className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-[#1F1F1F] text-white shadow-md">
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#1F1F1F]">
                {profile.name ||
                  "Teacher"}
              </h2>

              <p className="text-sm text-[#7B7B7B]">
                {profile.email}
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="mt-10 grid gap-5 sm:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-medium text-[#303030]">
                Full Name
              </label>

              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={
                  handleProfileChange
                }
                className="h-14 w-full rounded-2xl border border-[#E7E7E7] px-5 text-sm outline-none focus:border-[#1F1F1F]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#303030]">
                Email Address
              </label>

              <input
                type="email"
                value={profile.email}
                disabled
                className="h-14 w-full cursor-not-allowed rounded-2xl border border-[#EFEFEF] bg-[#F8F8F8] px-5 text-sm text-[#9A9A9A] outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#303030]">
                School Name
              </label>

              <input
                type="text"
                name="schoolName"
                value={
                  profile.schoolName
                }
                onChange={
                  handleProfileChange
                }
                className="h-14 w-full rounded-2xl border border-[#E7E7E7] px-5 text-sm outline-none focus:border-[#1F1F1F]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#303030]">
                Subject
              </label>

              <input
                type="text"
                name="subject"
                value={profile.subject}
                onChange={
                  handleProfileChange
                }
                className="h-14 w-full rounded-2xl border border-[#E7E7E7] px-5 text-sm outline-none focus:border-[#1F1F1F]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#303030]">
                Class Taught
              </label>

              <input
                type="text"
                name="className"
                value={
                  profile.className
                }
                onChange={
                  handleProfileChange
                }
                className="h-14 w-full rounded-2xl border border-[#E7E7E7] px-5 text-sm outline-none focus:border-[#1F1F1F]"
              />
            </div>
          </div>

          {/* Save */}
          <div className="mt-8 flex items-center justify-between">
            <p className="text-sm text-[#7B7B7B]">
              {message}
            </p>

            <button
              onClick={
                handleSaveProfile
              }
              disabled={loading}
              className="flex h-12 items-center gap-2 rounded-full bg-[#1F1F1F] px-6 text-sm font-medium text-white transition hover:bg-black disabled:opacity-60"
            >
              <Save className="h-4 w-4" />

              {loading
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Security */}
        <div className="rounded-[32px] bg-white p-6 shadow-sm sm:p-8">
          
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F5F5F5]">
              <Lock className="h-5 w-5 text-[#1F1F1F]" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#1F1F1F]">
                Security
              </h2>

              <p className="text-sm text-[#7B7B7B]">
                Update your password
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            
            <input
              type="password"
              name="currentPassword"
              placeholder="Current Password"
              value={
                passwords.currentPassword
              }
              onChange={
                handlePasswordChange
              }
              className="h-14 rounded-2xl border border-[#E7E7E7] px-5 text-sm outline-none focus:border-[#1F1F1F]"
            />

            <input
              type="password"
              name="newPassword"
              placeholder="New Password"
              value={
                passwords.newPassword
              }
              onChange={
                handlePasswordChange
              }
              className="h-14 rounded-2xl border border-[#E7E7E7] px-5 text-sm outline-none focus:border-[#1F1F1F]"
            />

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={
                passwords.confirmPassword
              }
              onChange={
                handlePasswordChange
              }
              className="h-14 rounded-2xl border border-[#E7E7E7] px-5 text-sm outline-none focus:border-[#1F1F1F]"
            />
          </div>

          <div className="mt-8 flex items-center justify-between">
            <p className="text-sm text-[#7B7B7B]">
              {passwordMessage}
            </p>

            <button
              onClick={
                handlePasswordUpdate
              }
              disabled={
                passwordLoading
              }
              className="flex h-12 items-center gap-2 rounded-full bg-[#1F1F1F] px-6 text-sm font-medium text-white transition hover:bg-black disabled:opacity-60"
            >
              {passwordLoading
                ? "Updating..."
                : "Update Password"}
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="flex justify-end">
          <button
            onClick={() => {
              logout();
              window.location.href =
                "/login";
            }}
            className="flex h-12 items-center gap-2 rounded-full border border-red-200 bg-red-50 px-6 text-sm font-medium text-red-600 transition hover:bg-red-100"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}