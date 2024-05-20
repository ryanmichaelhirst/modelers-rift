# Generating Models (.glb files)

This document explains how to generate glb models for all League of Legends champions.
using the `compress-glb` and `rename-glb-file` scripts.

## Overview

This doc covers how we can extract the 3D champions from the League of Legends (LoL) application. Using your local game install path for LoL you can use the LeagueConvert command line tool to generate model (.glb) files to use in modeling software like Blender or in this application. These model files come out pretty big, anywhere between 10MB - 40MB. Before these models can be used with this application we will need to run a few scripts to (1) rename the files to follow this form (skin0, skin1, ...., skin14), (2) compress the file contents to their smallest size, and finally (3) seed our local database and remote aws S3 bucket.

## Prerequisites

Before generating glb models, you will need:

- [Node.js](https://nodejs.org/) installed on your computer
- [LeagueConvert](https://github.com/Jochem-W/LeagueConvert/actions) downloaded on your computer
- [League of Legends](https://signup.leagueoflegends.com/en-us/signup/redownload) installed on your computer

## Instructions

To generate glb models, follow these steps:

1. Download the latest build of the LeagueConvert command line tool.
2. Locate your LoL install directory on your computer. Your install directory may be different from the example shown below.
3. Run `dotnet LeagueConvert.CommandLine.dll convert-all C:\"Riot Games"\"League of Legends"\Game\DATA\FINAL\Champions -a -s` to generate the model (.glb) files
4. Rename \LeagueConvert\output to \LeagueConvert\glb_models.
5. Move \LeagueConvert\glb_models to \modelers-rift\output\glb_models
6. Run `yarn run bin -c=job -f=rename-glb-files` to rename the files
7. Run `yarn run bin -c=job -f=compress-glb` to reduce the size of all files
8. Run `yarn run bin -c=job -f=upload-models` to upload to s3 bucket
9. Run `yarn run bin -c=job -f=add-characters` and `yarn run bin -c=job -f=add-assets` to seed postgres db
