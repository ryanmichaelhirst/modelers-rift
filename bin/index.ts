import dotenv from "dotenv"
import path from "path"
import util from "util"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"

util.inspect.defaultOptions.maxArrayLength = null

dotenv.config()

const run = async () => {
  // Parse flags
  const argv = await yargs(hideBin(process.argv)).options({
    c: {
      type: "string",
      alias: "cmd",
      desc: "Script command to execute",
      demandOption: "Command is mandatory",
    },
    i: {
      type: "string",
      alias: "input",
      desc: "Input directory to read files from",
    },
    o: {
      type: "string",
      alias: "output",
      desc: "Output directory to write files to",
    },
    f: {
      type: "string",
      alias: "file",
      desc: "Name of script file to run",
    },
    region: {
      type: "string",
      alias: "region",
      desc: "Region for your Lol Client (i.e. en_us, ja_JP, etc etc)",
    },
  }).argv

  const { c: command, i: input, o: output, region, f: file } = argv
  console.time(command)

  switch (command) {
    case "job":
      if (!file) throw new Error("command requires file (-f) flag")
      const fn = require(path.join(__dirname, "./jobs", file)).default
      await fn()
      break
    default:
      throw new Error("command not recognized")
  }

  console.timeEnd(command)
}

run()
