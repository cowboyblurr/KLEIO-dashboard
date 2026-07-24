import type { ArtistWork } from "@/lib/kleio-data"

const artistWorkImageOverrides: Record<string, Record<string, string>> = {
  "amina-el-badri": {
    "between-breaths": "/profile-assets/artists/amina-el-badri/between-breaths.svg",
    thresholds: "/profile-assets/artists/amina-el-badri/thresholds.svg",
    "liminal-field": "/profile-assets/artists/amina-el-badri/liminal-field.svg",
  },
}

export function resolveArtistWorkImage(artistId: string, work: ArtistWork): string {
  const override = artistWorkImageOverrides[artistId]?.[work.id]
  if (override) return override
  return work.image
}
