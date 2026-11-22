import type { Metadata } from "next";
import { ServicesAdmin } from "@/components/admin/ServicesAdmin";

export const metadata: Metadata = { title: "Services and prices" };

export default function Page() {
  return <ServicesAdmin />;
}
