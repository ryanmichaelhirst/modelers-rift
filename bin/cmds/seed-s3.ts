import { uploadModels } from "bin/jobs/upload-models"
import { uploadSounds } from "bin/jobs/upload-sounds"

export const seedS3 = async () => {
  // upload glb files
  await uploadModels("rift")
  // upload sfx and vo files
  await uploadSounds()
}
