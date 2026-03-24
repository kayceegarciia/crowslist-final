"use client";

import { useEffect, useState } from "react";
import Image, { type ImageProps } from "next/image";

type FallbackImageProps = Omit<ImageProps, "src" | "alt"> & {
  src?: string | null;
  fallbackSrc: string;
  alt: string;
};

export function FallbackImage({
  src,
  fallbackSrc,
  alt,
  onError,
  ...props
}: FallbackImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string>(
    src && src.trim().length > 0 ? src : fallbackSrc
  );

  useEffect(() => {
    setCurrentSrc(src && src.trim().length > 0 ? src : fallbackSrc);
  }, [src, fallbackSrc]);

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      onError={(event) => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }

        onError?.(event);
      }}
    />
  );
}
