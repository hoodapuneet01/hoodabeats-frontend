const API_URL = "https://hoodabeats-backend.onrender.com";

const $ = (id) => document.getElementById(id);

const audio = $("audio");
const playBtn = $("playBtn");
const prevBtn = $("prevBtn");
const nextBtn = $("nextBtn");
const progress = $("progress");
const volume = $("volume");
const currentTime = $("currentTime");
const duration = $("duration");
const songTitle = $("songTitle");
const songArtist = $("songArtist");
const songList = $("songList");
const downloadBtn = $("downloadBtn");
const musicFile = $("musicFile");
const selectedFile = $("selectedFile");
const back10Btn = $("back10Btn");
const forward10Btn = $("forward10Btn");
const refreshSongsBtn = $("refreshSongsBtn");

let songs = [];
let currentSongIndex = -1;
let localObjectURL = null;


/* =====================================================
   10 BACKUP SONGS
===================================================== */

const fallbackSongs = Array.from(
    { length: 10 },
    (_, i) => ({
        id: `backup-${i + 1}`,
        title: `HoodaBeats Song ${i + 1}`,
        artist: "HoodaBeats",
        album: "Local Backup",
        music_url: `MUSIC/backup${i + 1}.mp3`
    })
);


/* =====================================================
   HELPERS
===================================================== */

function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
        return "0:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remaining = Math.floor(seconds % 60);

    return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function setPlayButton(playing) {
    if (playBtn) {
        playBtn.textContent = playing ? "⏸" : "▶";
    }
}

function setVolume() {
    if (audio) {
        audio.volume = volume ? Number(volume.value) : 1;
        audio.muted = false;
    }
}


/* =====================================================
   LOAD BACKUP + ONLINE SONGS
===================================================== */

async function loadSongs() {
    if (!songList) return;

    songList.innerHTML = `
        <p class="loading-message">Loading songs...</p>
    `;

    try {
        const response = await fetch(`${API_URL}/songs`, {
            signal: AbortSignal.timeout(8000)
        });

        if (!response.ok) {
            throw new Error("Backend error");
        }

        const data = await response.json();

        const onlineSongs = Array.isArray(data.songs)
            ? data.songs
            : Array.isArray(data)
                ? data
                : [];

        // Backup songs always appear first.
        songs = [
            ...fallbackSongs,
            ...onlineSongs
        ];

        renderSongs();

    } catch (error) {
        console.warn("Backend unavailable:", error);

        songs = [...fallbackSongs];

        renderSongs();

        const message = document.createElement("p");
        message.className = "loading-message";
        message.textContent = "⚠️ Offline mode: Backup songs";

        songList.prepend(message);
    }
}


/* =====================================================
   DISPLAY SONGS
===================================================== */

function renderSongs() {
    if (!songList) return;

    songList.innerHTML = "";

    songs.forEach((song, index) => {
        const item = document.createElement("div");
        item.className = "song-item";
        item.tabIndex = 0;

        const info = document.createElement("div");
        info.className = "song-item-info";

        const title = document.createElement("h3");
        title.textContent = song.title || "Unknown Song";

        const artist = document.createElement("p");
        artist.textContent = song.artist || "Unknown Artist";

        const album = document.createElement("small");
        album.textContent = song.album || "Single";

        info.append(title, artist, album);

        const button = document.createElement("button");
        button.className = "song-play-btn";
        button.textContent = "▶";
        button.type = "button";

        item.append(info, button);

        const playSelected = () => loadSong(index);

        item.addEventListener("click", playSelected);

        item.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                playSelected();
            }
        });

        songList.appendChild(item);
    });
}


/* =====================================================
   LOAD SONG
===================================================== */

function loadSong(index) {
    if (!audio || !songs[index]) return;

    const song = songs[index];

    if (!song.music_url) {
        alert("Song URL not found.");
        return;
    }

    currentSongIndex = index;

    if (localObjectURL) {
        URL.revokeObjectURL(localObjectURL);
        localObjectURL = null;
    }

    if (songTitle) {
        songTitle.textContent = song.title || "Unknown Song";
    }

    if (songArtist) {
        songArtist.textContent = song.artist || "Unknown Artist";
    }

    audio.pause();
    audio.src = song.music_url;
    audio.muted = false;

    setVolume();
    audio.load();

    audio.play()
        .then(() => setPlayButton(true))
        .catch((error) => {
            console.error("Playback error:", error);
            setPlayButton(false);
            alert("Song play nahi ho raha. File path check karo.");
        });
}


/* =====================================================
   PLAY / PAUSE
===================================================== */

playBtn?.addEventListener("click", () => {
    if (!audio) return;

    if (!audio.src) {
        if (songs.length) {
            loadSong(0);
        } else {
            alert("No songs available.");
        }
        return;
    }

    if (audio.paused) {
        setVolume();

        audio.play()
            .then(() => setPlayButton(true))
            .catch(console.error);
    } else {
        audio.pause();
        setPlayButton(false);
    }
});


