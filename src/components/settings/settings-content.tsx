"use client";

import Link from "next/link";
import { User, ExternalLink, Shield, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DemoBadge } from "@/components/demo-badge";
import { SignOutButton } from "@/components/settings/sign-out-button";
import { LanguageCard } from "@/components/settings/language-selector";
import { useLanguage } from "@/contexts/language-context";

type Props = {
  email: string;
  roleLabel: string;
  roleTone: NonNullable<BadgeProps["tone"]>;
  slug: string | null | undefined;
  isAdmin: boolean;
  demoMode: boolean;
};

export function SettingsContent({
  email,
  roleLabel,
  roleTone,
  slug,
  isAdmin,
  demoMode,
}: Props) {
  const { t } = useLanguage();
  const s = t.settings;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{s.title}</h1>
        <p className="text-muted-foreground">{s.subtitle}</p>
      </div>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>{s.account}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {s.email}
              </p>
              <p className="truncate font-medium">{email}</p>
            </div>
            <Badge tone={roleTone}>{roleLabel}</Badge>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button asChild variant="outline">
              <Link href="/profile">
                <User className="h-4 w-4" /> {s.myProfile}
              </Link>
            </Button>
            {slug ? (
              <Button asChild variant="outline">
                <Link href={`/agent/${slug}`}>
                  <ExternalLink className="h-4 w-4" /> {s.publicProfile}
                </Link>
              </Button>
            ) : null}
            {isAdmin ? (
              <Button asChild variant="outline">
                <Link href="/admin">
                  <Shield className="h-4 w-4" /> {s.adminPanel}
                </Link>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <LanguageCard />

      {/* Demo mode */}
      <Card>
        <CardHeader>
          <CardTitle>{s.demoMode}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {demoMode ? (
            <>
              <DemoBadge />
              <p className="text-sm text-muted-foreground">{s.demoActive}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{s.demoInactive}</p>
          )}
        </CardContent>
      </Card>

      {/* Legal */}
      <Card>
        <CardHeader>
          <CardTitle>{s.legal}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/legal/privacy">
              <FileText className="h-4 w-4" /> {s.privacy}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/legal/terms">
              <FileText className="h-4 w-4" /> {s.terms}
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="pt-2">
        <SignOutButton />
      </div>
    </div>
  );
}
