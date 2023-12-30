import { ComboBox } from "@/components/ui/combo-box"
import { db } from "@/lib/db.server"
import { type MetaFunction } from "@remix-run/node"
import { typedjson, useTypedLoaderData } from "remix-typedjson"

export const meta: MetaFunction = () => [{ title: "Home | Remix Render" }]

export const loader = async () => {
  const examples = await db.example.findMany({
    take: 100,
  })

  return typedjson({ examples })
}

export const action = async () => {}

export default function Index() {
  const data = useTypedLoaderData()

  const onChange = () => {}

  return (
    <main className="flex min-h-screen flex-col items-center justify-center space-y-4 bg-white">
      <p>Welcome to Modeler's Rift</p>
      <div className="w-[400px]">
        <ComboBox
          placeholders={{
            input: "Search champion...",
          }}
          onChange={(newValue) => {
            // onChange(newValue)
            // props.onChange?.(newValue)
          }}
          options={[
            { label: "Aatrox", value: "aatrox" },
            { label: "Annie", value: "annie" },
          ]}
          // defaultValue={value}
          classes={{
            popoverContent: "w-[400px]",
            button: "w-full",
          }}
        />
      </div>
    </main>
  )
}
