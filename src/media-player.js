/** @type {string} Ikona SVG przycisku Odtwarzaj. */
    const SVG_PLAY = `<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>`;
    
    /** @type {string} Ikona SVG przycisku Pauza. */
    const SVG_PAUSE = `<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
    
    /** @type {string} Ikona SVG włączonego dźwięku. */
    const SVG_VOL_HIGH = `<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
    
    /** @type {string} Ikona SVG wyciszonego dźwięku. */
    const SVG_VOL_MUTED = `<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`;
    
    /** @type {string} Ikona SVG trybu pełnoekranowego. */
    const SVG_FULLSCREEN = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4H4v5"/><path d="M4 4l5.5 5.5"/><path d="M15 4h5v5"/><path d="M20 4l-5.5 5.5"/><path d="M15 20h5v-5"/><path d="M20 20l-5.5-5.5"/><path d="M9 20H4v-5"/><path d="M4 20l5.5-5.5"/></svg>`;

    /**
     * Uniwersalny odtwarzacz strumieni multimedialnych (HLS, MP4, MP3, YouTube).
     */
    class UniversalStreamPlayer {
        #container;
        #hls = null;
        #ytPlayer = null;
        #currentMode = null;
        
        #videoEl;
        #ytHolderEl;
        #ytTargetId;
        #overlayEl;
        #titleEl;
        #thumbEl;
        
        #audioControlsEl;
        #audioPlayBtn;
        #audioSeekBar;
        #audioTimeText;
        #audioVolSlider;
        #audioVolIcon;
        #audioFsBtn;

        #mouseTimer = null;
        #isSeeking = false;
        #ytTimer = null;
        #onTimeUpdateCallback = null;
        #onVolumeChangeCallback = null;

        #isHlsLive = false;
        #isMetadataLoaded = false;
        #isAudioOnly = false;
        #showNativeControls = true;
        #currentConfig = null;
        #volume = 1;      
        #lastVolume = 1;  

        static formatTime(seconds) {
            if (isNaN(seconds) || seconds === null || seconds < 0) return '0:00';
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = Math.floor(seconds % 60);
            const padS = s < 10 ? '0' + s : s;

            if (h > 0) {
                const padM = m < 10 ? '0' + m : m;
                return `${h}:${padM}:${padS}`;
            }
            return `${m}:${padS}`;
        }

        constructor(containerId, options = {}) {
            this.#container = document.getElementById(containerId);
            if (!this.#container) {
                throw new Error(`Nie znaleziono elementu o id "${containerId}"`);
            }

            if (options.onTimeUpdate) {
                this.#onTimeUpdateCallback = options.onTimeUpdate;
            }
            if (options.onVolumeChange) {
                this.#onVolumeChangeCallback = options.onVolumeChange;
            }

            this.#initDOM();
            this.#initMouseInactivityHandler();
            this.#loadYTApi();
        }

        #initDOM() {
            const randomId = 'usp-yt-' + Math.random().toString(36).substr(2, 9);
            this.#container.innerHTML = `
                <video class="usp-video" playsinline></video>
                <div class="usp-yt-holder usp-hidden">
                    <div id="${randomId}"></div>
                </div>
                <div class="usp-audio-overlay usp-hidden">
                    <div class="usp-station-title"></div>
                    <img class="usp-audio-thumb usp-hidden" src="" alt="">
                </div>
                
                <div class="usp-audio-controls usp-hidden">
                    <button class="usp-ctrl-btn usp-audio-play" title="Odtwarzaj / Pauza">${SVG_PLAY}</button>
                    <input type="range" class="usp-audio-seek" value="0" min="0" max="100" step="0.1" title="Przewiń">
                    <span class="usp-audio-time">0:00 / 0:00</span>
                    <div class="usp-vol-group">
                        <span class="usp-ctrl-btn usp-audio-vol-icon" title="Wycisz/Odcisz">${SVG_VOL_HIGH}</span>
                        <input type="range" class="usp-vol-slider usp-audio-vol-slider" min="0" max="1" step="0.01" value="1" title="Głośność">
                    </div>
                    <button class="usp-ctrl-btn usp-audio-fs" title="Pełny ekran">${SVG_FULLSCREEN}</button>
                </div>
            `;

            this.#videoEl = this.#container.querySelector('.usp-video');
            this.#ytHolderEl = this.#container.querySelector('.usp-yt-holder');
            this.#ytTargetId = randomId;
            this.#overlayEl = this.#container.querySelector('.usp-audio-overlay');
            this.#titleEl = this.#container.querySelector('.usp-station-title');
            this.#thumbEl = this.#container.querySelector('.usp-audio-thumb');
            
            this.#audioControlsEl = this.#container.querySelector('.usp-audio-controls');
            this.#audioPlayBtn = this.#container.querySelector('.usp-audio-play');
            this.#audioSeekBar = this.#container.querySelector('.usp-audio-seek');
            this.#audioTimeText = this.#container.querySelector('.usp-audio-time');
            this.#audioVolSlider = this.#container.querySelector('.usp-audio-vol-slider');
            this.#audioVolIcon = this.#container.querySelector('.usp-audio-vol-icon');
            this.#audioFsBtn = this.#container.querySelector('.usp-audio-fs');

            if (this.#showNativeControls) {
                this.#container.classList.add('native-controls-active');
            }

            this.#container.addEventListener('click', (e) => {
                if (this.#audioControlsEl.contains(e.target)) {
                    return;
                }
                if (!this.#showNativeControls || this.#isAudioOnly) {
                    this.#togglePlay();
                }
            });

            this.#audioPlayBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.#togglePlay();
            });

            this.#audioFsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.#toggleFullscreen();
            });

            this.#audioSeekBar.addEventListener('input', (e) => {
                e.stopPropagation();
                this.#isSeeking = true;
                this.#updateSeekStyle(e.target.value, e.target.max);
            });

            this.#audioSeekBar.addEventListener('change', (e) => {
                e.stopPropagation();
                this.#seekTo(parseFloat(e.target.value));
                this.#isSeeking = false;
            });

            this.#audioVolSlider.addEventListener('input', (e) => {
                e.stopPropagation();
                this.#setVolume(e.target.value);
            });

            this.#audioVolIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.#toggleMute();
            });

            this.#videoEl.addEventListener('loadedmetadata', () => {
                this.#isMetadataLoaded = true;
                this.#emitTimeUpdate();
            });

            this.#videoEl.addEventListener('timeupdate', () => this.#emitTimeUpdate());
            this.#videoEl.addEventListener('play', () => this.#updateState(true));
            this.#videoEl.addEventListener('pause', () => this.#updateState(false));
            this.#videoEl.addEventListener('ended', () => this.#updateState(false));
        }

        #parseImageUrl(url) {
            if (!url) return '';
            if (url.includes('wikipedia.org') || url.includes('wikimedia.org')) {
                const match = url.match(/(?:Plik|File|media\/Plik|media\/File):([^&#?]+)/i);
                if (match && match[1]) {
                    const fileName = decodeURIComponent(match[1]);
                    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}`;
                }
            }
            return url;
        }

        #initMouseInactivityHandler() {
            const showControls = () => {
                this.#container.classList.add('show-audio-controls');
                clearTimeout(this.#mouseTimer);
                
                this.#mouseTimer = setTimeout(() => {
                    this.#container.classList.remove('show-audio-controls');
                }, 2500);
            };

            this.#container.addEventListener('mousemove', showControls);
            this.#container.addEventListener('touchstart', showControls, { passive: true });
            
            this.#container.addEventListener('mouseleave', () => {
                clearTimeout(this.#mouseTimer);
                this.#container.classList.remove('show-audio-controls');
            });
        }

        #updateSeekStyle(val, max) {
            const percent = (max > 0) ? (val / max) * 100 : 0;
            this.#audioSeekBar.style.setProperty('--seek-val', `${percent}%`);
        }

        #seekTo(targetTime) {
            if (this.#currentMode === 'youtube' && this.#ytPlayer && typeof this.#ytPlayer.seekTo === 'function') {
                this.#ytPlayer.seekTo(targetTime, true);
            } else if (this.#videoEl) {
                this.#videoEl.currentTime = targetTime;
            }
        }

        #setVolume(value) {
            this.#volume = Math.max(0, Math.min(1, parseFloat(value)));

            if (this.#videoEl) {
                this.#videoEl.volume = this.#volume;
            }

            if (this.#currentMode === 'youtube' && this.#ytPlayer && typeof this.#ytPlayer.setVolume === 'function') {
                this.#ytPlayer.setVolume(this.#volume * 100);
            }

            this.#audioVolSlider.value = this.#volume;
            this.#audioVolSlider.style.setProperty('--vol-val', `${this.#volume * 100}%`);

            if (this.#volume === 0) {
                this.#audioVolIcon.innerHTML = SVG_VOL_MUTED;
            } else {
                this.#audioVolIcon.innerHTML = SVG_VOL_HIGH;
            }

            if (this.#onVolumeChangeCallback) {
                this.#onVolumeChangeCallback(this.#volume);
            }

            this.#container.dispatchEvent(new CustomEvent('usp:volumechange', {
                detail: { volume: this.#volume }
            }));
        }

        #toggleMute() {
            if (this.#volume > 0) {
                this.#lastVolume = this.#volume;
                this.#setVolume(0);
            } else {
                this.#setVolume(this.#lastVolume > 0 ? this.#lastVolume : 1);
            }
            return this.#volume;
        }

        setNativeControls(enabled) {
            this.#showNativeControls = enabled;

            if (enabled) {
                this.#container.classList.add('native-controls-active');
                this.#videoEl.controls = !this.#isAudioOnly;
            } else {
                this.#container.classList.remove('native-controls-active');
                this.#videoEl.controls = false;
            }

            if (this.#currentMode === 'youtube' && this.#currentConfig) {
                const currentTime = (this.#ytPlayer && typeof this.#ytPlayer.getCurrentTime === 'function') 
                    ? this.#ytPlayer.getCurrentTime() : 0;
                const ytId = this.#extractYouTubeId(this.#currentConfig.url);
                this.#loadYouTubeVideo(ytId, currentTime);
            }
        }

        #updateAudioBgColor(isPlaying) {
            if (!this.#currentConfig || !this.#isAudioOnly) {
                this.#overlayEl.style.backgroundColor = '';
                return;
            }

            const { bgColor, bgColorOnline, bgColorOffline } = this.#currentConfig;

            if (isPlaying && bgColorOnline) {
                this.#overlayEl.style.backgroundColor = bgColorOnline;
            } else if (!isPlaying && bgColorOffline) {
                this.#overlayEl.style.backgroundColor = bgColorOffline;
            } else if (bgColor) {
                this.#overlayEl.style.backgroundColor = bgColor;
            } else {
                this.#overlayEl.style.backgroundColor = '';
            }
        }

        #updateState(isPlaying) {
            if (isPlaying) {
                this.#container.classList.add('is-playing');
                this.#container.classList.remove('is-paused');
                this.#audioPlayBtn.innerHTML = SVG_PAUSE;
                this.#startYTTimer();
            } else {
                this.#container.classList.add('is-paused');
                this.#container.classList.remove('is-playing');
                this.#audioPlayBtn.innerHTML = SVG_PLAY;
                this.#stopYTTimer();
            }
            this.#updateAudioBgColor(isPlaying);
        }

        #calculateBufferMetrics() {
            let bufferedSeconds = 0;
            let bufferMB = 0;

            if (this.#currentMode === 'youtube' && this.#ytPlayer) {
                if (typeof this.#ytPlayer.getVideoLoadedFraction === 'function' && typeof this.#ytPlayer.getDuration === 'function') {
                    const loadedFraction = this.#ytPlayer.getVideoLoadedFraction() || 0;
                    const duration = this.#ytPlayer.getDuration() || 0;
                    const currentTime = this.#ytPlayer.getCurrentTime() || 0;
                    const loadedTime = loadedFraction * duration;
                    bufferedSeconds = Math.max(0, loadedTime - currentTime);

                    const bps = this.#isAudioOnly ? (160 * 1024) : (2500 * 1024);
                    bufferMB = (bufferedSeconds * bps) / (8 * 1024 * 1024);
                }
            } else if (this.#videoEl) {
                const currentTime = this.#videoEl.currentTime || 0;
                const buffered = this.#videoEl.buffered;

                if (buffered && buffered.length > 0) {
                    for (let i = 0; i < buffered.length; i++) {
                        if (buffered.start(i) <= currentTime && currentTime <= buffered.end(i)) {
                            bufferedSeconds = buffered.end(i) - currentTime;
                            break;
                        }
                    }
                }

                if (this.#hls && this.#hls.bandwidthEstimate) {
                    const bps = this.#hls.bandwidthEstimate;
                    bufferMB = (bufferedSeconds * bps) / (8 * 1024 * 1024);
                } else {
                    const bps = this.#isAudioOnly ? (192 * 1024) : (2500 * 1024);
                    bufferMB = (bufferedSeconds * bps) / (8 * 1024 * 1024);
                }
            }

            return {
                seconds: Math.round(bufferedSeconds),
                mb: Math.max(0, bufferMB)
            };
        }

        #emitTimeUpdate() {
            let currentTime = 0;
            let duration = NaN;
            let isLive = false;
            let isReady = false;

            if (this.#currentMode === 'youtube' && this.#ytPlayer) {
                if (typeof this.#ytPlayer.getCurrentTime === 'function') {
                    currentTime = this.#ytPlayer.getCurrentTime() || 0;
                    duration = this.#ytPlayer.getDuration() || 0;
                    isLive = (duration === 0);
                    isReady = true;
                }
            } else if (this.#videoEl) {
                currentTime = this.#videoEl.currentTime || 0;
                duration = this.#videoEl.duration;
                isReady = this.#isMetadataLoaded;

                if (this.#hls) {
                    isLive = this.#isHlsLive;
                } else {
                    isLive = (duration === Infinity);
                }
            }

            if (this.#isAudioOnly) {
                if (!this.#isSeeking) {
                    if (isLive || isNaN(duration)) {
                        this.#audioSeekBar.value = 0;
                        this.#audioSeekBar.disabled = true;
                        this.#updateSeekStyle(0, 100);
                    } else {
                        this.#audioSeekBar.disabled = false;
                        this.#audioSeekBar.max = duration;
                        this.#audioSeekBar.value = currentTime;
                        this.#updateSeekStyle(currentTime, duration);
                    }
                }

                const formattedCurrent = UniversalStreamPlayer.formatTime(currentTime);
                const formattedDuration = isLive ? 'NA ŻYWO' : (isNaN(duration) ? '0:00' : UniversalStreamPlayer.formatTime(duration));
                this.#audioTimeText.textContent = `${formattedCurrent} / ${formattedDuration}`;
            }

            const buffer = this.#calculateBufferMetrics();
            const timeData = {
                currentTime: currentTime,
                duration: duration,
                isLive: isLive,
                isReady: isReady,
                bufferMB: buffer.mb,
                bufferSeconds: buffer.seconds
            };

            if (this.#onTimeUpdateCallback) {
                this.#onTimeUpdateCallback(timeData);
            }

            this.#container.dispatchEvent(new CustomEvent('usp:timeupdate', {
                detail: timeData
            }));
        }

        #startYTTimer() {
            if (this.#currentMode === 'youtube' && !this.#ytTimer) {
                this.#ytTimer = setInterval(() => this.#emitTimeUpdate(), 500);
            }
        }

        #stopYTTimer() {
            if (this.#ytTimer) {
                clearInterval(this.#ytTimer);
                this.#ytTimer = null;
            }
        }

        #loadYTApi() {
            if (window.YT && window.YT.Player) return;
            if (document.getElementById('yt-iframe-api')) return;

            const tag = document.createElement('script');
            tag.id = 'yt-iframe-api';
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        #extractYouTubeId(url) {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = url ? url.match(regExp) : null;
            return (match && match[2].length === 11) ? match[2] : null;
        }

        #loadYouTubeVideo(videoId, startTime = 0) {
            const controlsParam = (this.#showNativeControls && !this.#isAudioOnly) ? 1 : 0;

            const createPlayer = () => {
                if (this.#ytPlayer && typeof this.#ytPlayer.destroy === 'function') {
                    this.#ytPlayer.destroy();
                    this.#ytPlayer = null;
                }
                
                this.#ytHolderEl.innerHTML = `<div id="${this.#ytTargetId}"></div>`;

                this.#ytPlayer = new YT.Player(this.#ytTargetId, {
                    videoId: videoId,
                    playerVars: { 
                        autoplay: 1, 
                        playsinline: 1, 
                        modestbranding: 1, 
                        rel: 0, 
                        start: startTime, 
                        controls: controlsParam 
                    },
                    events: {
                        'onReady': (event) => {
                            event.target.setVolume(this.#volume * 100);
                        },
                        'onStateChange': (event) => {
                            if (event.data === YT.PlayerState.PLAYING) {
                                this.#updateState(true);
                            } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
                                this.#updateState(false);
                            }
                        }
                    }
                });
            };

            if (window.YT && window.YT.Player) {
                createPlayer();
            } else {
                const checkYT = setInterval(() => {
                    if (window.YT && window.YT.Player) {
                        clearInterval(checkYT);
                        createPlayer();
                    }
                }, 100);
            }
        }

        #load(config) {
            this.#destroy();
            this.#currentConfig = config;

            const url = config.url;
            const ytId = this.#extractYouTubeId(url);
            this.#isAudioOnly = !!config.isAudioOnly;
            const startTime = config.startTime || 0;

            if (config.borderRadius) {
                this.#container.style.borderRadius = typeof config.borderRadius === 'number' ? `${config.borderRadius}px` : config.borderRadius;
            } else {
                this.#container.style.borderRadius = '';
            }

            this.#titleEl.textContent = config.stationName || '';

            let rawThumb = config.thumbnailUrl || config.thumbnail;
            if (!rawThumb && config.showThumbnail && ytId) {
                rawThumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
            }

            const activeThumbUrl = this.#parseImageUrl(rawThumb);

            if (activeThumbUrl && this.#isAudioOnly) {
                this.#thumbEl.classList.add('usp-hidden');

                this.#thumbEl.onload = () => {
                    this.#thumbEl.classList.remove('usp-hidden');
                };

                this.#thumbEl.onerror = () => {
                    this.#thumbEl.classList.add('usp-hidden');
                    this.#titleEl.classList.remove('usp-hidden');
                };

                this.#thumbEl.src = activeThumbUrl;

                if (config.thumbnailFull) {
                    this.#thumbEl.classList.add('usp-audio-thumb-full');
                } else {
                    this.#thumbEl.classList.remove('usp-audio-thumb-full');
                }

                this.#titleEl.classList.add('usp-hidden');
            } else {
                this.#thumbEl.src = '';
                this.#thumbEl.classList.add('usp-hidden');
                this.#thumbEl.classList.remove('usp-audio-thumb-full');
                this.#titleEl.classList.remove('usp-hidden');
            }

            if (this.#isAudioOnly) {
                this.#container.classList.add('is-audio-mode');
                this.#audioControlsEl.classList.remove('usp-hidden');
            } else {
                this.#container.classList.remove('is-audio-mode');
                this.#audioControlsEl.classList.add('usp-hidden');
            }

            this.#updateAudioBgColor(false);

            if (ytId) {
                this.#currentMode = 'youtube';
                this.#videoEl.classList.add('usp-hidden');
                this.#ytHolderEl.classList.remove('usp-hidden');

                if (this.#isAudioOnly) {
                    this.#overlayEl.classList.remove('usp-hidden');
                } else {
                    this.#overlayEl.classList.add('usp-hidden');
                }

                this.#loadYouTubeVideo(ytId, startTime);

            } else {
                this.#currentMode = 'html5';
                this.#ytHolderEl.classList.add('usp-hidden');
                this.#videoEl.classList.remove('usp-hidden');

                const type = config.type || (url.includes('.m3u8') ? 'hls' : 'direct');

                if (this.#isAudioOnly) {
                    this.#overlayEl.classList.remove('usp-hidden');
                } else {
                    this.#overlayEl.classList.add('usp-hidden');
                }

                this.#videoEl.controls = this.#showNativeControls && !this.#isAudioOnly;
                this.#videoEl.volume = this.#volume;

                if (type === 'hls') {
                    if (Hls.isSupported()) {
                        this.#hls = new Hls({ startPosition: startTime > 0 ? startTime : -1 });

                        this.#hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
                            this.#isHlsLive = data.details.live;
                            this.#emitTimeUpdate();
                        });

                        this.#hls.loadSource(url);
                        this.#hls.attachMedia(this.#videoEl);
                        this.#hls.on(Hls.Events.MANIFEST_PARSED, () => {
                            if (startTime > 0) this.#videoEl.currentTime = startTime;
                            this.#play();
                        });
                    } else if (this.#videoEl.canPlayType('application/vnd.apple.mpegurl')) {
                        this.#videoEl.src = url;
                        if (startTime > 0) {
                            const onLoaded = () => {
                                this.#videoEl.currentTime = startTime;
                                this.#videoEl.removeEventListener('loadedmetadata', onLoaded);
                            };
                            this.#videoEl.addEventListener('loadedmetadata', onLoaded);
                        }
                        this.#play();
                    } else {
                        alert('HLS nie jest obsługiwany przez Twoją przeglądarkę.');
                    }
                } else {
                    this.#videoEl.src = url;
                    if (startTime > 0) {
                        const onLoaded = () => {
                            this.#videoEl.currentTime = startTime;
                            this.#videoEl.removeEventListener('loadedmetadata', onLoaded);
                        };
                        this.#videoEl.addEventListener('loadedmetadata', onLoaded);
                    }
                    this.#play();
                }
            }
        }

        #play() {
            if (this.#currentMode === 'youtube' && this.#ytPlayer && this.#ytPlayer.playVideo) {
                this.#ytPlayer.playVideo();
            } else if (this.#videoEl) {
                const playPromise = this.#videoEl.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.warn("Wymagana interakcja użytkownika:", error);
                        this.#updateState(false);
                    });
                }
            }
        }

        #pause() {
            if (this.#currentMode === 'youtube' && this.#ytPlayer && this.#ytPlayer.pauseVideo) {
                this.#ytPlayer.pauseVideo();
            } else if (this.#videoEl) {
                this.#videoEl.pause();
            }
        }

        #togglePlay() {
            if (this.#currentMode === 'youtube' && this.#ytPlayer && this.#ytPlayer.getPlayerState) {
                const state = this.#ytPlayer.getPlayerState();
                if (state === YT.PlayerState.PLAYING) {
                    this.#pause();
                } else {
                    this.#play();
                }
            } else {
                if (this.#videoEl.paused) {
                    this.#play();
                } else {
                    this.#pause();
                }
            }
        }

        #toggleFullscreen() {
            const fsElement = document.fullscreenElement || 
                              document.webkitFullscreenElement || 
                              document.msFullscreenElement;

            if (!fsElement) {
                if (this.#container.requestFullscreen) {
                    this.#container.requestFullscreen();
                } else if (this.#container.webkitRequestFullscreen) {
                    this.#container.webkitRequestFullscreen();
                } else if (this.#container.msRequestFullscreen) {
                    this.#container.msRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
            }
        }

        #destroy() {
            this.#stopYTTimer();
            this.#isHlsLive = false;
            this.#isMetadataLoaded = false;

            if (this.#container) {
                this.#container.style.borderRadius = '';
            }

            if (this.#overlayEl) {
                this.#overlayEl.style.backgroundColor = '';
            }

            if (this.#thumbEl) {
                this.#thumbEl.onload = null;
                this.#thumbEl.onerror = null;
                this.#thumbEl.src = '';
                this.#thumbEl.classList.add('usp-hidden');
                this.#thumbEl.classList.remove('usp-audio-thumb-full');
            }
            if (this.#titleEl) {
                this.#titleEl.classList.remove('usp-hidden');
            }

            if (this.#hls) {
                this.#hls.destroy();
                this.#hls = null;
            }
            if (this.#ytPlayer && this.#ytPlayer.stopVideo) {
                this.#ytPlayer.stopVideo();
            }
            this.#videoEl.pause();
            this.#videoEl.removeAttribute('src');
            this.#videoEl.load();
            this.#updateState(false);
            this.#emitTimeUpdate();
        }

        getAPI() {
            return {
                load: (config) => this.#load(config),
                play: () => this.#play(),
                pause: () => this.#pause(),
                togglePlay: () => this.#togglePlay(),
                toggleFullscreen: () => this.#toggleFullscreen(),
                setNativeControls: (enabled) => this.setNativeControls(enabled),
                setVolume: (value) => this.#setVolume(value),
                toggleMute: () => this.#toggleMute(),
                getVolume: () => this.#volume,
                destroy: () => this.#destroy()
            };
        }
    }
