"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Terminal } from "lucide-react";
import { clearDemoData } from "@/lib/actions/demo";
import { DEMO_RESET_PHRASE } from "@/lib/demo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

export function DemoResetCard() {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  function onClear() {
    setResult(null);
    startTransition(async () => {
      const res = await clearDemoData(confirm);
      if (res.ok) {
        setResult({ ok: true, msg: res.message });
        setConfirm("");
        router.refresh();
      } else {
        setResult({ ok: false, msg: res.error });
      }
    });
  }

  return (
    <Card className="border-amber-200 bg-amber-50/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <AlertTriangle className="h-5 w-5" /> Pengurusan Data Demo
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Bersihkan semua data demo (rekod bertanda{" "}
          <span className="font-medium">is_demo</span>) termasuk akaun demo.
          Tindakan ini tidak boleh dibatalkan.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="confirm">
            Taip{" "}
            <span className="font-mono font-semibold text-foreground">
              {DEMO_RESET_PHRASE}
            </span>{" "}
            untuk sahkan
          </Label>
          <Input
            id="confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={DEMO_RESET_PHRASE}
            autoComplete="off"
          />
        </div>

        <Button
          variant="destructive"
          onClick={onClear}
          disabled={isPending || confirm.trim() !== DEMO_RESET_PHRASE}
        >
          {isPending ? <Spinner /> : null} Clear Demo Data
        </Button>

        {result ? (
          <p
            className={
              result.ok
                ? "flex items-center gap-1.5 text-sm text-success"
                : "text-sm text-destructive"
            }
          >
            {result.ok ? <Check className="h-4 w-4" /> : null}
            {result.msg}
          </p>
        ) : null}

        <div className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
          <p className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
            <Terminal className="h-3.5 w-3.5" /> Re-seed / Reset (CLI)
          </p>
          <p>
            Untuk menjana semula data demo, jalankan di terminal server:
          </p>
          <pre className="mt-1.5 overflow-x-auto rounded bg-muted px-2 py-1.5 font-mono">
            npm run seed:demo   {/* seed */}
            {"\n"}npm run seed:reset  {/* clear + seed */}
            {"\n"}npm run seed:clear  {/* clear only */}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
