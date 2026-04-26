"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/Sidebar";
import {
  User,
  Shield,
  Save,
  Loader2,
  Camera,
  Mail,
  AlignLeft,
  Globe,
  Bell,
  Lock,
  Key,
  CreditCard,
  Sparkles,
  BookOpen,
  LogOut,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [ebooksCount, setEbooksCount] = useState(0);
  const [currentPlan, setCurrentPlan] = useState("starter");
  const [signingOut, setSigningOut] = useState(false);

  const [profile, setProfile] = useState({
    id: "",
    full_name: "",
    email: "",
    bio: "",
    avatar_url: "",
    website: "",
    location: "",
    notifications: true,
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    async function getProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        // Get profile data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          console.error("Profile fetch error:", profileError);
        }

        // Get user plan
        const { data: planData } = await supabase
          .from("user_plans")
          .select("plan_id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .single();

        // Get REAL ebook count
        const { data: ebooksData } = await supabase
          .from("generated_ebooks")
          .select("id", { count: "exact" })
          .eq("user_id", user.id)
          .eq("deleted", false);

        setProfile({
          id: user.id,
          full_name: profileData?.full_name || "",
          email: user.email || "",
          bio: profileData?.bio || "",
          avatar_url: profileData?.avatar_url || "",
          website: profileData?.website || "",
          location: profileData?.location || "",
          notifications: profileData?.notifications ?? true,
        });

        setEbooksCount(ebooksData?.length || 0);
        setCurrentPlan(planData?.plan_id || "free");
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    getProfile();
  }, [router, supabase]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Please upload an image smaller than 5MB",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file type", {
        description: "Please upload an image file",
      });
      return;
    }

    const toastId = toast.loading("Uploading avatar...");

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${profile.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id);

      if (dbError) throw dbError;

      setProfile({ ...profile, avatar_url: publicUrl });
      toast.success("Avatar updated!", { id: toastId });
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`, { id: toastId });
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    const toastId = toast.loading("Saving changes...");

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          bio: profile.bio,
          website: profile.website,
          location: profile.location,
          notifications: profile.notifications,
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast.success("Profile updated successfully!", { id: toastId });
    } catch (error: any) {
      toast.error(`Update failed: ${error.message}`, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    // Check if new password matches confirmation
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("Passwords don't match");
      return;
    }

    // Check password length
    if (passwordData.new_password.length < 6) {
      toast.error("Password too short", {
        description: "Password must be at least 6 characters.",
      });
      return;
    }

    // Check if current password is provided
    if (!passwordData.current_password) {
      toast.error("Current password required", {
        description: "Please enter your current password.",
      });
      return;
    }

    setUpdatingPassword(true);
    const toastId = toast.loading("Verifying and updating password...");

    try {
      // First, verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: passwordData.current_password,
      });

      if (signInError) {
        throw new Error("Current password is incorrect");
      }

      // If current password is correct, update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.new_password,
      });

      if (updateError) throw updateError;

      toast.success("Password updated successfully!", { id: toastId });
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Password update failed", { id: toastId });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleNotificationToggle = async () => {
    const newValue = !profile.notifications;
    const toastId = toast.loading(
      newValue ? "Enabling notifications..." : "Disabling notifications...",
    );

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ notifications: newValue })
        .eq("id", profile.id);

      if (error) throw error;

      setProfile({ ...profile, notifications: newValue });
      toast.success(
        newValue ? "Notifications enabled" : "Notifications disabled",
        { id: toastId },
      );
    } catch (error: any) {
      toast.error(`Failed to update: ${error.message}`, { id: toastId });
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "account", label: "Account", icon: Shield },
    { id: "billing", label: "Billing", icon: CreditCard },
  ];

  if (loading) {
    return (
      <div className="flex w-full min-h-screen bg-[#f5f6fa]">
        <Sidebar />
        <main className="flex-1 md:ml-60 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Loading profile...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex w-full min-h-screen bg-[#f5f6fa]">
      <Sidebar />
      <main className="flex-1 md:ml-60 px-3 sm:px-4 md:px-6 py-4 sm:py-6 overflow-x-hidden w-full max-w-full">
        <div className="w-full max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-5 sm:mb-6 md:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Account <span className="text-indigo-600">Settings</span>
            </h1>
            <p className="text-slate-500 text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-[0.2em] mt-1">
              Manage your profile and preferences
            </p>
          </div>

          {/* Tabs - Scrollable on mobile but shows full text */}
          <div className="flex flex-nowrap sm:flex-wrap gap-1.5 sm:gap-2 mb-5 sm:mb-6 md:mb-8 overflow-x-auto pb-2 sm:pb-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2.5 rounded-xl text-[11px] sm:text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                      : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            {/* Sidebar Card */}
            <div className="lg:col-span-4 space-y-4 sm:space-y-5">
              <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-center shadow-sm">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt="Avatar"
                      fill
                      className="rounded-xl sm:rounded-2xl object-cover border-4 border-slate-100"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-black text-white">
                      {profile.full_name?.[0] || profile.email?.[0] || "U"}
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1.5 -right-1.5 bg-slate-900 text-white p-1.5 rounded-lg hover:bg-indigo-600 transition-all cursor-pointer shadow-md"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleUpload}
                    accept="image/*"
                  />
                </div>

                <h2 className="font-black text-slate-900 text-sm sm:text-base truncate px-1">
                  {profile.full_name || "Anonymous User"}
                </h2>
                <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 truncate px-1">
                  {profile.email}
                </p>

                <div className="mt-2 sm:mt-3 inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-indigo-50 rounded-full">
                  <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-indigo-600" />
                  <span className="text-[7px] sm:text-[8px] font-black text-indigo-600 uppercase">
                    {currentPlan === "free"
                      ? "Free Plan"
                      : currentPlan === "starter"
                        ? "Starter Plan"
                        : "Pro Plan"}
                  </span>
                </div>

                <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-slate-100">
                  <div className="bg-slate-50 rounded-xl p-2.5 sm:p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
                        <p className="text-[8px] sm:text-[9px] text-slate-400 uppercase font-bold">
                          eBooks
                        </p>
                      </div>
                      <p className="text-sm sm:text-base font-black text-slate-800">
                        {ebooksCount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Form */}
            <div className="lg:col-span-8">
              <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm">
                {/* Profile Tab */}
                {activeTab === "profile" && (
                  <div className="space-y-4 sm:space-y-5">
                    <div>
                      <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Full Name
                      </label>
                      <div className="relative mt-1">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={profile.full_name}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              full_name: e.target.value,
                            })
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                          placeholder="Your full name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Bio / Headline
                      </label>
                      <div className="relative mt-1">
                        <AlignLeft className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
                        <textarea
                          value={profile.bio}
                          onChange={(e) =>
                            setProfile({ ...profile, bio: e.target.value })
                          }
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none"
                          placeholder="Tell us about yourself..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Website
                        </label>
                        <div className="relative mt-1">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="url"
                            value={profile.website}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                website: e.target.value,
                              })
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 transition-all"
                            placeholder="https://yourwebsite.com"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Location
                        </label>
                        <div className="relative mt-1">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={profile.location}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                location: e.target.value,
                              })
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 transition-all"
                            placeholder="City, Country"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Email Address
                      </label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="email"
                          value={profile.email}
                          disabled
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 sm:p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Bell className="w-3.5 h-3.5 text-slate-600" />
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-slate-800">
                            Email Notifications
                          </p>
                          <p className="text-[8px] sm:text-[9px] text-slate-500">
                            Receive product updates and news
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleNotificationToggle}
                        className={`w-10 h-5 rounded-full transition-all ${profile.notifications ? "bg-indigo-600" : "bg-slate-300"}`}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full transition-all mt-0.5 ${profile.notifications ? "ml-5" : "ml-0.5"}`}
                        />
                      </button>
                    </div>

                    <button
                      onClick={handleUpdate}
                      disabled={saving}
                      className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-black py-3 rounded-xl text-[10px] sm:text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      Save Changes
                    </button>
                  </div>
                )}

                {/* Account Tab - With Visible Password Inputs */}
                {activeTab === "account" && (
                  <div className="space-y-4 sm:space-y-5">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5">
                        <Shield className="w-3.5 h-3.5 text-amber-600" />
                        <p className="text-xs sm:text-sm font-bold text-amber-800">
                          Security Tip
                        </p>
                      </div>
                      <p className="text-[10px] sm:text-xs text-amber-700">
                        For security, you must enter your current password
                        before setting a new one.
                      </p>
                    </div>

                    <div>
                      <label className="text-[9px] sm:text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">
                        Current Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="password"
                          value={passwordData.current_password}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              current_password: e.target.value,
                            })
                          }
                          className="w-full bg-white border-2 border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                          placeholder="Enter your current password"
                          autoComplete="current-password"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] sm:text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">
                        New Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative mt-1">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="password"
                          value={passwordData.new_password}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              new_password: e.target.value,
                            })
                          }
                          className="w-full bg-white border-2 border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                          placeholder="Enter new password (min 6 characters)"
                          autoComplete="new-password"
                        />
                      </div>
                      {passwordData.new_password &&
                        passwordData.new_password.length < 6 && (
                          <p className="text-[8px] text-red-500 mt-1 ml-1 flex items-center gap-1">
                            <span className="inline-block w-1 h-1 rounded-full bg-red-500"></span>
                            Password must be at least 6 characters
                          </p>
                        )}
                    </div>

                    <div>
                      <label className="text-[9px] sm:text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">
                        Confirm New Password{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="password"
                          value={passwordData.confirm_password}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirm_password: e.target.value,
                            })
                          }
                          className="w-full bg-white border-2 border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                          placeholder="Confirm your new password"
                          autoComplete="new-password"
                        />
                      </div>
                      {passwordData.confirm_password &&
                        passwordData.new_password !==
                          passwordData.confirm_password && (
                          <p className="text-[8px] text-red-500 mt-1 ml-1 flex items-center gap-1">
                            <span className="inline-block w-1 h-1 rounded-full bg-red-500"></span>
                            Passwords do not match
                          </p>
                        )}
                    </div>

                    <button
                      onClick={handlePasswordUpdate}
                      disabled={
                        updatingPassword ||
                        !passwordData.current_password ||
                        !passwordData.new_password ||
                        !passwordData.confirm_password ||
                        passwordData.new_password.length < 6 ||
                        passwordData.new_password !==
                          passwordData.confirm_password
                      }
                      className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-[0.2em] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {updatingPassword ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      ) : (
                        "Update Password"
                      )}
                    </button>
                  </div>
                )}

                {/* Billing Tab - Simplified (Redirects to Pricing Page) */}
                {activeTab === "billing" && (
                  <div className="space-y-4 sm:space-y-5">
                    {/* Current Plan Card */}
                    <div
                      className={`rounded-xl p-4 sm:p-5 text-white ${
                        currentPlan === "free"
                          ? "bg-gradient-to-r from-slate-600 to-slate-700"
                          : currentPlan === "starter"
                            ? "bg-gradient-to-r from-indigo-600 to-indigo-700"
                            : "bg-gradient-to-r from-indigo-600 to-purple-600"
                      }`}
                    >
                      <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider opacity-80">
                        Current Plan
                      </p>
                      <p className="text-xl sm:text-2xl font-black mt-1 capitalize">
                        {currentPlan} Plan
                      </p>
                      <p className="text-[9px] sm:text-[10px] opacity-90 mt-1">
                        {currentPlan === "free"
                          ? "5 generations/month • 5 chapters"
                          : currentPlan === "starter"
                            ? "15 generations/month • 6 chapters • No watermark"
                            : "50 generations/month • 12 chapters • Priority speed • DOCX export"}
                      </p>
                    </div>

                    {/* Plan Features Summary */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">
                        Plan Features
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-600">
                            Monthly generations
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {currentPlan === "free"
                              ? "5"
                              : currentPlan === "starter"
                                ? "15"
                                : "50"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-600">
                            Max chapters per ebook
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {currentPlan === "free"
                              ? "5"
                              : currentPlan === "starter"
                                ? "6"
                                : "12"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-600">
                            Watermark free
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {currentPlan === "free" ? "❌" : "✅"}
                          </span>
                        </div>
                        {currentPlan === "pro" && (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-600">
                                Priority generation
                              </span>
                              <span className="text-xs font-bold text-slate-900">
                                ✅
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-600">
                                DOCX export
                              </span>
                              <span className="text-xs font-bold text-slate-900">
                                ✅
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Billing Summary */}
                    <div className="bg-slate-50 rounded-xl p-4 sm:p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-slate-800 capitalize">
                            {currentPlan} Plan
                          </p>
                          <p className="text-[8px] sm:text-[9px] text-slate-500">
                            Monthly subscription
                          </p>
                        </div>
                        <p className="text-sm sm:text-base font-bold text-slate-900">
                          $
                          {currentPlan === "free"
                            ? "0"
                            : currentPlan === "starter"
                              ? "9"
                              : "19"}
                          .00/month
                        </p>
                      </div>
                    </div>

                    {/* Manage Subscription Button - Redirects to Pricing */}
                    <button
                      onClick={() => router.push("/pricing")}
                      className="cursor-pointer w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 sm:py-3.5 rounded-xl text-[11px] sm:text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {currentPlan === "free"
                        ? "Upgrade to Starter"
                        : currentPlan === "starter"
                          ? "Upgrade to Pro"
                          : "Manage Subscription"}
                    </button>

                    {/* Support Contact */}
                    <div className="bg-indigo-50 rounded-xl p-3 sm:p-4 text-center">
                      <p className="text-[9px] sm:text-[10px] text-indigo-700">
                        💡 Need help with billing?{" "}
                        <a
                          href="mailto:support@digiforgeai.app"
                          className="cursor-pointer font-bold underline"
                        >
                          Contact support
                        </a>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
