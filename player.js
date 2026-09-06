// Versutus Web Music Player
// Powered by Howler.js

document.addEventListener('DOMContentLoaded', () => {
    // Player State
    let catalog = [];
    let defaultQueue = []; // Preserves default (newest-to-oldest) order
    let queue = [];        // Active playback queue (reflects true playback order)
    let currentIndex = -1;
    let currentHowl = null;
    let isPlaying = false;
    let isShuffle = false;
    let repeatMode = 'off'; // 'off' | 'all' | 'one'
    let volume = 1.0;       // Default volume 100%
    let isMuted = false;
    let seekTimer = null;
    let searchQuery = '';
    let stemHowls = { vocals: null, instrumental: null };
    let usingStems = false;
    let stemToggles = { vocals: true, instrumental: true };

    // Embedded fallback catalog for local file:// usage
    const FALLBACK_CATALOG = [
      {
        "url": "https://pub-a277c8d4ae8148c6a7cd515084eb58f1.r2.dev/v%E5%85%9C%E5%9C%88.mp3",
        "timeAdded": "2026-09-06 16:45:00"
      },
      {
        "url": "https://pub-a277c8d4ae8148c6a7cd515084eb58f1.r2.dev/p%20%E5%83%8F%E6%99%B4%E5%A4%A9%E5%83%8F%E9%9B%A8%E5%A4%A9%20prod_2.mp3",
        "timeAdded": "2026-09-06 16:44:00"
      },
      {
        "url": "https://pub-a277c8d4ae8148c6a7cd515084eb58f1.r2.dev/p%20been%20like%20this.mp3",
        "timeAdded": "2026-09-06 16:43:00"
      },
      {
        "url": "https://pub-a277c8d4ae8148c6a7cd515084eb58f1.r2.dev/p%20highs%20and%20lows%20dave%20the%20diver.mp3",
        "timeAdded": "2026-09-06 16:42:00"
      },
      {
        "url": "https://pub-a277c8d4ae8148c6a7cd515084eb58f1.r2.dev/p%20cry%20baby_3.mp3",
        "timeAdded": "2026-09-06 16:41:00"
      },
      {
        "url": "https://pub-a277c8d4ae8148c6a7cd515084eb58f1.r2.dev/p%20still%20dreaming%20syco%20boba%20again%20rec_2.mp3",
        "timeAdded": "2026-09-06 15:00:00"
      },
      {
        "url": "https://pub-a277c8d4ae8148c6a7cd515084eb58f1.r2.dev/p%20eye%20to%20eye%20cover_2.mp3",
        "timeAdded": "2026-09-06 14:00:00"
      },
      {
        "url": "https://pub-a277c8d4ae8148c6a7cd515084eb58f1.r2.dev/p%20paradice.mp3",
        "timeAdded": "2026-09-06 13:00:00",
        "stems": {
          "vocals": "https://pub-a277c8d4ae8148c6a7cd515084eb58f1.r2.dev/p%20iso%20paradice_2.mp3",
          "instrumental": "https://pub-a277c8d4ae8148c6a7cd515084eb58f1.r2.dev/p%20inst%20paradice_2.mp3"
        }
      },
      {
        "url": "https://pub-a277c8d4ae8148c6a7cd515084eb58f1.r2.dev/p%20sennichite_9.mp3",
        "timeAdded": "2026-09-06 12:00:00"
      },
      {
        "url": "https://pub-a277c8d4ae8148c6a7cd515084eb58f1.r2.dev/zoey's%20arcade_4.mp3",
        "timeAdded": "2026-09-06 11:00:00"
      }
    ];

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
    const stemControls = document.getElementById('stem-controls');
    const btnStemVocals = document.getElementById('btn-stem-vocals');
    const btnStemInstrumental = document.getElementById('btn-stem-instrumental');
    
    // Queue & Catalog Elements
    const queueToggleHeader = document.getElementById('queue-toggle-header');
    const queueCollapsible = document.getElementById('queue-collapsible');
    const queueToggleArrow = document.getElementById('queue-toggle-arrow');
    const queueCountEl = document.getElementById('queue-count');
    const catalogCountEl = document.getElementById('catalog-count');
    const queueList = document.getElementById('queue-list');
    const catalogList = document.getElementById('catalog-list');
    const btnClearQueue = document.getElementById('btn-clear-queue');
    const btnQueueAll = document.getElementById('btn-queue-all');
    const searchInput = document.getElementById('search-songs');
    const searchClearBtn = document.getElementById('search-clear-btn');

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

    // Extract clean, URL/DOM-safe slug ID derived from filename or url
    function getSongId(song, index) {
        if (song.id && song.id.trim()) {
            return song.id.trim();
        }
        const title = getSongTitle(song);
        const slug = title.toLowerCase()
            .replace(/[^\p{Letter}\p{Number}_-]/gu, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        return slug || `track-${index + 1}`;
    }

    // Extract song artist, falling back to versutus
    function getSongArtist(song) {
        if (song.artist && song.artist.trim()) {
            return song.artist.trim();
        }
        return 'versutus';
    }

    // Shuffle helper (Fisher-Yates)
    function shuffleArray(arr) {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }

    // Load catalog from catalog.json, falling back to embedded catalog if fetch fails
    async function loadCatalog() {
        let rawCatalog;
        try {
            const res = await fetch('catalog.json');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            rawCatalog = await res.json();
        } catch (err) {
            console.warn('Failed to fetch catalog.json, using embedded fallback catalog:', err);
            rawCatalog = [...FALLBACK_CATALOG];
        }

        // Sort songs by timeAdded descending (newest at the top)
        rawCatalog.sort((a, b) => {
            const parseDate = (d) => {
                if (!d) return 0;
                const iso = d.includes('T') ? d : d.replace(' ', 'T');
                const ts = new Date(iso).getTime();
                return isNaN(ts) ? 0 : ts;
            };
            return parseDate(b.timeAdded) - parseDate(a.timeAdded);
        });

        // Normalize songs with auto-derived IDs and titles
        catalog = rawCatalog.map((song, i) => ({
            ...song,
            title: getSongTitle(song),
            id: getSongId(song, i),
            artist: getSongArtist(song)
        }));

        // Default queue: newest to oldest (sorted catalog order)
        defaultQueue = [...catalog];
        queue = [...defaultQueue];

        renderCatalog();
        renderQueue();

        if (queue.length > 0) {
            loadTrack(0, false);
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

        resetStemPlayback();

        currentIndex = index;
        const song = queue[currentIndex];

        // Update UI info
        playerTitle.removeAttribute('data-i18n');
        playerTitle.textContent = song.title;
        playerArtist.textContent = song.artist;
        currentTimeEl.textContent = '0:00';
        totalDurationEl.textContent = '0:00';
        seekBar.value = 0;

        setupStemsForCurrentSong(song);

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

        ensureLimiter();

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
        resetStemPlayback();
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

    // Re-randomize queue at end of shuffle and play first song
    function reshuffleQueue() {
        const lastSong = (currentIndex >= 0 && currentIndex < queue.length) ? queue[currentIndex] : null;
        let newQueue = shuffleArray(defaultQueue);

        if (lastSong && newQueue.length > 1 && newQueue[0].id === lastSong.id) {
            const swapIdx = Math.floor(Math.random() * (newQueue.length - 1)) + 1;
            [newQueue[0], newQueue[swapIdx]] = [newQueue[swapIdx], newQueue[0]];
        }

        queue = newQueue;
        renderQueue();
        loadTrack(0, true);
    }

    // Track progression logic (true order)
    function handleTrackEnd() {
        if (repeatMode === 'one') {
            currentHowl.seek(0);
            currentHowl.play();
            return;
        }

        const nextIndex = currentIndex + 1;
        if (nextIndex < queue.length) {
            loadTrack(nextIndex, true);
        } else {
            if (isShuffle) {
                reshuffleQueue();
            } else if (repeatMode === 'all') {
                loadTrack(0, true);
            } else {
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

        if (currentIndex >= queue.length - 1) {
            if (isShuffle) {
                reshuffleQueue();
                return;
            }
            loadTrack(0, true);
            return;
        }

        loadTrack(currentIndex + 1, true);
    }

    function playPrev() {
        if (queue.length === 0) return;

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
            pauseAllActiveAudio();
        } else {
            if (!currentHowl.playing()) {
                currentHowl.play();
            }
            if (usingStems) {
                syncAndResumeStems();
            }
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

            if (usingStems) {
                Object.values(stemHowls).forEach(stem => {
                    if (stem && stem.playing()) {
                        stem.seek(seekTo);
                    }
                });
            }
        }
    });

    // Volume & Mute (Default 100%)
    volumeBar.value = 1.0;
    volumePercent.textContent = '100%';

    volumeBar.addEventListener('input', (e) => {
        volume = parseFloat(e.target.value);
        isMuted = volume === 0;
        volumePercent.textContent = `${Math.round(volume * 100)}%`;
        muteIcon.textContent = isMuted ? '🔇' : '🔊';
        updateAllVolumes();
    });

    btnMute.addEventListener('click', () => {
        isMuted = !isMuted;
        muteIcon.textContent = isMuted ? '🔇' : '🔊';
        if (isMuted) {
            volumeBar.value = 0;
            volumePercent.textContent = '0%';
        } else {
            if (volume === 0) volume = 1.0;
            volumeBar.value = volume;
            volumePercent.textContent = `${Math.round(volume * 100)}%`;
        }
        updateAllVolumes();
    });

    // Shuffle Toggle: true order manipulation
    btnShuffle.addEventListener('click', () => {
        isShuffle = !isShuffle;
        btnShuffle.classList.toggle('active', isShuffle);
        btnShuffle.title = isShuffle ? 'Shuffle (on)' : 'Shuffle (off)';

        if (queue.length <= 1) return;

        const currentSong = currentIndex >= 0 ? queue[currentIndex] : null;

        if (isShuffle) {
            if (currentSong) {
                const remaining = defaultQueue.filter(s => s.id !== currentSong.id);
                queue = [currentSong, ...shuffleArray(remaining)];
                currentIndex = 0;
            } else {
                queue = shuffleArray(defaultQueue);
                currentIndex = 0;
            }
        } else {
            queue = [...defaultQueue];
            if (currentSong) {
                currentIndex = queue.findIndex(s => s.id === currentSong.id);
                if (currentIndex === -1) currentIndex = 0;
            } else {
                currentIndex = 0;
            }
        }

        renderQueue();
    });

    // Repeat Mode Toggle
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

    if (btnStemVocals) {
        btnStemVocals.addEventListener('click', () => toggleStem('vocals'));
    }
    if (btnStemInstrumental) {
        btnStemInstrumental.addEventListener('click', () => toggleStem('instrumental'));
    }

    // Collapsible Queue Toggle
    if (queueToggleHeader && queueCollapsible) {
        queueToggleHeader.addEventListener('click', () => {
            const isCollapsed = queueCollapsible.classList.toggle('collapsed');
            if (queueToggleArrow) {
                queueToggleArrow.textContent = isCollapsed ? '▼' : '▲';
            }
        });
    }

    // Search filter for catalog
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim().toLowerCase();
            if (searchClearBtn) {
                searchClearBtn.style.display = searchQuery ? 'inline-block' : 'none';
            }
            renderCatalog();
        });
    }

    if (searchClearBtn) {
        searchClearBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchQuery = '';
            searchClearBtn.style.display = 'none';
            searchInput.focus();
            renderCatalog();
        });
    }

    // Queue Manipulations Window API
    window.player = {
        playFromQueue(index) {
            loadTrack(index, true);
        },
        playFromCatalog(id) {
            const song = catalog.find(s => s.id === id);
            if (!song) return;

            const existingIndex = queue.findIndex(s => s.id === id);
            if (existingIndex !== -1) {
                loadTrack(existingIndex, true);
            } else {
                const insertAt = currentIndex >= 0 ? currentIndex + 1 : queue.length;
                queue.splice(insertAt, 0, { ...song });
                defaultQueue.push({ ...song });
                loadTrack(insertAt, true);
            }
        },
        addToQueue(id) {
            const song = catalog.find(s => s.id === id);
            if (!song) return;
            queue.push({ ...song });
            defaultQueue.push({ ...song });
            renderQueue();

            if (currentIndex === -1) {
                loadTrack(0, false);
            }
        },
        removeFromQueue(index, event) {
            if (event) event.stopPropagation();
            if (index < 0 || index >= queue.length) return;

            const removedSong = queue[index];
            const defIndex = defaultQueue.findIndex(s => s.id === removedSong.id);
            if (defIndex !== -1) defaultQueue.splice(defIndex, 1);

            if (index === currentIndex) {
                if (queue.length === 1) {
                    queue = [];
                    defaultQueue = [];
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

            if (currentIndex === index) {
                currentIndex = targetIndex;
            } else if (index < currentIndex && targetIndex >= currentIndex) {
                currentIndex--;
            } else if (index > currentIndex && targetIndex <= currentIndex) {
                currentIndex++;
            }

            renderQueue();
        },
        async downloadSong(url, filename, event, buttonEl) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }

            const targetBtn = buttonEl || (event ? event.currentTarget : null);
            const originalContent = targetBtn ? targetBtn.innerHTML : '';
            if (targetBtn) {
                targetBtn.innerHTML = '⌛';
                targetBtn.style.pointerEvents = 'none';
            }

            try {
                const response = await fetch(url);
                console.log('[downloadSong] Fetch response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const blob = await response.blob();
                console.log('[downloadSong] Blob size:', blob.size);
                const blobUrl = URL.createObjectURL(blob);
                const tempLink = document.createElement('a');
                tempLink.href = blobUrl;
                tempLink.download = `${filename}.mp3`;
                document.body.appendChild(tempLink);
                tempLink.click();
                setTimeout(() => {
                    document.body.removeChild(tempLink);
                    URL.revokeObjectURL(blobUrl);
                }, 1500);

                if (targetBtn) {
                    targetBtn.innerHTML = '✓';
                    setTimeout(() => {
                        targetBtn.innerHTML = originalContent;
                        targetBtn.style.pointerEvents = '';
                    }, 1200);
                }
            } catch (err) {
                console.warn('[downloadSong] Falling back to opening in new tab:', err);
                if (targetBtn) {
                    targetBtn.innerHTML = originalContent;
                    targetBtn.style.pointerEvents = '';
                }
                // Open the MP3 in a new tab instead of forcing download
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        },
        downloadFromQueue(index, event, buttonEl) {
            const song = queue[index];
            if (song) this.downloadSong(song.url, song.title, event, buttonEl);
        },
        downloadFromCatalog(index, event, buttonEl) {
            const filteredCatalog = searchQuery
                ? catalog.filter(song => song.title.toLowerCase().includes(searchQuery) || (song.artist && song.artist.toLowerCase().includes(searchQuery)))
                : catalog;
            const song = filteredCatalog[index];
            if (song) this.downloadSong(song.url, song.title, event, buttonEl);
        },
        playFromCatalogIndex(index) {
            const filteredCatalog = searchQuery
                ? catalog.filter(song => song.title.toLowerCase().includes(searchQuery) || (song.artist && song.artist.toLowerCase().includes(searchQuery)))
                : catalog;
            const song = filteredCatalog[index];
            if (song) this.playFromCatalog(song.id);
        },
        addToQueueIndex(index) {
            const filteredCatalog = searchQuery
                ? catalog.filter(song => song.title.toLowerCase().includes(searchQuery) || (song.artist && song.artist.toLowerCase().includes(searchQuery)))
                : catalog;
            const song = filteredCatalog[index];
            if (song) this.addToQueue(song.id);
        },
        clearQueue() {
            if (currentIndex === -1 || currentIndex >= queue.length) {
                queue = [];
                defaultQueue = [];
                resetPlayerDisplay();
                return;
            }

            const currentSong = queue[currentIndex];
            queue = [currentSong];
            defaultQueue = [currentSong];
            currentIndex = 0;

            // Do not stop the current track; just update the visible queue.
            renderQueue();
        },
        queueAll() {
            catalog.forEach(song => {
                queue.push({ ...song });
                defaultQueue.push({ ...song });
            });
            renderQueue();
            if (currentIndex === -1 && queue.length > 0) {
                loadTrack(0, false);
            }
        }
    };

    if (btnClearQueue) {
        btnClearQueue.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.player.clearQueue();
        });
    }
    if (btnQueueAll) {
        btnQueueAll.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.player.queueAll();
        });
    }

    // Render Play Queue UI
    function renderQueue() {
        if (queueCountEl) {
            queueCountEl.textContent = `(${queue.length})`;
        }

        if (!queueList) return;

        if (queue.length === 0) {
            queueList.innerHTML = `<div class="empty-state" data-i18n="queue-empty">queue is empty - click "+ queue" on any song below</div>`;
            if (window.applyTranslations) window.applyTranslations();
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
                    <div class="item-actions" onclick="event.stopPropagation()">
                        <button class="icon-action-btn download-btn" title="Download" onclick="window.player.downloadFromQueue(${i}, event, this)">⤓</button>
                        <button class="icon-action-btn" title="Move Up" ${i === 0 ? 'disabled' : ''} onclick="window.player.moveQueueItem(${i}, -1, event)">▲</button>
                        <button class="icon-action-btn" title="Move Down" ${i === queue.length - 1 ? 'disabled' : ''} onclick="window.player.moveQueueItem(${i}, 1, event)">▼</button>
                        <button class="icon-action-btn delete-btn" title="Remove" onclick="window.player.removeFromQueue(${i}, event)">✕</button>
                    </div>
                </div>
            `;
        }).join('');

        if (window.applyTranslations) window.applyTranslations();
    }

    // Render Catalog UI with Search Filtering & Download Button
    function renderCatalog() {
        if (!catalogList) return;

        const filteredCatalog = searchQuery
            ? catalog.filter(song => song.title.toLowerCase().includes(searchQuery) || (song.artist && song.artist.toLowerCase().includes(searchQuery)))
            : catalog;

        if (catalogCountEl) {
            catalogCountEl.textContent = `(${filteredCatalog.length})`;
        }

        if (filteredCatalog.length === 0) {
            catalogList.innerHTML = searchQuery
                ? `<div class="empty-state">no songs found matching "${escapeHtml(searchQuery)}"</div>`
                : `<div class="empty-state">no songs in catalog</div>`;
            return;
        }

        catalogList.innerHTML = filteredCatalog.map((song, i) => {
            const isCurrent = currentIndex >= 0 && queue[currentIndex] && queue[currentIndex].id === song.id;
            return `
                <div class="catalog-item ${isCurrent ? 'active' : ''}">
                    <div class="item-left" onclick="window.player.playFromCatalogIndex(${i})">
                        <span class="item-index">${i + 1}</span>
                        <div class="item-info">
                            <span class="item-title">${escapeHtml(song.title)}</span>
                            <span class="item-artist">${escapeHtml(song.artist || 'versutus')}</span>
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="action-btn play-btn" onclick="window.player.playFromCatalogIndex(${i})">
                            ${isCurrent && isPlaying ? '⏸' : '▶'}
                        </button>
                        <button class="action-btn add-btn" title="Add to queue" onclick="window.player.addToQueueIndex(${i})">
                            + queue
                        </button>
                        <button class="action-btn download-btn" title="Download song" onclick="window.player.downloadFromCatalog(${i}, event, this)">
                            ⤓
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        if (window.applyTranslations) window.applyTranslations();
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

    function getEffectiveVolume() {
        return isMuted ? 0 : volume;
    }

    function updateAllVolumes() {
        const effVol = getEffectiveVolume();
        if (currentHowl) {
            currentHowl.volume(usingStems ? 0 : effVol);
        }
        applyStemVolumes();
    }

    function applyStemVolumes() {
        if (!usingStems) return;
        const effVol = getEffectiveVolume();
        Object.keys(stemHowls).forEach(type => {
            const stem = stemHowls[type];
            if (!stem) return;
            const shouldPlay = stemToggles[type] && !isMuted;
            stem.volume(shouldPlay ? effVol : 0);

            if (shouldPlay) {
                if (!stem.playing()) {
                    const pos = currentHowl ? (currentHowl.seek() || 0) : 0;
                    stem.seek(pos);
                    stem.play();
                }
            } else {
                if (stem.playing()) {
                    stem.pause();
                }
            }
        });
    }

    function pauseAllActiveAudio() {
        if (currentHowl && currentHowl.playing()) {
            currentHowl.pause();
        }
        Object.values(stemHowls).forEach(stem => {
            if (stem && stem.playing()) {
                stem.pause();
            }
        });
    }

    function syncAndResumeStems() {
        if (!usingStems) return;
        const pos = currentHowl ? (currentHowl.seek() || 0) : 0;
        Object.keys(stemHowls).forEach(type => {
            const stem = stemHowls[type];
            if (!stem) return;
            if (stemToggles[type] && !isMuted) {
                if (!stem.playing()) {
                    stem.seek(pos);
                    stem.play();
                    stem.volume(getEffectiveVolume());
                }
            } else {
                if (stem.playing()) {
                    stem.pause();
                }
            }
        });
    }

    function resetStemPlayback() {
        if (stemHowls.vocals) {
            stemHowls.vocals.stop();
            stemHowls.vocals.unload();
            stemHowls.vocals = null;
        }
        if (stemHowls.instrumental) {
            stemHowls.instrumental.stop();
            stemHowls.instrumental.unload();
            stemHowls.instrumental = null;
        }
        usingStems = false;
        stemToggles = { vocals: true, instrumental: true };
        updateStemControlsVisibility(false);
        updateStemButtonState();
    }

    function setupStemsForCurrentSong(song) {
        const hasStems = song.stems && song.stems.vocals && song.stems.instrumental;
        if (!hasStems) {
            usingStems = false;
            updateStemControlsVisibility(false);
            return;
        }

        usingStems = false;
        stemToggles = { vocals: true, instrumental: true };

        stemHowls.vocals = new Howl({
            src: [song.stems.vocals],
            html5: true,
            preload: true,
            volume: 0
        });

        stemHowls.instrumental = new Howl({
            src: [song.stems.instrumental],
            html5: true,
            preload: true,
            volume: 0
        });

        updateStemControlsVisibility(true);
        updateStemButtonState();
    }

    function updateStemControlsVisibility(show) {
        if (stemControls) {
            stemControls.style.display = show ? 'flex' : 'none';
        }
    }

    function updateStemButtonState() {
        if (btnStemVocals) {
            btnStemVocals.classList.toggle('active', stemToggles.vocals);
            btnStemVocals.setAttribute('aria-pressed', stemToggles.vocals ? 'true' : 'false');
        }
        if (btnStemInstrumental) {
            btnStemInstrumental.classList.toggle('active', stemToggles.instrumental);
            btnStemInstrumental.setAttribute('aria-pressed', stemToggles.instrumental ? 'true' : 'false');
        }
    }

    function enterStemMode() {
        if (!currentHowl || usingStems) return;
        usingStems = true;
        updateAllVolumes();
    }

    function toggleStem(type) {
        if (!currentHowl) return;
        stemToggles[type] = !stemToggles[type];

        if (!usingStems) {
            enterStemMode();
        } else {
            applyStemVolumes();
        }

        updateStemButtonState();
    }

    function ensureLimiter() {
        if (window.versutusLimiterInstalled) return;
        if (!Howler.ctx) return;
        window.versutusLimiterInstalled = true;

        const ctx = Howler.ctx;
        const masterGain = Howler.masterGain;
        try {
            masterGain.disconnect();
        } catch (e) {
            // ignore
        }

        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -0.1;
        compressor.knee.value = 0;
        compressor.ratio.value = 20;
        compressor.attack.value = 0.005;
        compressor.release.value = 0.3;

        masterGain.connect(compressor);
        compressor.connect(ctx.destination);
    }

    // Start loading
    loadCatalog();
});
