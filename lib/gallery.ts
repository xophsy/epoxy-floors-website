import manifest from "@/data/gallery-manifest.json";

export type GalleryImage = {
  id: string;
  slug: string;
  title: string;
  alt: string;
  width: number;
  height: number;
  thumbnail: {
    width: number;
    height: number;
    avif: string;
    webp: string;
  };
  responsive: Array<{
    width: number;
    height: number;
    avif: string;
    webp: string;
  }>;
  lightbox: {
    src: string;
    width: number;
    height: number;
  };
};

type GalleryManifest = {
  generatedAt: string;
  sourceDir: string;
  sourceFingerprint?: string;
  images: GalleryImage[];
};

const galleryManifest = manifest as GalleryManifest;

export function getGalleryManifest() {
  return galleryManifest;
}

export function getGalleryImages() {
  return galleryManifest.images;
}
