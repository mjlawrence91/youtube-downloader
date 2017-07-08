# youtube-downloader

CLI tool written in TypeScript for searching for YouTube videos and downloading them locally.

__Note__: this tool depends on `youtube-dl`; this will need to be installed separately. If converting to mp4, `ffmpeg` is required also.

Tools in use in this project:
- [yargs](https://www.npmjs.com/package/yargs)
- [youtube-dl](https://github.com/rg3/youtube-dl/)
- [youtube-node](https://www.npmjs.com/package/youtube-node)

## Installation

After pulling from the Git repo (use the `typescript` branch), create a `config` folder and a `default.json` file with the contents below:

```
{
  "downloadPath": "<path where videos will be downloaded (defaults to "./media/")>"
  "apiKey": "<your YouTube API key>",
  "youtubeOptions": [<specify youtube-dl options here>]
}
```

## Usage

Run `npm run build` and then run one of the following commands:

```
node dist/index.js search "<search term>"   # Search for YouTube videos and save to queue
node dist/index.js show-queue               # Show all videos in queue
node dist/index.js download-queue           # Download all videos in queue
node dist/index.js download "<YouTube URL>" # Download video at URL
node dist/index.js clear-media-folder       # Delete media folder and all contents
node dist/index.js clear-queue              # Clear download queue
```
