import { db } from "@/lib/db.server"
import { performOnAllObjects } from "@/lib/s3.server"
import { getCharacterDisplayName, getCharacterType } from "bin/utils"

export const addCharacters = async () => {
  await performOnAllObjects(
    async (response) => {
      if (!response.CommonPrefixes) {
        console.log("no common prefixes found")

        return
      }

      const characters = response.CommonPrefixes?.map(
        (c) => c.Prefix?.replace(/models\//, "").replace(/\//, "") ?? "",
      )
      console.log("got characters", characters)

      // create Character record in postgres db if needed
      for (const charName of characters) {
        try {
          await db.character.findFirstOrThrow({
            where: { name: charName },
          })
        } catch (error) {
          await db.character.create({
            data: {
              name: charName,
              type: getCharacterType(charName),
            },
          })
        }
      }
    },
    { prefix: "models/", delimiter: "/" },
  )

  // update character display names
  const champions = await db.character.findMany({
    where: {
      type: {
        equals: "champion",
      },
    },
  })

  for (const champion of champions) {
    const displayName = getCharacterDisplayName(champion.name)

    await db.character.update({
      where: {
        id: champion.id,
      },
      data: {
        displayName,
      },
    })
  }
}

export default addCharacters
