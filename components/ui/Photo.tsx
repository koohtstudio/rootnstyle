import Image, { type ImageProps } from "next/image";

type Props = Omit<ImageProps, "placeholder" | "blurDataURL"> & { blur?: string };

/**
 * next/image everywhere. Photos the owner uploads in the demo are data: URLs,
 * which cannot go through the optimizer, so they render as is.
 */
export function Photo({ src, blur, alt, ...rest }: Props) {
  const raw = typeof src === "string" && /^(data:|blob:)/.test(src);
  if (raw) return <Image src={src} alt={alt} unoptimized {...rest} />;
  return <Image src={src} alt={alt} {...(blur ? { placeholder: "blur" as const, blurDataURL: blur } : {})} {...rest} />;
}
