// Versutus Web Music Player
// Powered by Howler.js

document.addEventListener('DOMContentLoaded', () => {
    // Player State
    let catalog = [];
    let queue = [];
    let currentIndex = -1;
    let currentHowl = null;
    let isPlaying = false;
    let isShuffle = false;
    let repeatMode = 'off'; // 'off' | 'all' | 'one'
    let volume = 0.8;
    let isMuted = false;
    let seekTimer = null;

    // DOM Elements
    const playerDisc = document.getElementById('player-disc');
    const playerTitle = document.getElementById('player-title');
    const playerArtist = document.getElementById('player-artist');
    const currentTimeEl = document.getElementById('current-time');
    const totalDurationEl = document.getElementById('total-duration');
    const seekBar = document.getElementById('seek-bar');
    const btnPlay = document.getElementById('btn-play');
    const playIcon = document.getElementById('play-icon');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnShuffle = document.getElementById('btn-shuffle');
    const btnRepeat = document.getElementById('btn-repeat');
    const repeatBadge = document.getElementById('repeat-badge');
    const btnMute = document.getElementById('btn-mute');
    const muteIcon = document.getElementById('mute-icon');
    const volumeBar = document.getElementById('volume-bar');
    const volumePercent = document.getElementById('volume-percent');
    const queueList = document.getElementById('queue-list');
    const catalogList = document.getElementById('catalog-list');
    const btnClearQueue = document.getElementById('btn-clear-queue');
    const btnQueueAll = document.getElementById('btn-queue-all');

    // Format seconds to mm:ss
    function formatTime(secs) {
        if (!secs || isNaN(secs) || secs < 0) return '0:00';
        const minutes = Math.floor(secs / 60) || 0;
        const seconds = Math.floor(secs % 60) || 0;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    // Extract song title, falling back to decoded filename from URL
    function getSongTitle(song) {
        if (song.title && song.title.trim()) {
            return song.title.trim();
        }
        if (song.url) {
            try {
                const raw = song.url.substring(song.url.lastIndexOf('/') + 1);
                const decoded = decodeURIComponent(raw);
                return decoded.replace(/\.[^/.]+$/, '');
            } catch (e) {
                return song.id || 'track';
            }
        }
        return song.id || 'track';
    }

    // Extract song artist, falling back to versutus
    function getSongArtist(song) {
        if (song.artist && song.artist.trim()) {
            return song.artist.trim();
        }
        return 'versutus';
    }

    // Load catalog from catalog.json
    async function loadCatalog() {
        try {
            const res = await fetch('catalog.json');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const rawCatalog = await res.json();
            
            // Normalize songs with title and artist fallback
            catalog = rawCatalog.map(song => ({
                ...song,
                title: getSongTitle(song),
                artist: getSongArtist(song)
            }));
            
            // Initialize queue with catalog songs
            queue = [...catalog];
            
            renderCatalog();
            renderQueue();

            if (queue.length > 0) {
                // Prepare the first song without auto-playing
                loadTrack(0, false);
            }
        } catch (err) {
            console.error('Failed to load music catalog:', err);
            if (catalogList) {
                catalogList.innerHTML = `<div class="empty-state">failed to load catalog</div>`;
            }
        }
    }

    // Load and optionally play a track from queue
    function loadTrack(index, autoPlay = true) {
        if (index < 0 || index >= queue.length) {
            resetPlayerDisplay();
            return;
        }

        if (currentHowl) {
            currentHowl.stop();
            currentHowl.unload();
            currentHowl = null;
        }

        currentIndex = index;
        const song = queue[currentIndex];

        // Update UI info
        playerTitle.removeAttribute('data-i18n');
        playerTitle.textContent = song.title;
        playerArtist.textContent = song.artist || 'versutus';
        currentTimeEl.textContent = '0:00';
        totalDurationEl.textContent = '0:00';
        seekBar.value = 0;

        renderQueue();
        renderCatalog();

        // Create new Howl instance
        // IMPORTANT: html5: true allows progressive streaming and bypasses R2 bucket CORS
        currentHowl = new Howl({
            src: [song.url],
            html5: true,
            volume: isMuted ? 0 : volume,
            onload: () => {
                totalDurationEl.textContent = formatTime(currentHowl.duration());
            },
            onplay: () => {
                isPlaying = true;
                updatePlayState(true);
                startSeekTimer();
            },
            onpause: () => {
                isPlaying = false;
                updatePlayState(false);
                stopSeekTimer();
            },
            onstop: () => {
                isPlaying = false;
                updatePlayState(false);
                stopSeekTimer();
                seekBar.value = 0;
                currentTimeEl.textContent = '0:00';
            },
            onend: () => {
                handleTrackEnd();
            },
            onloaderror: (id, err) => {
                console.error('Audio load error:', err);
                playerTitle.textContent = `error loading ${song.title}`;
                updatePlayState(false);
            },
            onplayerror: (id, err) => {
                console.warn('Audio play error (waiting for user interaction):', err);
                updatePlayState(false);
                if (currentHowl) {
                    currentHowl.once('unlock', () => {
                        currentHowl.play();
                    });
                }
            }
        });

        if (autoPlay) {
            currentHowl.play();
        }
    }

    // Update play/pause button and spinning disc UI
    function updatePlayState(playing) {
        if (playIcon) {
            playIcon.textContent = playing ? '⏸' : '▶';
        }
        if (playerDisc) {
            if (playing) {
                playerDisc.classList.add('spinning');
            } else {
                playerDisc.classList.remove('spinning');
            }
        }
    }

    // Reset player display when queue is empty
    function resetPlayerDisplay() {
        if (currentHowl) {
            currentHowl.stop();
            currentHowl.unload();
            currentHowl = null;
        }
        currentIndex = -1;
        isPlaying = false;
        updatePlayState(false);
        stopSeekTimer();
        playerTitle.setAttribute('data-i18n', 'no-song-playing');
        playerArtist.textContent = 'versutus';
        currentTimeEl.textContent = '0:00';
        totalDurationEl.textContent = '0:00';
        seekBar.value = 0;
        renderQueue();
        renderCatalog();
        if (window.applyTranslations) window.applyTranslations();
    }

    // Track progression logic
    function handleTrackEnd() {
        if (repeatMode === 'one') {
            currentHowl.seek(0);
            currentHowl.play();
            return;
        }

        if (isShuffle && queue.length > 1) {
            let nextRandomIndex = currentIndex;
            while (nextRandomIndex === currentIndex) {
                nextRandomIndex = Math.floor(Math.random() * queue.length);
            }
            loadTrack(nextRandomIndex, true);
            return;
        }

        const nextIndex = currentIndex + 1;
        if (nextIndex < queue.length) {
            loadTrack(nextIndex, true);
        } else {
            if (repeatMode === 'all') {
                loadTrack(0, true);
            } else {
                // Finished queue
                currentHowl.stop();
                updatePlayState(false);
                stopSeekTimer();
                seekBar.value = 0;
                currentTimeEl.textContent = '0:00';
            }
        }
    }

    function playNext() {
        if (queue.length === 0) return;

        if (isShuffle && queue.length > 1) {
            let nextRandomIndex = currentIndex;
            while (nextRandomIndex === currentIndex) {
                nextRandomIndex = Math.floor(Math.random() * queue.length);
            }
            loadTrack(nextRandomIndex, true);
            return;
        }

        let nextIndex = currentIndex + 1;
        if (nextIndex >= queue.length) {
            nextIndex = 0;
        }
        loadTrack(nextIndex, true);
    }

    function playPrev() {
        if (queue.length === 0) return;

        // If played more than 3 seconds, restart current song
        if (currentHowl && currentHowl.seek() > 3) {
            currentHowl.seek(0);
            return;
        }

        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) {
            prevIndex = queue.length - 1;
        }
        loadTrack(prevIndex, true);
    }

    function togglePlay() {
        if (!currentHowl) {
            if (queue.length > 0) {
                loadTrack(currentIndex >= 0 ? currentIndex : 0, true);
            }
            return;
        }

        if (isPlaying) {
            currentHowl.pause();
        } else {
            currentHowl.play();
        }
    }

    // Seek timer & scrub
    function startSeekTimer() {
        stopSeekTimer();
        seekTimer = setInterval(() => {
            if (currentHowl && isPlaying) {
                const seek = currentHowl.seek() || 0;
                const duration = currentHowl.duration() || 0;
                currentTimeEl.textContent = formatTime(seek);
                if (duration > 0) {
                    seekBar.value = (seek / duration) * 100;
                    totalDurationEl.textContent = formatTime(duration);
                }
            }
        }, 250);
    }

    function stopSeekTimer() {
        if (seekTimer) {
            clearInterval(seekTimer);
            seekTimer = null;
        }
    }

    seekBar.addEventListener('input', () => {
        if (currentHowl && currentHowl.duration()) {
            const seekTo = (seekBar.value / 100) * currentHowl.duration();
            currentTimeEl.textContent = formatTime(seekTo);
        }
    });

    seekBar.addEventListener('change', () => {
        if (currentHowl && currentHowl.duration()) {
            const seekTo = (seekBar.value / 100) * currentHowl.duration();
            currentHowl.seek(seekTo);
        }
    });

    // Volume & Mute
    volumeBar.addEventListener('input', (e) => {
        volume = parseFloat(e.target.value);
        isMuted = volume === 0;
        volumePercent.textContent = `${Math.round(volume * 100)}%`;
        muteIcon.textContent = isMuted ? '🔇' : '🔊';
        if (currentHowl) {
            currentHowl.volume(isMuted ? 0 : volume);
        }
    });

    btnMute.addEventListener('click', () => {
        isMuted = !isMuted;
        muteIcon.textContent = isMuted ? '🔇' : '🔊';
        if (isMuted) {
            volumeBar.value = 0;
            volumePercent.textContent = '0%';
            if (currentHowl) currentHowl.volume(0);
        } else {
            if (volume === 0) volume = 0.8;
            volumeBar.value = volume;
            volumePercent.textContent = `${Math.round(volume * 100)}%`;
            if (currentHowl) currentHowl.volume(volume);
        }
    });

    // Shuffle & Repeat Mode Toggles
    btnShuffle.addEventListener('click', () => {
        isShuffle = !isShuffle;
        btnShuffle.classList.toggle('active', isShuffle);
        btnShuffle.title = isShuffle ? 'Shuffle (on)' : 'Shuffle (off)';
    });

    btnRepeat.addEventListener('click', () => {
        if (repeatMode === 'off') {
            repeatMode = 'all';
            btnRepeat.classList.add('active');
            repeatBadge.textContent = 'all';
            btnRepeat.title = 'Repeat (all)';
        } else if (repeatMode === 'all') {
            repeatMode = 'one';
            btnRepeat.classList.add('active');
            repeatBadge.textContent = '1';
            btnRepeat.title = 'Repeat (one)';
        } else {
            repeatMode = 'off';
            btnRepeat.classList.remove('active');
            repeatBadge.textContent = '';
            btnRepeat.title = 'Repeat (off)';
        }
    });

    // Transport buttons
    btnPlay.addEventListener('click', togglePlay);
    btnNext.addEventListener('click', playNext);
    btnPrev.addEventListener('click', playPrev);

    // Queue Manipulations
    window.player = {
        playFromQueue(index) {
            loadTrack(index, true);
        },
        playFromCatalog(id) {
            const song = catalog.find(s => s.id === id);
            if (!song) return;

            // Check if song already exists in queue
            const existingIndex = queue.findIndex(s => s.id === id);
            if (existingIndex !== -1) {
                loadTrack(existingIndex, true);
            } else {
                // Add right after current track and play
                const insertAt = currentIndex >= 0 ? currentIndex + 1 : queue.length;
                queue.splice(insertAt, 0, { ...song });
                loadTrack(insertAt, true);
            }
        },
        addToQueue(id) {
            const song = catalog.find(s => s.id === id);
            if (!song) return;
            queue.push({ ...song });
            renderQueue();

            // If nothing was loaded, prepare it
            if (currentIndex === -1) {
                loadTrack(0, false);
            }
        },
        removeFromQueue(index, event) {
            if (event) event.stopPropagation();
            if (index < 0 || index >= queue.length) return;

            if (index === currentIndex) {
                if (queue.length === 1) {
                    queue = [];
                    resetPlayerDisplay();
                    return;
                }
                const shouldPlayNext = isPlaying;
                queue.splice(index, 1);
                const newIndex = index < queue.length ? index : 0;
                loadTrack(newIndex, shouldPlayNext);
            } else {
                if (index < currentIndex) {
                    currentIndex--;
                }
                queue.splice(index, 1);
                renderQueue();
            }
        },
        moveQueueItem(index, direction, event) {
            if (event) event.stopPropagation();
            const targetIndex = index + direction;
            if (targetIndex < 0 || targetIndex >= queue.length) return;

            const [item] = queue.splice(index, 1);
            queue.splice(targetIndex, 0, item);

            // Update currentIndex pointer
            if (currentIndex === index) {
                currentIndex = targetIndex;
            } else if (index < currentIndex && targetIndex >= currentIndex) {
                currentIndex--;
            } else if (index > currentIndex && targetIndex <= currentIndex) {
                currentIndex++;
            }

            renderQueue();
        },
        clearQueue() {
            queue = [];
            resetPlayerDisplay();
        },
        queueAll() {
            catalog.forEach(song => queue.push({ ...song }));
            renderQueue();
            if (currentIndex === -1 && queue.length > 0) {
                loadTrack(0, false);
            }
        }
    };

    btnClearQueue.addEventListener('click', () => window.player.clearQueue());
    btnQueueAll.addEventListener('click', () => window.player.queueAll());

    // Render Play Queue UI
    function renderQueue() {
        if (!queueList) return;

        if (queue.length === 0) {
            queueList.innerHTML = `<div class="empty-state" data-i18n="queue-empty">queue is empty - click "+ queue" on any song below</div>`;
            return;
        }

        queueList.innerHTML = queue.map((song, i) => {
            const isCurrent = i === currentIndex;
            return `
                <div class="queue-item ${isCurrent ? 'active' : ''}" onclick="window.player.playFromQueue(${i})">
                    <div class="item-left">
                        <span class="item-index">${i + 1}.</span>
                        <span class="item-status">${isCurrent ? (isPlaying ? '▶' : '⏸') : '•'}</span>
                        <div class="item-info">
                            <span class="item-title">${escapeHtml(song.title)}</span>
                            <span class="item-artist">${escapeHtml(song.artist || 'versutus')}</span>
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="icon-action-btn" title="Move Up" ${i === 0 ? 'disabled' : ''} onclick="window.player.moveQueueItem(${i}, -1, event)">▲</button>
                        <button class="icon-action-btn" title="Move Down" ${i === queue.length - 1 ? 'disabled' : ''} onclick="window.player.moveQueueItem(${i}, 1, event)">▼</button>
                        <button class="icon-action-btn delete-btn" title="Remove" onclick="window.player.removeFromQueue(${i}, event)">✕</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Render Catalog UI
    function renderCatalog() {
        if (!catalogList) return;

        if (catalog.length === 0) {
            catalogList.innerHTML = `<div class="empty-state">no songs found in catalog</div>`;
            return;
        }

        catalogList.innerHTML = catalog.map((song, i) => {
            const isCurrent = currentIndex >= 0 && queue[currentIndex] && queue[currentIndex].id === song.id;
            return `
                <div class="catalog-item ${isCurrent ? 'active' : ''}">
                    <div class="item-left" onclick="window.player.playFromCatalog('${song.id}')">
                        <span class="item-index">${i + 1}</span>
                        <div class="item-info">
                            <span class="item-title">${escapeHtml(song.title)}</span>
                            <span class="item-artist">${escapeHtml(song.artist || 'versutus')}</span>
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="action-btn play-btn" onclick="window.player.playFromCatalog('${song.id}')">
                            ${isCurrent && isPlaying ? '⏸' : '▶'}
                        </button>
                        <button class="action-btn add-btn" title="Add to queue" onclick="window.player.addToQueue('${song.id}')">
                            + queue
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Start loading
    loadCatalog();
});
