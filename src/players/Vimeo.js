import React, { Component } from 'react'

import createPlayer from '../createPlayer'
import { callPlayer, getSDK } from '../utils'

const SDK_URL = 'https://player.vimeo.com/api/player.js'
const SDK_GLOBAL = 'Vimeo'
const MATCH_URL = /https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/
const BLANK_VIDEO_URL = 'https://vimeo.com/127250231'

class Vimeo extends Component {
  static displayName = 'Vimeo'
  callPlayer = callPlayer
  duration = null
  load (url, isReady) {
    const id = url.match(MATCH_URL)[3]
    this.duration = null
    if (isReady) {
      this.player.loadVideo(id)
      return
    }
    getSDK(SDK_URL, SDK_GLOBAL).then(Vimeo => {
      this.player = new Vimeo.Player(this.container, {
        ...this.props.config.vimeo.playerOptions,
        url,
        loop: this.props.loop
      })
      this.player.on('loaded', () => {
        this.props.onReady()
        const iframe = this.container.querySelector('iframe')
        iframe.style.width = '100%'
        iframe.style.height = '100%'
      })
      this.player.on('play', ({ duration }) => {
        this.duration = duration
        this.props.onPlay()
      })
      this.player.on('pause', this.props.onPause)
      this.player.on('seeked', e => this.props.onSeek(e.seconds))
      this.player.on('ended', this.props.onEnded)
      this.player.on('error', this.props.onError)
      this.player.on('timeupdate', ({ seconds }) => {
        this.currentTime = seconds
      })
      this.player.on('progress', ({ seconds }) => {
        this.secondsLoaded = seconds
      })
    }, this.props.onError)
  }
  play () {
    this.callPlayer('play')
  }
  pause () {
    this.callPlayer('pause')
  }
  stop () {
    if (this.props.preloading) return
    this.callPlayer('unload')
  }
  seekTo (seconds) {
    this.callPlayer('setCurrentTime', seconds)
  }
  setVolume (fraction) {
    this.callPlayer('setVolume', fraction)
  }
  getDuration () {
    return this.duration
  }
  getCurrentTime () {
    return this.currentTime
  }
  getSecondsLoaded () {
    return this.secondsLoaded
  }
  ref = container => {
    this.container = container
  }
  render () {
    const style = {
      height: '100%',
      display: this.props.url ? 'block' : 'none'
    }
    return <div style={style} ref={this.ref} />
  }
}

export default createPlayer(Vimeo, {
  canPlay: MATCH_URL,
  shouldPreload: props => props.config.vimeo.preload,
  preloadURL: BLANK_VIDEO_URL
})
