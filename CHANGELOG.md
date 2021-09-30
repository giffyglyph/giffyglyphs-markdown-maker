![Markdown Maker Social Banner](./markdownMaker.png)

# Changelog

[![Support me on Patreon](https://img.shields.io/endpoint.svg?url=https%3A%2F%2Fshieldsio-patreon.vercel.app%2Fapi%3Fusername%3Dgiffyglyph%26type%3Dpatrons&style=flat-square)](https://patreon.com/giffyglyph)
[![Twitter](https://img.shields.io/twitter/follow/giffyglyph?color=%231DA1F2&style=flat-square)](http://twitter.com/giffyglyph)
[![Twitch](https://img.shields.io/twitch/status/giffyglyph?color=%23a45ee5&style=flat-square)](http://twitch.tv/giffyglyph)

## v2.0.1
* Format now specifies a markdownMaker version, not publisher.

## v2.0.0
* Added GPLv3.0 license.
* Added author/description fields to format/project.js.
* Added maker configuration class.
* Added "check" program to confirm setup is valid.
* Added jsonManager and integrated it with build processes.
* Removed pagebreak markdown extension; no longer needed.
* Renamed extension to content for more cross-format flexibility.
* Added markdown extensions for tables and figures.
* Added changelog and readme.

## v1.0.1
* Updated package.json to use _dependencies_, not devDependencies.

## v1.0.0
* First working commit of the project.
* Total overhaul of the original _Book Binder_ codebase.
* Converts **markdown** into HTML using **marked.js**.
* Applies scripts, stylesheets, and more.
* Added support for four programs: build, clean, watch, and export.
* Can export artifacts in four formats: PDF, PNG, JPG, and ZIP.
* Added basic markdown extensions (page, example, panel, colbreak, pagebreak, etc).
* Added eslint support to check/enforce code standards. Can run with "npm run lint-js".
* Fully documented code with jsdoc. Can generate documentation with "npm run generate-docs".
