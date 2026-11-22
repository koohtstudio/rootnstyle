import type { MetadataRoute } from "next";
import { ALLOW_INDEXING } from "@/lib/config";

// While the site shows sample data, tell every crawler to stay out.
export default function robots(): MetadataRoute.Robots {
  return ALLOW_INDEXING ? { rules: { userAgent: "*", allow: "/", disallow: "/admin" } } : { rules: { userAgent: "*", disallow: "/" } };
}
