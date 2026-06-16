import type { LeadStatus } from "@/lib/constants";
import type { BadgeProps } from "@/components/ui/badge";

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  viewing: "Viewing",
  negotiating: "Negotiating",
  booked: "Booked",
  closed: "Closed",
  lost: "Lost",
};

export const LEAD_STATUS_TONE: Record<LeadStatus, NonNullable<BadgeProps["tone"]>> = {
  new: "info",
  contacted: "info",
  viewing: "warning",
  negotiating: "warning",
  booked: "gold",
  closed: "success",
  lost: "danger",
};

export const LEAD_SOURCE_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  public_form: "Public Form",
  manual: "Manual",
  telegram: "Telegram",
  referral: "Referral",
  walk_in: "Walk-in",
  facebook: "Facebook",
  tiktok: "TikTok",
  instagram: "Instagram",
};
