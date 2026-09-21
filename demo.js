/** Licencjonowane źródło wideo Big Buck Bunny (Creative Commons BY 3.0 Blender Foundation) */
   /** Licencjonowane źródło wideo Big Buck Bunny (Creative Commons BY 3.0 Blender Foundation) */
const MEDIA_SOURCE = {
    title: "Big Buck Bunny (Blender Foundation)",
    mp4: "https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4",
    hls: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    youtube: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    thumbnail: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Big_Buck_Bunny_loves_Creative_Commons.png",
    bgColorOnline: "#1b3a1b",
    bgColorOffline: "#3a1b1b"
};
    /** @type {string} SVG ikony głośności panelu zewnętrznego. */
    const SVG_EXT_VOL_HIGH = `<svg width="18" height="18" viewBox="0 0 24 24" fill="#0084ff"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
    
    /** @type {string} SVG ikony wyciszonego dźwięku panelu zewnętrznego. */
    const SVG_EXT_VOL_MUTED = `<svg width="18" height="18" viewBox="0 0 24 24" fill="#0084ff"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`;

    /** @type {HTMLElement} Element zegara/czasu w panelu zewnętrznym demo. */
    const timeDisplayEl = document.getElementById('time-display');

    /** Instancja odtwarzacza skojarzona z elementem `#player-container`. */
    const player = new UniversalStreamPlayer('player-container', {
        onTimeUpdate: ({ currentTime, duration, isLive, isReady, bufferMB, bufferSeconds }) => {
            const formattedCurrent = UniversalStreamPlayer.formatTime(currentTime);
            const bufferFormatted = ` | Bufor: ${bufferMB.toFixed(2)} MB (${bufferSeconds}s)`;

            if (isLive) {
                timeDisplayEl.innerHTML = `${formattedCurrent} / NA ŻYWO <span class="buffer-info">${bufferFormatted}</span>`;
                timeDisplayEl.classList.add('is-live');
            } else if (!isReady && isNaN(duration)) {
                timeDisplayEl.innerHTML = `${formattedCurrent} / --:-- <span class="buffer-info">${bufferFormatted}</span>`;
                timeDisplayEl.classList.remove('is-live');
            } else {
                const formattedDuration = UniversalStreamPlayer.formatTime(duration);
                timeDisplayEl.innerHTML = `${formattedCurrent} / ${formattedDuration} <span class="buffer-info">${bufferFormatted}</span>`;
                timeDisplayEl.classList.remove('is-live');
            }
        },
        onVolumeChange: (val) => {
            updateVolumeUI(val);
        }
    });

    /** @type {PlayerAPI} Dostęp do publicznych metod API odtwarzacza. */
    const playerAPI = player.getAPI();

    /**
     * Buduje i aplikuje nową konfigurację na podstawie ustawień panelu
     */
    function applyConfiguration() {
        const src = MEDIA_SOURCE;
        const format = document.getElementById('config-format').value;
        const isAudioOnly = document.getElementById('config-audio-only').checked;
        const startTime = parseFloat(document.getElementById('config-start-time').value) || 0;
        const borderRadius = document.getElementById('config-border-radius').value;
        const thumbnailFull = document.getElementById('config-thumb-full').checked;

        let url = src.mp4;
        let type = 'mp4';

        if (format === 'hls') {
            url = src.hls;
            type = 'hls';
        } else if (format === 'youtube') {
            url = src.youtube;
            type = 'youtube';
        }

        const config = {
            url: url,
            type: type,
            isAudioOnly: isAudioOnly,
            startTime: startTime,
            stationName: src.title,
            thumbnailUrl: src.thumbnail,
            showThumbnail: true,
            thumbnailFull: thumbnailFull,
            borderRadius: borderRadius,
            bgColorOnline: src.bgColorOnline,
            bgColorOffline: src.bgColorOffline
        };

        playerAPI.load(config);
    }

    function updateVolumeUI(val) {
        const slider = document.getElementById('volume-slider');
        const text = document.getElementById('volume-text');
        const icon = document.getElementById('volume-icon');

        slider.value = val;
        text.textContent = `${Math.round(val * 100)}%`;

        const parsed = parseFloat(val);
        if (parsed === 0) {
            icon.innerHTML = SVG_EXT_VOL_MUTED;
        } else {
            icon.innerHTML = SVG_EXT_VOL_HIGH;
        }
    }

    function onVolumeChange(val) {
        playerAPI.setVolume(val);
        updateVolumeUI(val);
    }

    function toggleMute() {
        const newVol = playerAPI.toggleMute();
        updateVolumeUI(newVol);
    }

    function onNativeControlsToggle(isChecked) {
        playerAPI.setNativeControls(isChecked);
    }

    function externalPlay() { playerAPI.play(); }
    function externalPause() { playerAPI.pause(); }
    function externalToggleFullscreen() { playerAPI.toggleFullscreen(); }

    window.addEventListener('DOMContentLoaded', () => {
        applyConfiguration();
    });
