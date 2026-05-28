import manifest from "@/data/catalog-manifest.json";

export type CatalogCategory = "metallic" | "flakes" | "neon";

export type CatalogImage = {
  id: string;
  slug: string;
  category: CatalogCategory;
  number: number | null;
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

export type CatalogManifest = {
  generatedAt: string;
  sourceDir: string;
  sourceFingerprint?: string;
  images: CatalogImage[];
};

type CatalogCategoryGroup = {
  key: CatalogCategory;
  label: string;
  count: number;
  images: CatalogImage[];
};

const categoryOrder: CatalogCategory[] = ["metallic", "flakes", "neon"];

const categoryLabels: Record<CatalogCategory, string> = {
  metallic: "Metallic",
  flakes: "Flakes",
  neon: "Neon",
};

const catalogManifest = manifest as CatalogManifest;

function compareCatalogImages(a: CatalogImage, b: CatalogImage) {
  if (a.number !== null && b.number !== null && a.number !== b.number) {
    return a.number - b.number;
  }
  if (a.number !== null && b.number === null) return -1;
  if (a.number === null && b.number !== null) return 1;
  return a.title.localeCompare(b.title, undefined, { numeric: true });
}

export function getCatalogManifest() {
  return catalogManifest;
}

export function getCatalogCategories(): CatalogCategoryGroup[] {
  const byCategory = categoryOrder.map((key) => ({
    key,
    label: categoryLabels[key],
    images: catalogManifest.images
      .filter((image) => image.category === key)
      .sort(compareCatalogImages),
  }));

  return byCategory.map((category) => ({
    ...category,
    count: category.images.length,
  }));
}

export function getCatalogImagesByCategory(category: CatalogCategory) {
  return catalogManifest.images
    .filter((image) => image.category === category)
    .sort(compareCatalogImages);
}
