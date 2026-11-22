import type { Metadata } from "next";
import { MessagesView } from "@/components/admin/MessagesView";

export const metadata: Metadata = { title: "Sent messages" };

export default function Page() {
  return <MessagesView />;
}