/* =====================================================
   PREVIOUS / NEXT
===================================================== */

prevBtn?.addEventListener("click", () => {
    if (!songs.length) return;

    const index = currentSongIndex <= 0
        ? songs.length - 1
        : currentSongIndex - 1;

    loadSong(index);
});

nextBtn?.addEventListener("click", () => {
    if (!songs.length) return;

    const index = currentSongIndex >= songs.length - 1
        ? 0
        : currentSongIndex + 1;

    loadSong(index);
});


/* =====================================================
   AUDIO EVENTS
===================================================== */

audio?.addEventListener("play", () => {
    setPlayButton(true);
});

audio?.addEventListener("pause", () => {
    setPlayButton(false);
});

audio?.addEventListener("ended", () => {
    if (!songs.length) return;

    const index = currentSongIndex >= songs.length - 1
        ? 0
        : currentSongIndex + 1;

    loadSong(index);
});

audio?.addEventListener("loadedmetadata", () => {
    if (duration) {
        duration.textContent = formatTime(audio.duration);
    }

    if (progress) {
        progress.value = 0;
    }
});

audio?.addEventListener("timeupdate", () => {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
        return;
    }

    if (progress) {
        progress.value =
            (audio.currentTime / audio.duration) * 100;
    }

    if (currentTime) {
        currentTime.textContent = formatTime(audio.currentTime);
    }

    if (duration) {
        duration.textContent = formatTime(audio.duration);
    }
});


/* =====================================================
   PROGRESS BAR
===================================================== */

progress?.addEventListener("input", () => {
    if (
        audio &&
        Number.isFinite(audio.duration) &&
        audio.duration > 0
    ) {
        audio.currentTime =
            (Number(progress.value) / 100) * audio.duration;
    }
});


/* =====================================================
   VOLUME
===================================================== */

if (volume) {
    volume.min = "0";
    volume.max = "1";
    volume.step = "0.01";
    volume.value = volume.value || "1";

    setVolume();
    volume.addEventListener("input", setVolume);
}


/* =====================================================
   SEEK BUTTONS
===================================================== */

back10Btn?.addEventListener("click", () => {
    if (audio) {
        audio.currentTime = Math.max(0, audio.currentTime - 10);
    }
});

forward10Btn?.addEventListener("click", () => {
    if (audio && Number.isFinite(audio.duration)) {
        audio.currentTime = Math.min(
            audio.duration,
            audio.currentTime + 10
        );
    }
});


/* =====================================================
   LOCAL PHONE MUSIC
===================================================== */

musicFile?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("audio/")) {
        alert("Please select an audio file.");
        return;
    }

    if (localObjectURL) {
        URL.revokeObjectURL(localObjectURL);
    }

    localObjectURL = URL.createObjectURL(file);

    audio.pause();
    audio.src = localObjectURL;
    audio.muted = false;

    setVolume();
    audio.load();

    if (songTitle) {
        songTitle.textContent =
            file.name.replace(/\.[^/.]+$/, "");
    }

    if (songArtist) {
        songArtist.textContent = "Local Device";
    }

    if (selectedFile) {
        selectedFile.textContent = file.name;
    }

    currentSongIndex = -1;

    audio.play()
        .then(() => setPlayButton(true))
        .catch(console.error);
});


/* =====================================================
   DOWNLOAD
===================================================== */

downloadBtn?.addEventListener("click", () => {
    if (!audio?.src) {
        alert("Please select a song first.");
        return;
    }

    const link = document.createElement("a");

    link.href = audio.src;
    link.download =
        `${songTitle?.textContent || "hoodabeats-song"}.mp3`;

    document.body.appendChild(link);
    link.click();
    link.remove();
});


/* =====================================================
   REFRESH
===================================================== */

refreshSongsBtn?.addEventListener("click", loadSongs);


/* =====================================================
   SEARCH
===================================================== */

const searchBtn = $("searchBtn");
const searchPanel = $("searchPanel");
const searchInput = $("searchInput");
const closeSearchBtn = $("closeSearchBtn");

searchBtn?.addEventListener("click", () => {
    searchPanel?.classList.toggle("active");
    searchInput?.focus();
});

closeSearchBtn?.addEventListener("click", () => {
    searchPanel?.classList.remove("active");
});

searchInput?.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();

    const filteredSongs = songs.filter((song) =>
        `${song.title || ""} ${song.artist || ""} ${song.album || ""}`
            .toLowerCase()
            .includes(query)
    );

    const originalSongs = songs;

    songs = query ? filteredSongs : originalSongs;
    renderSongs();

    songs = originalSongs;
});


/* =====================================================
   INITIALIZE
===================================================== */

loadSongs();