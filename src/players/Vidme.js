import React, { Component } from 'react'

import createPlayer from '../createPlayer'

const RESOLVE_URL = 'https://api.vid.me/videoByUrl/'
const MATCH_URL = /^https?:\/\/vid.me\/([a-z0-9]+)$/i

const cache = {} // Cache song data requests

class Vidme extends Component {
  static displayName = 'Vidme'
  componentDidMount () {
    this.mounted = true
    this.addListeners()
  }
  componentWillUnmount () {
    this.removeListeners()
    this.mounted = false
  }
  addListeners () {
    const { onReady, onPlay, onPause, onEnded, onError, playsinline } = this.props
    this.player.addEventListener('canplay', onReady)
    this.player.addEventListener('play', onPlay)
    this.player.addEventListener('pause', onPause)
    this.player.addEventListener('seeked', this.onSeek)
    this.player.addEventListener('ended', onEnded)
    this.player.addEventListener('error', onError)
    if (playsinline) {
      this.player.setAttribute('playsinline', '')
      this.player.setAttribute('webkit-playsinline', '')
    }
  }
  removeListeners () {
    const { onReady, onPlay, onPause, onEnded, onError } = this.props
    this.player.removeEventListener('canplay', onReady)
    this.player.removeEventListener('play', onPlay)
    this.player.removeEventListener('pause', onPause)
    this.player.removeEventListener('seeked', this.onSeek)
    this.player.removeEventListener('ended', onEnded)
    this.player.removeEventListener('error', onError)
  }
  onSeek = e => {
    this.props.onSeek(e.target.currentTime)
  }
  getData (url) {
    const { onError } = this.props
    const id = url.match(MATCH_URL)[1]
    if (cache[id]) {
      return Promise.resolve(cache[id])
    }
    return window.fetch(RESOLVE_URL + id)
      .then(response => {
        if (response.status === 200) {
          cache[id] = response.json()
          return cache[id]
        } else {
          onError(new Error('Vidme track could not be resolved'))
        }
      })
  }
  getURL ({ video }) {
    const { config } = this.props
    if (config.vidme.format && video.formats && video.formats.length !== 0) {
      const index = video.formats.findIndex(f => f.type === config.vidme.format)
      if (index !== -1) {
        return video.formats[index].uri
      } else {
        console.warn(`Vidme format "${config.vidme.format}" was not found for ${video.full_url}`)
      }
    }
    return video.complete_url
  }
  load (url) {
    const { onError } = this.props
    this.stop()
    this.getData(url).then(data => {
      if (!this.mounted) return
      this.player.src = this.getURL(data)
    }, onError)
  }
  play () {
    this.player.play().catch(this.props.onError)
  }
  pause () {
    this.player.pause()
  }
  stop () {
    this.player.removeAttribute('src')
  }
  seekTo (seconds) {
    this.player.currentTime = seconds
  }
  setVolume (fraction) {
    this.player.volume = fraction
  }
  setPlaybackRate (rate) {
    this.player.playbackRate = rate
  }
  getDuration () {
    return this.player.duration
  }
  getCurrentTime () {
    return this.player.currentTime
  }
  getSecondsLoaded () {
    if (this.player.buffered.length === 0) return 0
    return this.player.buffered.end(0)
  }
  ref = player => {
    this.player = player
  }
  render () {
    const { url, loop, controls, config, width, height } = this.props
    const style = {
      width: !width || width === 'auto' ? width : '100%',
      height: !height || height === 'auto' ? height : '100%',
      display: url ? 'block' : 'none'
    }
    return (
      <video
        ref={this.ref}
        src={url}
        style={style}
        preload='auto'
        controls={controls}
        loop={loop}
        {...config.vidme.attributes}
      />
    )
  }
}

export default createPlayer(Vidme, {
  canPlay: MATCH_URL
})
