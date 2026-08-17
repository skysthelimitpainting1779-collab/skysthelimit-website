import Image, { type ImageProps } from 'next/image';

type ResponsiveImageProps = Omit<ImageProps, 'alt' | 'src' | 'decoding' | 'width' | 'height'> & {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export default function ResponsiveImage({
  src,
  alt,
  width,
  height,
  priority = false,
  loading = 'lazy',
  fetchPriority = 'auto',
  ...props
}: ResponsiveImageProps) {
  const unoptimized = src.startsWith('http://') || src.startsWith('https://');

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      width={width}
      height={height}
      preload={priority}
      loading={priority ? undefined : loading}
      decoding="async"
      fetchPriority={priority ? undefined : fetchPriority}
      unoptimized={unoptimized}
    />
  );
}
