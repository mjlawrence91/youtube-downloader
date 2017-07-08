import * as fs from 'fs'
import * as path from 'path'
import * as childProcess from 'child_process'
import {promisify} from 'util'
import * as config from 'config'
import * as YouTube from 'youtube-node'

class YouTubeDownloader {
  private _videos: Array<YouTubeVideo>
  private _simulate: boolean
  private _path: string
  private _youTube: YouTube
  private _youtubeSearch: any

  private static get API_KEY (): string {
    return config.get('apiKey')
  }

  private static get YOUTUBE_OPTIONS (): Array<string> {
    let configOptions: Array<string>

    try {
      configOptions = config.get('youtubeOptions')
    } catch (_) {
      configOptions = ['-f best', '--write-sub', '--sub-lang=en', ' --embed-subs', '--add-metadata']
    }
    return configOptions
  }

  constructor () {
    this._videos = []
    this._simulate = false

    let mediaFolder: string = ''

    try {
      mediaFolder = config.get('downloadPath')
    } catch (e) {
      mediaFolder = 'media/'
    }

    const basePath: string = path.resolve(__dirname, '../../')
    this._path = basePath + '/' + mediaFolder

    this._youTube = new YouTube()
    this._youTube.setKey(YouTubeDownloader.API_KEY)
    this._youtubeSearch = promisify(this._youTube.search)

    this._init()
  }

  private async _init (): Promise<void> {
    const mkdir = promisify(fs.mkdir)
    const stat = promisify(fs.stat)

    try {
      await stat(this._path)
    } catch (e) {
      await mkdir(this._path)
    }
  }

  public async search (term: string, resultCount: number = 50, options: SearchOptions = {store: true}) {
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

    const videos: Array<YouTubeVideo> = items
      .filter(result => result.id.kind === 'youtube#video')
      .map(result => {
        const videoID = result.id.videoId
        const url = `https://www.youtube.com/watch?v=${videoID}`
        const title = result.snippet.title.replace(/: /g, ' - ')
        return {title, id: videoID, url}
      })

    return Promise.resolve(videos)
  }

  public async downloadAll (): Promise<void> {
    this._videos.forEach(async video => {
      await this.download(video.url)
    })
  }

  public async download (url: string): Promise<object|Error> {
    if (!url) {
      return Promise.reject(new Error('Please specify a URL to download.'))
    }

    return new Promise((resolve, reject) => {
      const args: Array<string> = [url, ...this._resolveYouTubeOptions()]

      if (this._simulate) {
        args.push('--simulate')
      }

      const ytdl: childProcess.ChildProcess = childProcess.spawn('youtube-dl', args)
      ytdl.stdout.on('data', data => console.log(`stdout: ${data}`))
      ytdl.stderr.on('data', data => console.log(`stderr: ${data}`))
      ytdl.on('close', _ => resolve())
    })
  }

  private _resolveYouTubeOptions (): Array<string> {
    if (!this.path) {
      throw new Error('Please specify a path to download files.')
    }

    return [
      ...YouTubeDownloader.YOUTUBE_OPTIONS,
      `-o${this.path}/%(title)s.%(ext)s` // Not sure why removing the space between "-o" and the path works...
    ]
  }

  public print (): void {
    this.videos.map(video => `${video.title}\n\t${video.url}`)
      .forEach(video => console.log(video))
  }

  public set videos (_videos: Array<YouTubeVideo>) {
    this._videos = _videos
  }

  public get videos (): Array<YouTubeVideo> {
    return this._videos
  }

  public set simulate (_simulate: boolean) {
    this._simulate = _simulate
  }

  public get path (): string {
    return this._path
  }

  public set path (_path: string) {
    if (!_path) {
      throw new Error('Please specify a path to download files.')
    }

    this._path = _path
  }
}

export default YouTubeDownloader
