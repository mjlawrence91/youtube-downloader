/* eslint no-new: 0 */
const {describe, it} = require('mocha')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const fs = require('fs')
const path = require('path')
const {promisify} = require('util')
const del = require('del')
const YouTubeDownloader = require('../lib/youtubeDownloader')

chai.use(chaiAsPromised)
const {expect} = chai
const stat = promisify(fs.stat)

describe('Setup', _ => {
  it('should not error on setup', done => {
    try {
      new YouTubeDownloader()
      done()
    } catch (e) {
      console.error(e)
    }
  })

  it('should create media folder on init', async function () {
    const downloader = new YouTubeDownloader()
    await del([`${downloader._path}/**`])
    await downloader._init()
  })
})

describe('Search', _ => {
  it('should return an error when a search term is not given', async function () {
    const downloader = new YouTubeDownloader()
    const searchTerm = ''
    const resultCount = 10

    try {
      await downloader.search(searchTerm, resultCount)
      return Promise.reject(new Error('This should not resolve.'))
    } catch (error) {
      expect(error).to.be.an('error')
      expect(error.message).to.equal('Please specify a search term.')
    }
  })

  it('should return an error when a page size is not given', async function () {
    const downloader = new YouTubeDownloader()
    const searchTerm = 'Citation Needed'
    const resultCount = 0

    try {
      await downloader.search(searchTerm, resultCount)
      return Promise.reject(new Error('This should not resolve.'))
    } catch (error) {
      expect(error).to.be.an('error')
      expect(error.message).to.equal('Please specify a page size of results to return.')
    }
  })

  it('should return an error when a page size is greater than 50', async function () {
    const downloader = new YouTubeDownloader()
    const searchTerm = 'Citation Needed'
    const resultCount = 100

    try {
      await downloader.search(searchTerm, resultCount)
      return Promise.reject(new Error('This should not resolve.'))
    } catch (error) {
      expect(error).to.be.an('error')
      expect(error.message).to.equal('Page size cannot exceed 50 results.')
    }
  })

  it('should return results when searching', async function () {
    const downloader = new YouTubeDownloader()
    const searchTerm = 'Citation Needed'
    const resultCount = 10

    const results = await downloader.search(searchTerm, resultCount)
    expect(results).to.be.an('array')

    const [oneResult] = results
    expect(oneResult).to.be.an('object')
    expect(oneResult).to.contain.keys('id', 'title', 'url')

    return results
  })
})

describe('Downloader', _ => {
  it('should fail if there are no videos saved in queue', async function () {
    const downloader = new YouTubeDownloader()

    try {
      await downloader.downloadAll()
      return Promise.reject(new Error('This should not resolve.'))
    } catch (error) {
      expect(error).to.be.an('error')
      expect(error.message).to.equal('There are no videos in the download queue.')
    }
  })

  it('should download a video using a URL', async function () {
    this.timeout(1000 * 60 * 4)

    const downloader = new YouTubeDownloader()
    const searchTerm = 'Citation Needed'
    const resultCount = 50
    const video = {
      videoID: '6qNawyzVGbc',
      title: 'The Boobrie and Conservative Pandas - Citation Needed 3x02',
      url: 'https://www.youtube.com/watch?v=6qNawyzVGbc'
    }

    await del([`${downloader._path}/**`])
    await downloader.search(searchTerm, resultCount)
    await downloader.download(video.url)

    await stat(path.resolve(__dirname, '..', downloader._path, `${video.title}.mp4`))
  })
})
