import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  Handshake,
  UserRound,
  BarChart3,
  ShieldCheck,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ROLES, type Role } from "@/lib/constants";
import type { NavKey } from "@/lib/i18n/translations";

export type NavItem = {
  labelKey: NavKey;
  href: string;
  icon: LucideIcon;
  roles?: Role[]; // omitted = all roles
};

const ALL: Role[] = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.AGENT];

export const SIDEBAR_NAV: NavItem[] = [
  { labelKey: "dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ALL },
  { labelKey: "listings", href: "/listings", icon: Building2, roles: ALL },
  { labelKey: "addListing", href: "/listings/new", icon: PlusCircle, roles: ALL },
  { labelKey: "deals", href: "/deals", icon: Handshake, roles: ALL },
  { labelKey: "leads", href: "/leads", icon: Users, roles: ALL },
  { labelKey: "myProfile", href: "/profile", icon: UserRound, roles: ALL },
  { labelKey: "analytics", href: "/analytics", icon: BarChart3, roles: ALL },
  {
    labelKey: "adminPanel",
    href: "/admin",
    icon: ShieldCheck,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
  { labelKey: "settings", href: "/settings", icon: Settings, roles: ALL },
];

export const BOTTOM_NAV: NavItem[] = [
  { labelKey: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { labelKey: "listings", href: "/listings", icon: Building2 },
  { labelKey: "addListing", href: "/listings/new", icon: PlusCircle },
  { labelKey: "deals", href: "/deals", icon: Handshake },
  { labelKey: "myProfile", href: "/profile", icon: UserRound },
];

export function visibleNav(items: NavItem[], role: Role): NavItem[] {
  return items.filter((i) => !i.roles || i.roles.includes(role));
}
