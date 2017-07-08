#! /usr/local/bin/node
import * as fs from 'fs'
import * as path from 'path'
import {promisify} from 'util'

import {argv} from 'yargs'
import {red, blue, green, yellow} from 'chalk'
import * as del from 'del'

import YouTubeDownloader from './lib/youtubeDownloader'

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const downloader: YouTubeDownloader = new YouTubeDownloader()

const queuePath: string = path.resolve(downloader.path, 'queue.json')

;(async _ => {
  const [command, search] = argv._

  switch (command) {
    case 'search':
      await searchForVideos(search)
      break

    case 'show-queue':
      await showQueue()
      break

    case 'clear-queue':
      await clearQueue()
      break

    case 'download-queue':
      await downloadQueue()
      break

    case 'download':
      await downloadVideo()
      break

    case 'clear-media-folder':
      await clearMediaFolder()
      break

    default:
      break
  }
})()

async function searchForVideos (search: string) {
  if (!search) {
    console.log(red('Please provide a search term.'))
    return
  }

  console.log(`Searching YouTube for "${search}"...\n`)

  const results = await downloader.search(search)

  if (results.length > 0) {
    console.log(blue(`${results.length} videos found.\n`))

    results.map(video => `- ${video.title} (${video.url})`)
      .forEach(video => console.log(video))

    await writeFile(queuePath, JSON.stringify(results))

    console.log(green(`\n${results.length} videos added to queue.`))
  }
}

async function showQueue () {
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

  console.log(green(`\nAll videos downloaded to ${downloader.path}.`))
}

async function downloadVideo () {
  const [, url] = argv._

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
  await del([downloader.path])
  console.log(green('Cleardown complete.'))
}

async function clearQueue () {
  console.log('Clearing queue...')
  await del([queuePath])
  console.log(green('Cleardown complete.'))
}
