import React, { Component } from 'react'

// what do you think about index.js in ./players?
import players from './players'
import { propTypes, defaultProps, DEPRECATED_CONFIG_PROPS } from './props'
import { getConfig, omit } from './utils'

const { FilePlayer, YouTube, Vimeo, DailyMotion } = players
const PLAYERS = Object.values(players)
const EXTERNAL_PLAYERS = PLAYERS.filter(Player => Player !== FilePlayer)
const SUPPORTED_PROPS = Object.keys(propTypes)

export default class ReactPlayer extends Component {
  static displayName = 'ReactPlayer'
  static propTypes = propTypes
  static defaultProps = defaultProps
  // and about PLAYERS.some() instead let Player of [] ?
  static canPlay = url => PLAYERS.some(Player => Player.canPlay(url))
  config = getConfig(this.props, defaultProps, true)
  componentDidMount () {
    this.progress()
  }
  componentWillUnmount () {
    clearTimeout(this.progressTimeout)
  }
  shouldComponentUpdate (nextProps) {
    return (
      this.props.url !== nextProps.url ||
      this.props.playing !== nextProps.playing ||
      this.props.volume !== nextProps.volume ||
      this.props.muted !== nextProps.muted ||
      this.props.playbackRate !== nextProps.playbackRate ||
      this.props.height !== nextProps.height ||
      this.props.width !== nextProps.width ||
      this.props.hidden !== nextProps.hidden
    )
  }
  seekTo = fraction => {
    if (!this.player) return null
    this.player.seekTo(fraction)
  }
  getDuration = () => {
    if (!this.player) return null
    return this.player.getDuration()
  }
  getCurrentTime = () => {
    if (!this.player) return null
    return this.player.getCurrentTime()
  }
  getInternalPlayer = () => {
    if (!this.player) return null
    return this.player.player
  }
  progress = () => {
    if (this.props.url && this.player && this.player.isReady) {
      const playedSeconds = this.player.getCurrentTime() || 0
      const loadedSeconds = this.player.getSecondsLoaded()
      const duration = this.player.getDuration()
      if (duration) {
        const progress = {
          playedSeconds,
          played: playedSeconds / duration
        }
        if (loadedSeconds !== null) {
          progress.loadedSeconds = loadedSeconds
          progress.loaded = loadedSeconds / duration
        }
        // Only call onProgress if values have changed
        if (progress.played !== this.prevPlayed || progress.loaded !== this.prevLoaded) {
          this.props.onProgress(progress)
        }
        this.prevPlayed = progress.played
        this.prevLoaded = progress.loaded
      }
    }
    this.progressTimeout = setTimeout(this.progress, this.props.progressFrequency)
  }
  renderActivePlayer (url) {
    if (!url) return null
    for (let Player of EXTERNAL_PLAYERS) {
      if (Player.canPlay(url)) {
        return this.renderPlayer(Player)
      }
    }
    // Fall back to FilePlayer if nothing else can play the URL
    return this.renderPlayer(FilePlayer)
  }
  renderPlayer = Player => {
    return (
      <Player
        {...this.props}
        ref={this.activePlayerRef}
        key={Player.displayName}
        config={this.config}
      />
    )
  }
  activePlayerRef = player => {
    this.player = player
  }
  wrapperRef = wrapper => {
    this.wrapper = wrapper
  }
  renderPreloadPlayers (url) {
    // Render additional players if preload config is set
    const preloadPlayers = []
    if (!YouTube.canPlay(url) && this.config.youtube.preload) {
      preloadPlayers.push(YouTube)
    }
    if (!Vimeo.canPlay(url) && this.config.vimeo.preload) {
      preloadPlayers.push(Vimeo)
    }
    if (!DailyMotion.canPlay(url) && this.config.dailymotion.preload) {
      preloadPlayers.push(DailyMotion)
    }
    return preloadPlayers.map(this.renderPreloadPlayer)
  }
  renderPreloadPlayer = Player => {
    return (
      <Player
        key={Player.displayName}
        config={this.config}
      />
    )
  }
  render () {
    const { url, style, width, height } = this.props
    const otherProps = omit(this.props, SUPPORTED_PROPS, DEPRECATED_CONFIG_PROPS)
    const activePlayer = this.renderActivePlayer(url)
    const preloadPlayers = this.renderPreloadPlayers(url)
    return (
      <div ref={this.wrapperRef} style={{ ...style, width, height }} {...otherProps}>
        {activePlayer}
        {preloadPlayers}
      </div>
    )
  }
}
