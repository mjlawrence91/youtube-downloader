#! /usr/local/bin/node
const fs = require('fs')
const path = require('path')
const {promisify} = require('util')

const yargs = require('yargs').argv
const {red, blue, green, yellow} = require('chalk')
const del = require('del')

const YouTubeDownloader = require('./lib/youtubeDownloader')

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const downloader = new YouTubeDownloader()

;(async _ => {
  const [command] = yargs._

  switch (command) {
    case 'search':
      await searchForVideos()
      break

    case 'show-queue':
      await showQueue()
      break

    case 'download':
      await downloadVideo()
      break

    case 'download-queue':
      await downloadQueue()
      break

    case 'clear-media-folder':
      await clearMediaFolder()
      break

    default:
      break
  }
})()

async function searchForVideos () {
  const {term} = yargs

  if (term) {
    console.log(`Searching YouTube for "${term}"...\n`)
    const results = await downloader.search(term)

    if (results.length > 0) {
      console.log(blue(`${results.length} videos found.\n`))

      results.map(video => `- ${video.title} (${video.url})`)
        .forEach(video => console.log(video))

      await writeFile(path.join(__dirname, downloader._path, 'queue.json'), JSON.stringify(results))

      console.log(green(`\n${results.length} videos added to queue.`))
    }
  }
}

async function showQueue () {
  const queuePath = path.join(__dirname, downloader._path, 'queue.json')
  const queueString = Buffer.from(await readFile(queuePath), 'utf-8').toString()
  const queue = JSON.parse(queueString)

  if (!queue || queue.length === 0) {
    console.log(red('There are no videos in the download queue.'))
    return
  }

  console.log(blue(`${queue.length} videos found.\n`))

  queue.map(video => `- ${video.title} (${video.url})`)
    .forEach(video => console.log(video))
}

async function downloadQueue () {
  if (downloader.simulate) {
    console.log(yellow('*** SIMULATION ONLY ***'))
  }

  const queuePath = path.join(__dirname, downloader._path, 'queue.json')
  const queueString = Buffer.from(await readFile(queuePath), 'utf-8').toString()
  const queue = JSON.parse(queueString)

  if (!queue || queue.length === 0) {
    console.log(red('There are no videos in the download queue.'))
    return
  }

  downloader.videos = queue
  // downloader.videos = queue.slice(0, 1)

  console.log(`Downloading all videos in queue...\n`)
  await downloader.downloadAll()

  console.log(green(`\nAll videos downloaded to ${downloader._path}.`))
}

async function downloadVideo () {
  const {url} = yargs

  if (downloader.simulate) {
    console.log(yellow('*** SIMULATION ONLY ***'))
  }

  if (!url) {
    console.log(red(`Please specify a URL to download.`))
    return
  }

  console.log(`Downloading video from ${url}...\n`)
  await downloader.download(url)
}

async function clearMediaFolder () {
  console.log('Clearing media folder...')
  await del([downloader._path])
  console.log(green('Cleardown complete.'))
}
