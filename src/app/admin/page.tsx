"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion } from "framer-motion";
import {
  Users,
  BookOpen,
  DollarSign,
  Activity,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Zap,
  CreditCard,
  UserCheck,
  Loader2,
  MoreHorizontal,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalGenerations: number;
  generationsToday: number;
  totalRevenue: number;
  monthlyRevenue: number;
  mrr: number;
  arpu: number;
  conversionRate: number;
  totalApiCalls: number;
  estimatedCosts: number;
  profitMargin: number;
}

// Custom tooltip for charts
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {p.name}:{" "}
          {(typeof p.value === "number" &&
            p.name?.toLowerCase().includes("revenue")) ||
          p.name?.toLowerCase().includes("cost")
            ? `$${p.value.toLocaleString()}`
            : p.value}
        </p>
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adminInfo, setAdminInfo] = useState<any>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const revenueData = [
    { name: "Jan", revenue: 4000, cost: 2400 },
    { name: "Feb", revenue: 3000, cost: 1398 },
    { name: "Mar", revenue: 5000, cost: 2800 },
    { name: "Apr", revenue: 4780, cost: 3908 },
    { name: "May", revenue: 5890, cost: 4800 },
    { name: "Jun", revenue: 6390, cost: 4800 },
  ];

  const userGrowthData = [
    { name: "W1", users: 40 },
    { name: "W2", users: 65 },
    { name: "W3", users: 85 },
    { name: "W4", users: 120 },
    { name: "W5", users: 150 },
    { name: "W6", users: 200 },
  ];

  const planDistribution = [
    { name: "Free", value: 65, color: "#e2e8f0" },
    { name: "Starter", value: 25, color: "#8b5cf6" },
    { name: "Pro", value: 10, color: "#6366f1" },
  ];

  const recentActivities = [
    {
      id: 1,
      user: "john@example.com",
      action: "Generated eBook",
      time: "2m ago",
      type: "generation",
    },
    {
      id: 2,
      user: "sarah@example.com",
      action: "Upgraded to Pro",
      time: "15m ago",
      type: "upgrade",
    },
    {
      id: 3,
      user: "mike@example.com",
      action: "New signup",
      time: "1h ago",
      type: "signup",
    },
    {
      id: 4,
      user: "emma@example.com",
      action: "Generated 5 eBooks",
      time: "3h ago",
      type: "generation",
    },
    {
      id: 5,
      user: "alex@example.com",
      action: "Cancelled plan",
      time: "5h ago",
      type: "cancel",
    },
  ];

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    await Promise.all([fetchDashboardStats(), fetchAdminInfo()]);
  }

  async function fetchAdminInfo() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    const { data: admin } = await supabase
      .from("admins")
      .select("email")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (admin) setAdminInfo(admin);
  }

  async function fetchDashboardStats() {
    try {
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: totalGenerations } = await supabase
        .from("generated_ebooks")
        .select("*", { count: "exact", head: true })
        .eq("deleted", false);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: generationsToday } = await supabase
        .from("generated_ebooks")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());

      const { data: activePlans } = await supabase
        .from("user_plans")
        .select("plan_id")
        .eq("status", "active");

      const monthlyRevenue =
        activePlans?.reduce((total, plan) => {
          if (plan.plan_id === "starter") return total + 29;
          if (plan.plan_id === "pro") return total + 99;
          return total;
        }, 0) || 0;

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: Math.floor((totalUsers || 0) * 0.4),
        totalGenerations: totalGenerations || 0,
        generationsToday: generationsToday || 0,
        totalRevenue: monthlyRevenue,
        monthlyRevenue,
        mrr: monthlyRevenue,
        arpu: totalUsers ? monthlyRevenue / totalUsers : 0,
        conversionRate: totalUsers
          ? ((activePlans?.length || 0) / totalUsers) * 100
          : 0,
        totalApiCalls: 15420,
        estimatedCosts: 342.5,
        profitMargin: 78.5,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchAll();
  }

  const statCards = stats
    ? [
        {
          title: "Total Users",
          value: stats.totalUsers.toLocaleString(),
          icon: Users,
          trend: "+12%",
          trendUp: true,
          sub: `${stats.activeUsers.toLocaleString()} active`,
          color: "bg-blue-50",
          iconColor: "text-blue-600",
          dot: "bg-blue-500",
        },
        {
          title: "MRR",
          value: `$${stats.mrr.toLocaleString()}`,
          icon: CreditCard,
          trend: "+23%",
          trendUp: true,
          sub: `ARPU $${stats.arpu.toFixed(2)}`,
          color: "bg-purple-50",
          iconColor: "text-purple-600",
          dot: "bg-purple-500",
        },
        {
          title: "Conversions",
          value: `${stats.conversionRate.toFixed(1)}%`,
          icon: TrendingUp,
          trend: "+5%",
          trendUp: true,
          sub: `${stats.conversionRate > 0 ? "Paid users converting" : "No paid users yet"}`,
          color: "bg-indigo-50",
          iconColor: "text-indigo-600",
          dot: "bg-indigo-500",
        },
        {
          title: "Generations",
          value: stats.totalGenerations.toLocaleString(),
          icon: BookOpen,
          trend: "+18%",
          trendUp: true,
          sub: `${stats.generationsToday} today`,
          color: "bg-amber-50",
          iconColor: "text-amber-600",
          dot: "bg-amber-500",
        },
        {
          title: "API Calls",
          value: stats.totalApiCalls.toLocaleString(),
          icon: Activity,
          trend: "+9%",
          trendUp: true,
          sub: `$${stats.estimatedCosts} est. cost`,
          color: "bg-rose-50",
          iconColor: "text-rose-600",
          dot: "bg-rose-500",
        },
        {
          title: "Profit Margin",
          value: `${stats.profitMargin}%`,
          icon: DollarSign,
          trend: "-2%",
          trendUp: false,
          sub: "vs last month",
          color: "bg-emerald-50",
          iconColor: "text-emerald-600",
          dot: "bg-emerald-500",
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              {adminInfo?.email?.split("@")[0] || "Admin"}
            </span>{" "}
            👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Here's what's happening with DigiForgeAI today.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm text-xs text-gray-600">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            {new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm text-xs text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider truncate">
                    {card.title}
                  </p>
                  <p className="text-xl font-bold text-gray-900 mt-1.5 leading-none truncate">
                    {card.value}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    {card.trendUp ? (
                      <ArrowUpRight className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-red-500 flex-shrink-0" />
                    )}
                    <span
                      className={`text-[10px] font-semibold ${card.trendUp ? "text-emerald-600" : "text-red-500"}`}
                    >
                      {card.trend}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 truncate">
                    {card.sub}
                  </p>
                </div>
                <div className={`${card.color} p-2 rounded-xl flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${card.iconColor}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Revenue chart */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Revenue vs Costs
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Monthly overview</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                Revenue
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                <span className="w-2 h-2 rounded-full bg-pink-400 inline-block" />
                Costs
              </span>
            </div>
          </div>
          {/* Responsive chart wrapper */}
          <div className="w-full h-[220px] sm:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueData}
                margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
              >
                <defs>
                  <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f472b6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#8b5cf6"
                  fill="url(#gRevenue)"
                  strokeWidth={2}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="cost"
                  name="Cost"
                  stroke="#f472b6"
                  fill="url(#gCost)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* User growth chart */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm"
        >
          <div className="mb-5">
            <h3 className="text-sm font-bold text-gray-900">User Growth</h3>
            <p className="text-xs text-gray-400 mt-0.5">New signups by week</p>
          </div>
          <div className="w-full h-[220px] sm:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={userGrowthData}
                margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="users"
                  name="Users"
                  fill="#8b5cf6"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Plan distribution */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm"
        >
          <h3 className="text-sm font-bold text-gray-900 mb-4">
            Plan Distribution
          </h3>
          <div className="w-full h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius="50%"
                  outerRadius="75%"
                  paddingAngle={4}
                  dataKey="value"
                >
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => `${val}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {planDistribution.map((plan) => (
              <div key={plan.name} className="text-center">
                <div
                  className="w-2.5 h-2.5 rounded-full mx-auto mb-1"
                  style={{ backgroundColor: plan.color }}
                />
                <p className="text-[10px] text-gray-500">{plan.name}</p>
                <p className="text-xs font-bold text-gray-800">{plan.value}%</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent activity */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm md:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">Recent Activity</h3>
            <button className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium transition-colors">
              View all <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-0">
            {recentActivities.map((activity, i) => {
              const typeConfig = {
                generation: {
                  bg: "bg-purple-50",
                  icon: "text-purple-600",
                  label: "bg-purple-100 text-purple-700",
                },
                upgrade: {
                  bg: "bg-emerald-50",
                  icon: "text-emerald-600",
                  label: "bg-emerald-100 text-emerald-700",
                },
                signup: {
                  bg: "bg-blue-50",
                  icon: "text-blue-600",
                  label: "bg-blue-100 text-blue-700",
                },
                cancel: {
                  bg: "bg-red-50",
                  icon: "text-red-500",
                  label: "bg-red-100 text-red-600",
                },
              }[activity.type] || {
                bg: "bg-gray-50",
                icon: "text-gray-500",
                label: "bg-gray-100 text-gray-600",
              };

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.04 }}
                  className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0"
                >
                  <div
                    className={`w-8 h-8 ${typeConfig.bg} rounded-xl flex items-center justify-center flex-shrink-0`}
                  >
                    <Zap className={`w-3.5 h-3.5 ${typeConfig.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">
                      {activity.user}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">
                      {activity.action}
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">
                    {activity.time}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ── Quick stats row ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
      >
        {[
          { label: "Avg. Session", value: "4m 32s", change: "+12s", up: true },
          { label: "Bounce Rate", value: "24.3%", change: "-1.2%", up: true },
          { label: "Generations/User", value: "3.8", change: "+0.4", up: true },
          { label: "Support Tickets", value: "12", change: "+3", up: false },
        ].map((item, i) => (
          <div
            key={item.label}
            className="bg-white rounded-xl px-4 py-3.5 border border-gray-100 shadow-sm"
          >
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              {item.label}
            </p>
            <p className="text-lg font-bold text-gray-900 mt-1 leading-none">
              {item.value}
            </p>
            <div className="flex items-center gap-1 mt-1.5">
              {item.up ? (
                <ArrowUpRight className="w-3 h-3 text-emerald-500" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-red-500" />
              )}
              <span
                className={`text-[10px] font-semibold ${item.up ? "text-emerald-600" : "text-red-500"}`}
              >
                {item.change}
              </span>
            </div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
