"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateListingStatus } from "@/lib/actions/listing";
import {
  LISTING_STATUSES,
  LISTING_STATUS_LABELS,
  type ListingStatus,
} from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function StatusChanger({
  listingId,
  current,
}: {
  listingId: string;
  current: ListingStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onChange(next: string) {
    startTransition(async () => {
      await updateListingStatus(listingId, next as ListingStatus);
      router.refresh();
    });
  }

  return (
    <Select value={current} onValueChange={onChange} disabled={isPending}>
      <SelectTrigger className="w-full sm:w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LISTING_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {LISTING_STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
