"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { adminResetAndSeedMarketplace } from "@/actions/admin";
import { Button } from "@/components/ui/button";

export function AdminSeedControls() {
  const [isPending, startTransition] = useTransition();

  function handleSeed() {
    const shouldContinue = window.confirm(
      "This will delete all existing posts and reseed fake users + posts. Continue?"
    );

    if (!shouldContinue) {
      return;
    }

    startTransition(async () => {
      const response = await adminResetAndSeedMarketplace();

      if (response?.error) {
        toast.error(response.error);
        return;
      }

      if (response?.success) {
        toast.success(response.success);
      }
    });
  }

  return (
    <section className="rounded-lg border border-border bg-white p-4 space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-secondary">Seed Marketplace Data</h2>
        <p className="text-sm text-accent">
          Deletes all current posts, then creates 10 fake accounts and 30 new
          posts.
        </p>
      </div>

      <Button
        type="button"
        onClick={handleSeed}
        disabled={isPending}
        className="bg-primary text-white hover:bg-secondary"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Seeding...
          </>
        ) : (
          "Reset Posts + Seed Data"
        )}
      </Button>
    </section>
  );
}
