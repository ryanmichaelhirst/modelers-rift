import { db } from "@/lib/db.server"
import { BUCKET_NAME, performOnAllObjects } from "@/lib/s3.server"
import { ListObjectsV2CommandOutput } from "@aws-sdk/client-s3"
import { ChampionBasicInfo, ChampionDetailedInfo } from "bin/types"

import { capitalize, getJsonName } from "bin/utils"
import groupBy from "lodash.groupby"

/**
 * Example S3 object: { Key: 'sfx/aatrox/skin7/playsfx_q2_on_hitnormalplayer_2.ogg', LastModified: '2022-07-27T03:36:13.000Z', Size: 12345 }
 */
export async function addAssets() {
  // TODO: perform api request to get latest patch
  const latestPatch = "'12.18.1'"

  // get current champions from ddragon api
  const { data } = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${latestPatch}/data/en_US/champion.json`,
  ).then<{ data: Record<string, ChampionBasicInfo> }>((res) => res.json())
  const ddragonChampions = Object.keys(data).reduce<Record<string, any>>((acc, cur) => {
    const lowerCaseName = cur.toLowerCase()

    return {
      ...acc,
      [lowerCaseName]: {
        ...data[cur],
        square_asset: `https://ddragon.leagueoflegends.com/cdn/${latestPatch}/img/champion/${cur}.png`,
      },
    }
  }, {})

  // get skiin info from ddragon api
  const skinsByChampion = await Object.entries(ddragonChampions).reduce<
    Promise<Record<string, ChampionDetailedInfo["skins"]>>
  >(async (accProm, cur) => {
    const acc = await accProm
    const [key, { name }] = cur

    if (!name || name === "Wukong") return acc

    // get champion info from ddragon api
    const jsonName = getJsonName(name)
    const { data } = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${latestPatch}/data/en_US/champion/${jsonName}.json`,
    ).then<{ data: Record<string, ChampionDetailedInfo> }>((res) => res.json())

    // i.e. { Aatrox: { allytips; blurb; etc etc } }
    const keys = Object.keys(data).map((key) => key)
    const firstKey = keys[0]
    const detailedInfo = data[firstKey]

    return {
      ...acc,
      [key.toLowerCase()]: detailedInfo.skins,
    }
  }, Promise.resolve({}))

  const insert = async (response: ListObjectsV2CommandOutput) => {
    if (!response.Contents) {
      console.log("no objects found")

      return
    }

    const objects = response.Contents.map((c) => {
      const key = c.Key ?? ""
      const keyParts = key.split("/")
      const characterName = (() => {
        if (keyParts && keyParts.length >= 1) return keyParts[1]

        return ""
      })()

      return {
        key,
        characterName: characterName ?? "",
      }
    })

    for (const [key, value] of Object.entries(groupBy(objects, "characterName"))) {
      let chromaNum = 1

      const assets = value.map(({ key, characterName }) => {
        const matches = key.match(/\W*(skin)\d*\W*/gi)
        const currentSkin = matches ? matches[0].replace(/\/*\.*/g, "") : ""
        const type = (() => {
          if (key.includes("model")) return "model"
          if (key.includes("sfx")) return "sfx"

          return "vo"
        })()
        const name = (() => {
          const keyParts: string[] = key.split("/")
          const fileName = keyParts.at(keyParts.length - 1) ?? ""

          if (type === "model") {
            const skins = skinsByChampion[characterName.toLowerCase()]
            const matchingSkin = skins?.find((s) => `skin${s.num}` === currentSkin)?.name
            if (matchingSkin) return matchingSkin
            chromaNum++

            return `Chroma ${chromaNum}`
          }

          // sfx or vo
          return capitalize(fileName.replace(/.ogg|playsfx_/gi, "").replace(/_/gi, " "))
        })()

        return {
          type,
          uri: `s3://${BUCKET_NAME}/${key}`,
          url: `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`,
          name,
          skin: currentSkin,
        }
      })

      // upload assets to s3 for given character
      const character = await db.character.findFirst({
        where: { name: key },
      })
      if (!character) return

      const updates = assets.map((a) =>
        db.asset.upsert({
          where: { uri: a.uri },
          update: { ...a },
          create: { ...a, characterId: character.id },
        }),
      )

      await db.$transaction(updates)
    }
  }

  await performOnAllObjects(
    async (response) => {
      await insert(response)
    },
    {
      prefix: "models",
    },
  )

  await performOnAllObjects(
    async (response) => {
      await insert(response)
    },
    {
      prefix: "sfx",
    },
  )

  await performOnAllObjects(
    async (response) => {
      await insert(response)
    },
    {
      prefix: "vo",
    },
  )
}

export default addAssets
