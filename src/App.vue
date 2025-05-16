<template>
  <div id="app">
    <MusicPlayer />
  </div>
</template>

<script>
import MusicPlayer from './components/MusicPlayer.vue'
import Playlist from './components/Playlist.vue'

export default {
  components: { MusicPlayer, Playlist }
}
</script>