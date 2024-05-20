# Generating Audios (.bnk files)

This document explains how to extract audio files for all League of Legends champions, using the `generate-audio` job.

## Overview

This doc covers how we can extract the champion voice lines and sound effects from the League of Legends (LoL) application. Using your local game install path for LoL you can use the Obsidian tool to extract the metadata within each champion .wad file. These wad files are a common file type used in game development, and contain all the low level character information including visual and audio information. Before the audio files can be used with this application we will need to run a few scripts to (1) extract the audio files from the wad files, (2) transform the audio files to a human readable format, and finally (3) seed our local database with the audio files.

## Prerequisites

Before generating glb models, you will need:

- [Node.js](https://nodejs.org/) installed on your computer
- [Obsidian](https://github.com/Crauzer/Obsidian/releases) downloaded on your computer
- [League of Legends](https://signup.leagueoflegends.com/en-us/signup/redownload) installed on your computer

## Instructions

To generate voice lines and sounds effects, follow these steps:

1. Download the latest build of the Obsidian tool.
2. Locate your LoL install directory on your computer. Your install directory may be different from the example shown below.
3. Open Obsidian and set the League of Legends directory to your local path.
4. After the directory is set and indexed by Obsidian, select the checkbox for Game/DATA/Final/Champions and click "File -> Extract Selected."
5. Set the output directory to \modelers-rift\input
6. Run `pnpm run bin -c=job -f=create-audios` to generate the sound effects and voice lines for each champion
7. Run `pnpm run bin -c=job -f=add-characters` and `pnpm run bin -c=job -f=add-assets` to seed postgres db

### Debugging

If you get an error when trying to run "bin/executables/bnk-extract.exe", give read, write, and execute permissions for the file:

`chmod 777 bin/executables/bnk-extract.exe`

### Convert BNK -> OGG / WAV

https://www.youtube.com/watch?v=cMXan62JCuk

https://github.com/Morilli/bnk-extract/releases/tag/v1.6

`./bnk-extract.exe --audio path/to/audio.[bnk|wpk] [--bin path/to/skinX.bin --events path/to/events.bnk] [-o path/to/output] [--wems-only] [--oggs-only]`
