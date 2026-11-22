import type { Metadata } from "next";
import { GalleryAdmin } from "@/components/admin/GalleryAdmin";

export const metadata: Metadata = { title: "Gallery" };

export default function Page() {
  return <GalleryAdmin />;
}
