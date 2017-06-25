# youtube-downloader

CLI tool for searching for YouTube videos and downloading them locally.

__Note__: this tool depends on `youtube-dl`; this will need to be installed separately. If converting to mp4, `ffmpeg` is required also.

Tools in use in this project:
- [yargs](https://www.npmjs.com/package/yargs)
- [youtube-dl](https://github.com/rg3/youtube-dl/)
- [youtube-node](https://www.npmjs.com/package/youtube-node)

## Installation

After pulling from the Git repo, create a `config` folder and a `default.json` file with the contents below:

```
{
  "apiKey": "<your YouTube API key>",
  "youtubeOptions": [<specify youtube-dl options here>]
}
```
