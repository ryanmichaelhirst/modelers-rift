import { HTTP_SAFE_CHAMPION_NAMES } from "./constants"

import { exec, execSync } from "child_process"
import fs from "fs"
import PQueue from "p-queue"
import path from "path"

export function getCharacterType(name: string) {
  const championType = HTTP_SAFE_CHAMPION_NAMES.map((n) => n.toLowerCase()).includes(
    name.toLowerCase(),
  )
  const tftType = name.includes("tft")
  const summonersRiftType = name.includes("sru")

  if (championType) return "champion"
  if (tftType) return "team_fight_tactics"
  if (summonersRiftType) return "summoners_rift"

  return "unknown"
}

// given 'tahmkench' returns 'Tahm Kench'
export function getCharacterDisplayName(name: string) {
  if (name.toLowerCase() === "jarvaniv") {
    return "Jarvan IV"
  }

  return HTTP_SAFE_CHAMPION_NAMES.find((cn) => cn.toLowerCase() === name.toLowerCase())
    ?.split(/(?=[A-Z])/)
    .join(" ")
}

async function createOrWipeDir(dirPath: string) {
  await new Promise<void>(async (resolve, reject) => {
    const makeDirCmd = `mkdir -p ${dirPath}`

    try {
      // wipe directory if it exists
      await fs.promises.access(dirPath)
      console.log(`rm -r ${dirPath}`)
      execSync(`rm -r ${dirPath}`)
    } catch (err) {
      // directory doesn't exist, create it
      console.log(`[Failed] rm -r ${dirPath}`, err)
    } finally {
      exec(makeDirCmd, (err) => {
        if (err) {
          console.log(`[Failed] ${makeDirCmd}`, err)
          reject()
        } else {
          console.log(`[Succeeded] ${makeDirCmd}`)
          resolve()
        }
      })
    }
  })
}

// create ogg files from bnk files
async function extractBnkContent(args: { inputDir: string; outputDir: string; soundType: string }) {
  const { inputDir, outputDir, soundType } = args
  const queue = new PQueue({ concurrency: 10 })
  const region = "en_us"

  // determine whether to read from "sfx" or "vo" directory
  const champDirPath =
    soundType === "sfx"
      ? path.join(inputDir, `assets/sounds/wwise2016/${soundType}/characters`)
      : path.join(inputDir, `assets/sounds/wwise2016/${soundType}/${region}/characters`)

  // get champion directories i.e. "/aatrox", "/ahri", "/akali
  const champDirs = await fs.promises.readdir(champDirPath)

  for (const cdir of champDirs) {
    // get skin directories for each champion
    // i.e. "../sounds/wwise2016/sfx/characters/aatrox/skins/base", "../sounds/wwise2016/sfx/characters/aatrox/skins/skin01"
    const skinDirPath = path.join(champDirPath, cdir, "skins")
    const skinDirs = await fs.promises.readdir(skinDirPath)

    for (const sdir of skinDirs) {
      // get all sound files for each skin folder
      const filesPath = path.join(skinDirPath, sdir)
      let binFile = sdir === "base" ? "skin0" : "skin"

      // converts input/assets/characters/aatrox/skins/skin01 into skin1.bin
      if (sdir !== "base") {
        const parts = sdir.split("skin")
        binFile += parts[1].replace(/^0+/, "")
      }

      const binPath = path.join(inputDir, "data/characters/", cdir, `skins/${binFile}.bin`)
      const audioPath =
        soundType === "sfx"
          ? path.join(filesPath, `${cdir}_${sdir}_${soundType}_audio.bnk`)
          : path.join(filesPath, `${cdir}_${sdir}_${soundType}_audio.wpk`)
      const eventPath = path.join(filesPath, `${cdir}_${sdir}_${soundType}_events.bnk`)
      const outputPath = path.join(outputDir, cdir, soundType, binFile)
      const bnkExe = path.join(process.env.APP_HOME || "", "bin/executables/bnk-extract.exe")
      const extractCmd = `${bnkExe} --audio ${audioPath} --bin ${binPath} --events ${eventPath} -o ${outputPath} --oggs-only`

      queue.add(() => {
        return new Promise<void>(async (resolve, reject) => {
          // extract .ogg files from bnk sound files
          exec(extractCmd, (err) => {
            if (err) {
              console.log(`Could not run bnk-extract for ${outputPath}`)
              console.log(err.message)
              reject(err)
            } else {
              console.log(extractCmd)
              resolve()
            }
          })
        })
      })
    }
  }

  await queue.onIdle()
}

