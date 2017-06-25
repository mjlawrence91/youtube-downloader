const fs = require('fs')
const {promisify} = require('util')
const childProcess = require('child_process')
const config = require('config')
const YouTube = require('youtube-node')

class YouTubeDownloader {
  static get API_KEY () {
    return config.get('apiKey')
  }

  static get YOUTUBE_OPTIONS () {
    return config.get('youtubeOptions')
  }

  constructor () {
    this._videos = null
    this._simulate = false
    this._path = 'media'

    this._youTube = new YouTube()
    this._youTube.setKey(YouTubeDownloader.API_KEY)
    this._youtubeSearch = promisify(this._youTube.search)

    this._init()
  }

  async _init () {
    const mkdir = promisify(fs.mkdir)
    const stat = promisify(fs.stat)

    try {
      await stat(this._path)
    } catch (e) {
      await mkdir(this._path)
    }
  }

  async search (term, resultCount = 50, options = {store: true}) {
    if (!term) {
      return Promise.reject(new Error('Please specify a search term.'))
    }

    if (!resultCount) {
      return Promise.reject(new Error('Please specify a page size of results to return.'))
    }

    if (resultCount > 50) {
      return Promise.reject(new Error('Page size cannot exceed 50 results.'))
    }

    const {items} = await this._youtubeSearch(term, resultCount)

    const videos = items.filter(result => result.id.kind === 'youtube#video')
      .map(result => {
        const videoID = result.id.videoId
        const url = `https://www.youtube.com/watch?v=${videoID}`
        const title = result.snippet.title.replace(/: /g, ' - ')
        return {title, id: videoID, url}
      })

    if (options && options.store) {
      this.videos = videos
    }

    return this.videos
  }

  async downloadAll () {
    if (!this._videos || this._videos.length === 0) {
      return Promise.reject(new Error('There are no videos in the download queue.'))
    }

    this._videos.forEach(async video => {
      await this.download(video.url)
    })
  }

  async download (url) {
    if (!url) {
      return Promise.reject(new Error('Please specify a URL to download.'))
    }

    return new Promise((resolve, reject) => {
      const args = [url, ...this._resolveYouTubeOptions()]

      if (this._simulate) {
        args.push('--simulate')
      }

      const ytdl = childProcess.spawn('youtube-dl', args)
      ytdl.stdout.on('data', data => console.log(`stdout: ${data}`))
      ytdl.stderr.on('data', data => console.log(`stderr: ${data}`))
      ytdl.on('close', _ => resolve())
    })
  }

  _resolveYouTubeOptions () {
    if (!this._path) {
      throw new Error('Please specify a path to download videos to.')
    }

    return [
      ...YouTubeDownloader.YOUTUBE_OPTIONS,
      `-o${this._path}/%(title)s.%(ext)s` // Not sure why not leaving a space between "-o" and the path works...
    ]
  }

  print () {
    this.videos.map(video => `${video.title}\n\t${video.url}`)
      .forEach(video => console.log(video))
  }

  set videos (_videos) {
    this._videos = _videos
  }

  get videos () {
    return this._videos
  }

  set simulate (_simulate) {
    this._simulate = _simulate
  }

  set path (_path) {
    if (!_path) {
      return new Error('Please specify a path to download files.')
    }

    this._path = _path
  }
}

module.exports = YouTubeDownloader
