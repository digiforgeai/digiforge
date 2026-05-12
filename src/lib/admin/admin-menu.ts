import {
  LayoutDashboard,
  Users,
  BarChart3,
  DollarSign,
  Activity,
  Settings,
  Shield,
  Crown,
  Headphones,
  Megaphone,
  Star,
  LogOut,
  ChevronLeft,
  ChevronRight,
  FileText,
  Clock,
  AlertTriangle,
  Gift,
  TrendingUp,
  Database,
  Key,
} from 'lucide-react'

export interface MenuItem {
  name: string
  href: string
  icon: any
  roles: string[] // super_admin, admin, support, marketing, creator_partner, viewer
  children?: MenuItem[]
}

export const menuConfig: MenuItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    roles: ['super_admin', 'admin', 'support', 'marketing', 'creator_partner', 'viewer'],
  },
  {
    name: 'User Management',
    href: '/admin/users',
    icon: Users,
    roles: ['super_admin', 'admin', 'support'],
  },
  {
    name: 'Content',
    href: '#',
    icon: FileText,
    roles: ['super_admin', 'admin', 'support'],
    children: [
      { name: 'All Generations', href: '/admin/content/generations', icon: FileText, roles: ['super_admin', 'admin'] },
      { name: 'Reports', href: '/admin/content/reports', icon: AlertTriangle, roles: ['super_admin', 'admin'] },
      { name: 'Moderation Queue', href: '/admin/content/moderation', icon: Clock, roles: ['super_admin', 'admin', 'support'] },
    ],
  },
  {
    name: 'Analytics',
    href: '#',
    icon: BarChart3,
    roles: ['super_admin', 'admin', 'marketing'],
    children: [
      { name: 'Platform Metrics', href: '/admin/analytics', icon: TrendingUp, roles: ['super_admin', 'admin', 'marketing'] },
      { name: 'User Behavior', href: '/admin/analytics/users', icon: Users, roles: ['super_admin', 'admin', 'marketing'] },
      { name: 'Revenue Analytics', href: '/admin/analytics/revenue', icon: DollarSign, roles: ['super_admin', 'admin'] },
    ],
  },
  {
    name: 'Revenue',
    href: '/admin/revenue',
    icon: DollarSign,
    roles: ['super_admin', 'admin'],
  },
  {
    name: 'API & Usage',
    href: '/admin/api-logs',
    icon: Activity,
    roles: ['super_admin', 'admin'],
  },
  {
    name: 'Creators',
    href: '/admin/creators',
    icon: Star,
    roles: ['super_admin', 'admin', 'creator_partner'],
  },
  {
    name: 'Marketing',
    href: '#',
    icon: Megaphone,
    roles: ['super_admin', 'marketing'],
    children: [
      { name: 'Campaigns', href: '/admin/marketing/campaigns', icon: Megaphone, roles: ['super_admin', 'marketing'] },
      { name: 'Referrals', href: '/admin/marketing/referrals', icon: Gift, roles: ['super_admin', 'marketing'] },
      { name: 'Affiliates', href: '/admin/marketing/affiliates', icon: Users, roles: ['super_admin'] },
    ],
  },
  {
    name: 'Support',
    href: '/admin/support',
    icon: Headphones,
    roles: ['super_admin', 'admin', 'support'],
  },
  {
    name: 'System',
    href: '#',
    icon: Settings,
    roles: ['super_admin'],
    children: [
      { name: 'General Settings', href: '/admin/settings', icon: Settings, roles: ['super_admin'] },
      { name: 'API Keys', href: '/admin/settings/api-keys', icon: Key, roles: ['super_admin'] },
      { name: 'Feature Flags', href: '/admin/settings/features', icon: Database, roles: ['super_admin'] },
      { name: 'Audit Logs', href: '/admin/logs', icon: Shield, roles: ['super_admin'] },
    ],
  },
  {
    name: 'Admin Management',
    href: '/admin/admins',
    icon: Crown,
    roles: ['super_admin'],
  },
]