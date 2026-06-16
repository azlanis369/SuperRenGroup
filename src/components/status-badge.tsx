import { Badge } from "@/components/ui/badge";
import {
  LISTING_STATUS_LABELS,
  LISTING_STATUS_TONE,
  type ListingStatus,
} from "@/lib/constants";

export function StatusBadge({ status }: { status: ListingStatus }) {
  return (
    <Badge tone={LISTING_STATUS_TONE[status] ?? "neutral"}>
      {LISTING_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
