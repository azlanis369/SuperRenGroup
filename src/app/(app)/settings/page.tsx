import type { Metadata } from "next";
import Link from "next/link";
import { User, ExternalLink, Shield, FileText } from "lucide-react";
import { requireOnboardedUser } from "@/lib/auth";
import { ROLES, type Role } from "@/lib/constants";
import { DEMO_MODE } from "@/lib/demo";
import type { BadgeProps } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DemoBadge } from "@/components/demo-badge";
import { SignOutButton } from "@/components/settings/sign-out-button";
import { LanguageCard } from "@/components/settings/language-selector";
import { SettingsContent } from "@/components/settings/settings-content";

export const metadata: Metadata = { title: "Settings" };

const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  agent: "Agent",
};

const ROLE_TONE: Record<Role, NonNullable<BadgeProps["tone"]>> = {
  super_admin: "primary",
  admin: "gold",
  agent: "neutral",
};

export default async function SettingsPage() {
  const user = await requireOnboardedUser();
  const slug = user.profile?.slug;
  const admin = user.role === ROLES.ADMIN || user.role === ROLES.SUPER_ADMIN;

  return (
    <SettingsContent
      email={user.email}
      roleTone={ROLE_TONE[user.role]}
      roleLabel={ROLE_LABELS[user.role]}
      slug={slug}
      isAdmin={admin}
      demoMode={DEMO_MODE}
    />
  );
}
