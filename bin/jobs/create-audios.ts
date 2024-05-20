import { extractSounds, renameOggFiles } from "bin/utils"

export const createAudios = async () => {
  await extractSounds()
  await renameOggFiles()
}

export default createAudios
