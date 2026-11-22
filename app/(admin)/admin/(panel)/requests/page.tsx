import type { Metadata } from "next";
import { Suspense } from "react";
import { RequestsView } from "@/components/admin/RequestsView";

export const metadata: Metadata = { title: "Booking requests" };

export default function Page() {
  return (
    <Suspense>
      <RequestsView />
    </Suspense>
  );
}
