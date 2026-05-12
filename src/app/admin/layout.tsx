"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Shield,
  Menu,
  X,
  LayoutDashboard,
  Users,
  BarChart3,
  DollarSign,
  Activity,
  Settings,
  Crown,
  Headphones,
  Megaphone,
  Star,
  FileText,
  Clock,
  AlertTriangle,
  Gift,
  TrendingUp,
  Database,
  Key,
} from "lucide-react";

const menuConfig = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    roles: [
      "super_admin",
      "admin",
      "support",
      "marketing",
      "creator_partner",
      "viewer",
    ],
  },
  {
    name: "User Management",
    href: "/admin/users",
    icon: Users,
    roles: ["super_admin", "admin", "support"],
  },
  {
    name: "Content",
    href: "#",
    icon: FileText,
    roles: ["super_admin", "admin", "support"],
    children: [
      {
        name: "All Generations",
        href: "/admin/content/generations",
        icon: FileText,
        roles: ["super_admin", "admin"],
      },
      {
        name: "Reports",
        href: "/admin/content/reports",
        icon: AlertTriangle,
        roles: ["super_admin", "admin"],
      },
      {
        name: "Moderation Queue",
        href: "/admin/content/moderation",
        icon: Clock,
        roles: ["super_admin", "admin", "support"],
      },
    ],
  },
  {
    name: "Analytics",
    href: "#",
    icon: BarChart3,
    roles: ["super_admin", "admin", "marketing"],
    children: [
      {
        name: "Platform Metrics",
        href: "/admin/analytics",
        icon: TrendingUp,
        roles: ["super_admin", "admin", "marketing"],
      },
      {
        name: "User Behavior",
        href: "/admin/analytics/users",
        icon: Users,
        roles: ["super_admin", "admin", "marketing"],
      },
      {
        name: "Revenue Analytics",
        href: "/admin/analytics/revenue",
        icon: DollarSign,
        roles: ["super_admin", "admin"],
      },
    ],
  },
  {
    name: "Revenue",
    href: "/admin/revenue",
    icon: DollarSign,
    roles: ["super_admin", "admin"],
  },
  {
    name: "API & Usage",
    href: "/admin/api-logs",
    icon: Activity,
    roles: ["super_admin", "admin"],
  },
  {
    name: "Creators",
    href: "/admin/creators",
    icon: Star,
    roles: ["super_admin", "admin", "creator_partner"],
  },
  {
    name: "Marketing",
    href: "#",
    icon: Megaphone,
    roles: ["super_admin", "marketing"],
    children: [
      {
        name: "Campaigns",
        href: "/admin/marketing/campaigns",
        icon: Megaphone,
        roles: ["super_admin", "marketing"],
      },
      {
        name: "Referrals",
        href: "/admin/marketing/referrals",
        icon: Gift,
        roles: ["super_admin", "marketing"],
      },
      {
        name: "Affiliates",
        href: "/admin/marketing/affiliates",
        icon: Users,
        roles: ["super_admin"],
      },
    ],
  },
  {
    name: "Support",
    href: "/admin/support",
    icon: Headphones,
    roles: ["super_admin", "admin", "support"],
  },
  {
    name: "System",
    href: "#",
    icon: Settings,
    roles: ["super_admin"],
    children: [
      {
        name: "General Settings",
        href: "/admin/settings",
        icon: Settings,
        roles: ["super_admin"],
      },
      {
        name: "API Keys",
        href: "/admin/settings/api-keys",
        icon: Key,
        roles: ["super_admin"],
      },
      {
        name: "Feature Flags",
        href: "/admin/settings/features",
        icon: Database,
        roles: ["super_admin"],
      },
      {
        name: "Audit Logs",
        href: "/admin/logs",
        icon: Shield,
        roles: ["super_admin"],
      },
    ],
  },
  {
    name: "Admin Management",
    href: "/admin/admins",
    icon: Crown,
    roles: ["super_admin"],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(new Set());

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (!isLoginPage) fetchAdminInfo();
  }, [isLoginPage]);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved !== null) setIsCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  async function fetchAdminInfo() {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/admin/login");
        return;
      }

      // Join roles in one query to avoid RLS blocking a separate roles table read
      const { data: admin, error: adminError } = await supabase
        .from("admins")
        .select("id, email, role_id, status, roles(name)")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (adminError || !admin || admin.status !== "active") {
        console.error("[AdminLayout] admin fetch failed:", adminError, admin);
        await supabase.auth.signOut();
        router.push("/admin/login");
        return;
      }

      // roles(name) returns { name: "super_admin" } via FK join, or null
      const rawRoleName = (admin as any).roles?.name ?? "";
      const roleName = rawRoleName
        ? rawRoleName.toLowerCase().replace(/\s+/g, "_")
        : "viewer";

      console.log("[AdminLayout] email:", admin.email, "role:", roleName);

      setAdminInfo(admin);
      setUserRole(roleName);
    } catch (error) {
      console.error("Error in fetchAdminInfo:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  const filteredMenu = menuConfig.filter((item) =>
    userRole === "super_admin" ? true : item.roles.includes(userRole),
  );

  const toggleSubmenu = (name: string) => {
    const next = new Set(openSubmenus);
    next.has(name) ? next.delete(name) : next.add(name);
    setOpenSubmenus(next);
  };

  const isActive = (href: string) => {
    if (href === "#") return false;
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(href + "/");
  };

  if (isLoginPage) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium text-sm">
            Loading admin panel...
          </p>
        </div>
      </div>
    );
  }

  // ─── Reusable sidebar nav ───────────────────────────────────────────────────
  const NavItems = ({ mobile = false }: { mobile?: boolean }) => {
    const col = !mobile && isCollapsed;
    return (
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <div className="space-y-0.5">
          {filteredMenu.map((item) => (
            <div key={item.name}>
              {item.children ? (
                <>
                  <button
                    onClick={() => toggleSubmenu(item.name)}
                    title={col ? item.name : undefined}
                    className={`w-full flex items-center px-2.5 py-2 rounded-lg transition-colors text-sm
                      ${openSubmenus.has(item.name) ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}
                      ${col ? "justify-center" : "justify-between gap-2"}`}
                  >
                    <span
                      className={`flex items-center gap-2.5 min-w-0 ${col ? "" : "flex-1"}`}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!col && (
                        <span className="font-medium truncate">
                          {item.name}
                        </span>
                      )}
                    </span>
                    {!col && (
                      <motion.span
                        animate={{
                          rotate: openSubmenus.has(item.name) ? 180 : 0,
                        }}
                        transition={{ duration: 0.18 }}
                      >
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      </motion.span>
                    )}
                  </button>
                  <AnimatePresence initial={false}>
                    {openSubmenus.has(item.name) && !col && (
                      <motion.div
                        key="sub"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-5 border-l-2 border-gray-100 mt-0.5 pb-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={`flex items-center gap-2.5 mx-1 px-3 py-2 rounded-lg text-sm transition-colors
                                ${
                                  isActive(child.href)
                                    ? "bg-purple-50 text-purple-700 font-semibold"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                }`}
                            >
                              <child.icon className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{child.name}</span>
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <Link
                  href={item.href}
                  title={col ? item.name : undefined}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors
                    ${
                      isActive(item.href)
                        ? "bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 font-semibold"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }
                    ${col ? "justify-center" : ""}`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!col && (
                    <span className="font-medium truncate">{item.name}</span>
                  )}
                </Link>
              )}
            </div>
          ))}
        </div>
      </nav>
    );
  };

  const UserFooter = ({ mobile = false }: { mobile?: boolean }) => {
    const col = !mobile && isCollapsed;
    return (
      <div className="border-t border-gray-100 p-3 flex-shrink-0">
        <div className={`flex items-center gap-2.5 ${col ? "flex-col" : ""}`}>
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          {!col && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate leading-tight">
                {adminInfo?.email?.split("@")[0] || "Admin"}
              </p>
              <p className="text-[10px] text-gray-400 capitalize truncate mt-0.5">
                {userRole.replace(/_/g, " ")}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ═══ DESKTOP SIDEBAR ═══════════════════════════════════════════════════ */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 68 : 248 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="hidden lg:flex flex-col flex-shrink-0 bg-white border-r border-gray-200 h-screen sticky top-0 z-30 overflow-hidden"
      >
        {/* Logo row */}
        <div
          className={`flex items-center border-b border-gray-100 px-3 h-14 gap-2.5 flex-shrink-0
          ${isCollapsed ? "justify-center" : "justify-between"}`}
        >
          <div
            className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? "justify-center" : ""}`}
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-white font-black text-[11px]">D</span>
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="text-sm font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent leading-none">
                  DigiForgeAI
                </h1>
                <p className="text-[9px] text-gray-400 capitalize truncate mt-0.5">
                  {userRole.replace(/_/g, " ")} Portal
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        <NavItems />
        <UserFooter />
      </motion.aside>

      {/* ═══ MOBILE: OVERLAY + DRAWER ══════════════════════════════════════════ */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              key="mob-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.aside
              key="mob-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl z-50 flex flex-col lg:hidden"
            >
              {/* Mobile logo row */}
              <div className="flex items-center justify-between border-b border-gray-100 px-4 h-14 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-md">
                    <span className="text-white font-black text-[11px]">D</span>
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent leading-none">
                      DigiForgeAI
                    </h2>
                    <p className="text-[9px] text-gray-400 capitalize mt-0.5">
                      {userRole.replace(/_/g, " ")} Portal
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <NavItems mobile />
              <UserFooter mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ═══ MAIN CONTENT ══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar (hidden on lg+) */}
        <header
          className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100
          flex items-center justify-between px-4 h-14 flex-shrink-0 lg:hidden"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-black text-[11px]">D</span>
            </div>
            <span className="text-sm font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              DigiForgeAI
            </span>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