// read extracted champion assets from WAD files from Obsidian
export const extractSounds = async () => {
  const inputDir = "input"
  const outputDir = "output/ogg_audios"

  await createOrWipeDir(outputDir)

  const queue = new PQueue({ concurrency: 2 })

  queue.add(() => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await extractBnkContent({ inputDir, outputDir, soundType: "vo" })
        resolve()
      } catch (err) {
        console.log("Failed to schedule vo extraction", err)
        reject()
      }
    })
  })

  queue.add(() => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await extractBnkContent({ inputDir, outputDir, soundType: "sfx" })
        resolve()
      } catch (err) {
        console.log("Failed to schedule sfx extraction", err)
        reject()
      }
    })
  })

  await queue.onIdle()
}

async function findFilesInFolder(folderPath: string): Promise<string[]> {
  let fileList: string[] = []
  const items = await fs.promises.readdir(folderPath)

  // Map the items to an array of promises that resolve to file paths
  const promises = items.map(async (item) => {
    const itemPath = path.join(folderPath, item)

    // Check if item is a file
    const itemStat = await fs.promises.stat(itemPath)
    if (itemStat.isFile()) {
      fileList.push(itemPath)
    }
    // If item is a directory, recursively call this function
    else {
      const files = await findFilesInFolder(itemPath)
      fileList = fileList.concat(files)
    }
  })

  // Wait for all promises to resolve
  await Promise.all(promises)

  return fileList
}

function formatVoiceLineFileName(filePath: string, champName: string, counter: number) {
  // get all parts of the file path
  // given /output/ogg_audios/aatrox/vo/skin21/Play_vo_AatroxSkin21_Taunt3DGeneral/70443218.gg
  // returns ["output", "ogg_audios", "aatrox", .... "70443218.gg"]
  const fileParts = filePath.split("/")
  // the name of the sound will always be the second to last folder
  const item = fileParts.find((p) => p.includes("skin"))
  if (!item) return
  const nameIndex = fileParts.indexOf(item)
  if (!nameIndex) return

  const capitalizedChampName =
    champName.substring(0, 1).toUpperCase() + champName.substring(1).toLowerCase()

  const namedDir = fileParts[nameIndex + 1]
  let newFileName = namedDir
    .replace("Play_sfx_", "")
    .replace(`Play_vo_`, "")
    .replace(new RegExp(capitalizedChampName, "g"), "")
    .replace(/Skin\d+/, "")
    .replace(/_/g, "")

  if (counter !== 0) {
    newFileName += ` ${counter}`
  }

  // get the path that contains /output/ogg_audios/aatrox/vo/skin21
  const startIndex = filePath.indexOf(namedDir)
  const outputPath = filePath.slice(0, startIndex)

  return outputPath + `${newFileName}.ogg`
}

export async function renameOggFiles() {
  // get all champion directories
  const inputDir = path.join(process.env.APP_HOME || "", "output/ogg_audios")
  const champDirs = await fs.promises.readdir(inputDir)

  // iterate over each champ directory
  for (const cdir of champDirs) {
    const files = await findFilesInFolder(path.join(inputDir, cdir))
    // logger.info('list of files')
    // logger.debug(files)

    let counter = 0
    let directory = ""
    for (const filePath of files) {
      const fileParts = filePath.split("/")
      const currentDirectory = fileParts[fileParts.length - 2]
      if (directory !== currentDirectory) {
        counter = 0
      }
      if (directory === currentDirectory) {
        counter++
      }

      const formattedName = formatVoiceLineFileName(filePath, cdir, counter)
      if (!formattedName) continue

      console.log(formattedName)
      directory = currentDirectory
      // await fs.promises.rename(file, formattedName)
    }
  }
}

// given 'the dog' returns 'The Dog'
export function capitalize(str?: string | null) {
  if (!str) return ""

  return str
    .split(" ")
    .reduce((acc, cur) => {
      acc += cur.charAt(0).toUpperCase() + cur.substring(1) + " "

      return acc
    }, "")
    .trimEnd()
}

// given 'aurelionsol' returns 'AurelionSol'
export function getJsonName(name: string) {
  const httpSafeName = name
    ?.replace(/[.'& ]/g, "")
    .replace("Willump", "")
    .replace("Glasc", "")
    .toLowerCase()

  return HTTP_SAFE_CHAMPION_NAMES.find((cn) => cn.toLowerCase() === httpSafeName)
    ?.split(/(?=[A-Z])/)
    .join("")
}
