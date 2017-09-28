import React, { Component } from 'react'

import { propTypes, defaultProps } from './props'

const SEEK_ON_PLAY_EXPIRY = 5000

export default function createPlayer (Player) { // we can pass all options in static methods of Player
  return class PlayerWrapper extends Component {
    static propTypes = propTypes
    static defaultProps = defaultProps
    static displayName = `PlayerWrapper(${Player.displayName})`
    static canPlay (url) {
      if (typeof Player.canPlay === 'function') {
        return Player.canPlay(url)
      }
      return Player.canPlay.test(url)
    }
    mounted = false
    isReady = false
    preloading = false
    startOnPlay = true
    seekOnPlay = null
    componentDidMount () {
      this.mounted = true
      const { url } = this.props
      if (url) {
        this.player.load(url)
      } else if (Player.shouldPreload && Player.shouldPreload(this.props)) {
        this.preloading = true
        this.player.load(Player.preloadURL)
      }
    }
    componentWillUnmount () {
      this.player.stop()
      this.mounted = false
    }
    componentWillReceiveProps (nextProps) {
      const { url, playing, volume, muted, playbackRate } = this.props
      // Invoke player methods based on incoming props
      if (url !== nextProps.url && nextProps.url) {
        this.seekOnPlay = null
        this.startOnPlay = true
        if (url && !this.isReady) {
          this.loadOnReady = nextProps.url
        } else {
          this.player.load(nextProps.url, this.isReady)
        }
      }
      if (url && !nextProps.url && !this.preloading) {
        this.player.stop()
      }
      if (!playing && nextProps.playing) {
        this.player.play()
      }
      if (playing && !nextProps.playing) {
        this.player.pause()
      }
      if (volume !== nextProps.volume && !nextProps.muted) {
        this.player.setVolume(nextProps.volume)
      }
      if (muted !== nextProps.muted) {
        this.player.setVolume(nextProps.muted ? 0 : nextProps.volume)
      }
      if (playbackRate !== nextProps.playbackRate && this.player.setPlaybackRate) {
        this.player.setPlaybackRate(nextProps.playbackRate)
      }
    }
    getCurrentTime () {
      return this.player.getCurrentTime()
    }
    getSecondsLoaded () {
      return this.player.getSecondsLoaded()
    }
    getDuration () {
      return this.player.getDuration()
    }
    seekTo (amount) {
      // When seeking before player is ready, store value and seek later
      if (!this.isReady && amount !== 0) {
        this.seekOnPlay = amount
        setTimeout(() => {
          this.seekOnPlay = null
        }, SEEK_ON_PLAY_EXPIRY)
      }
      if (amount > 0 && amount < 1) {
        // Convert fraction to seconds based on duration
        const duration = this.player.getDuration()
        if (!duration) {
          console.warn('ReactPlayer: could not seek using fraction – duration not yet available')
          return
        }
        this.player.seekTo(duration * amount)
        return
      }
      this.player.seekTo(amount)
    }
    onPlay = () => {
      const { volume, muted, onStart, onPlay, playbackRate } = this.props
      if (this.startOnPlay) {
        if (Player.setPlaybackRate) {
          this.player.setPlaybackRate(playbackRate)
        }
        this.player.setVolume(muted ? 0 : volume)
        onStart()
        this.startOnPlay = false
      }
      onPlay()
      if (this.seekOnPlay) {
        this.seekTo(this.seekOnPlay)
        this.seekOnPlay = null
      }
      this.onDurationCheck()
    }
    onReady = () => {
      if (!this.mounted) return
      const { onReady, playing } = this.props
      this.isReady = true
      this.loadingSDK = false
      onReady()
      if (playing || this.preloading) {
        this.preloading = false
        if (this.loadOnReady) {
          this.player.load(this.loadOnReady)
          this.loadOnReady = null
        } else {
          this.player.play()
        }
      }
      this.onDurationCheck()
    }
    onEnded = () => {
      const { loop, onEnded } = this.props
      if (Player.loopOnEnded && loop) {
        this.seekTo(0)
      }
      onEnded()
    }
    onDurationCheck = () => {
      clearTimeout(this.durationCheckTimeout)
      const duration = this.getDuration()
      if (duration) {
        this.props.onDuration(duration)
      } else {
        this.durationCheckTimeout = setTimeout(this.onDurationCheck, 100)
      }
    }
    ref = player => {
      if (player) {
        this.player = player
      }
    }
    render () {
      return (
        <Player
          {...this.props}
          ref={this.ref}
          onReady={this.onReady}
          onPlay={this.onPlay}
          onEnded={this.onEnded}
        />
      )
    }
  }
}
