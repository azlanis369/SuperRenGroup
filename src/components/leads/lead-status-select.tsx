"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLeadStatus } from "@/lib/actions/lead";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/constants";
import { LEAD_STATUS_LABELS } from "@/components/leads/lead-status";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LeadStatusSelect({
  id,
  status,
}: {
  id: string;
  status: LeadStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onChange(value: string) {
    startTransition(async () => {
      await updateLeadStatus(id, value as LeadStatus);
      router.refresh();
    });
  }

  return (
    <Select value={status} onValueChange={onChange} disabled={isPending}>
      <SelectTrigger className="h-9 w-[150px] text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LEAD_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {LEAD_STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
