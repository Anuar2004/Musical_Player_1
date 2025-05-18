<template>
  <div class="playlist-container">
    <ul>
      <li 
        v-for="(track, index) in tracks" 
        :key="index"
        @click="$emit('track-selected', index)"
        :class="{ active: index === currentTrackIndex }"
      >
        <div class="track-info">
          <span class="track-title">{{ truncateTitle(track.title) }}</span>
          <div class="track-meta">
            <span class="track-artist">{{ track.artist || 'Unknown artist' }}</span>
            <span class="track-album">{{ track.album || 'Unknown album' }}</span>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  props: {
    tracks: {
      type: Array,
      required: true,
    },
    currentTrackIndex: {
      type: Number,
      required: true,
    },
  },
  methods: {
    truncateTitle(title) {
      const maxWidth = 250;
      const font = "16px Arial";

      const cleanTitle = title.replace(/\.[^.]+$/, "");

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      ctx.font = font;

      let truncatedTitle = cleanTitle;
      while (ctx.measureText(truncatedTitle + "...").width > maxWidth) {
        truncatedTitle = truncatedTitle.slice(0, -1);
      }

      return truncatedTitle.length < cleanTitle.length ? truncatedTitle + "..." : cleanTitle;
    },
    formatTime(time) {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },
  },
};
</script>

<style scoped>
.playlist-container {
  width: 100%;
  flex-grow: 1;
  overflow-y: auto;
  max-height: calc(100vh - 150px);
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  padding: 15px;
  margin-bottom: 10px;
  cursor: pointer;
  border-radius: 10px;
  background: var(--background-color);
  transition: background-color 0.3s ease;
}

li:hover {
  background-color: var(--border-color);
}

li.active {
  background: var(--button-background);
  background-size: 400% 400%;
  animation: gradientFlow 20s ease-in-out infinite;
  color: white;
  border-radius: 10px;
  transition: background 1s ease;
}

@keyframes gradientFlow {
  0% {
    background-position: 0% 50%;
  }
  25% {
    background-position: 50% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  75% {
    background-position: 50% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.track-info {
  display: flex;
  flex-direction: column;
}

.track-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.track-meta {
  font-size: 14px;
}

.track-artist, .track-album {
  display: block;
  margin-top: 2px;
}

.track-artist {
  font-style: italic;
}

.track-album {
  font-weight: bold;
}
</style>