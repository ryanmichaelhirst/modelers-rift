import { db } from "@/lib/db.server"

import { addAssets } from "bin/jobs/add-assets"
import { addCharacters } from "bin/jobs/add-characters"

/**
 * Average runtime: 5:29.915 (m:ss.mmm)
 */
export const seedDb = async () => {
  // add characters
  const characters = await db.character.findMany()
  if (characters.length === 0) {
    await addCharacters()
  }

  // add assets
  const assets = await db.asset.findMany()
  if (assets.length === 0) {
    await addAssets()
  }
}
