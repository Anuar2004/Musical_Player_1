<template>
  <div class="music-container">
    <div class="left-block">
      <div class="search-container">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Searching tracks..." 
          class="search-input"
          @input="handleSearch"
        />
        <div class="search-filters">
          <label>
            <input type="checkbox" v-model="searchInTitles" checked /> Titles
          </label>
          <label>
            <input type="checkbox" v-model="searchInArtists" checked /> Artists
          </label>
          <label>
            <input type="checkbox" v-model="searchInAlbums" checked /> Albums
          </label>
        </div>
      </div>

      <Playlist
        v-if="filteredTracks.length > 0"
        :tracks="filteredTracks"
        :currentTrackIndex="currentTrackIndexInFiltered"
        @track-selected="handleTrackSelectedFromFiltered"
      />
      <div v-else class="empty-playlist">
        {{ searchQuery ? 'No results found' : 'No tracks available. Upload or sync tracks.' }}
      </div>
    </div>

    <div class="center-block">
      <audio ref="audioElement" :src="currentTrack?.url" @timeupdate="updateProgress" @ended="nextTrack"></audio>
      
      <div class="album-art">
        <img :src="albumCover" alt="Album cover" />
      </div>

      <div class="track-info" v-if="currentTrack">
        <span class="track-title">{{ currentTrack.title }}</span>
        <div class="track-meta">
          <span class="track-artist">{{ currentTrack.artist || 'Unknown artist' }}</span>
          <span class="track-album">{{ currentTrack.album || 'Unknown album' }}</span>
        </div>
      </div>

      <div class="controls">
        <ThreeDButton
          modelPath="./models/NextPrevious.glb"
          :onClick="previousTrack"
          :rotationZ="180"
          :rotationX="180"
        />
        <ThreeDButton
          modelPath="./models/Play.glb"
          :reverseAnimation="!isPlaying" 
          @click="playPause"
        />
          <ThreeDButton
          modelPath="./models/NextPrevious.glb"
          :onClick="nextTrack"
        />
      </div>

      <div class="progress-bar" v-if="tracks.length > 0">
        <span>{{ formatTime(currentTime) }}</span>
        <input
          type="range"
          min="0"
          :max="duration"
          step="1"
          v-model="currentTime"
          @input="seekTrack"
        />
        <span>{{ formatTime(duration) }}</span>
      </div>

      <div class="volume-controls">
        <button @click="toggleMute">{{ isMuted ? 'Unmute' : 'Mute' }}</button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          v-model="volume"
          @input="setVolume"
        />
      </div>

      <div class="section">
        <h3>Song lyrics</h3>
        <p v-if="currentTrack && currentTrack.lyrics">{{ currentTrack.lyrics }}</p>
        <p v-else>Lyrics not available.</p>
      </div>
    </div>

    <div class="right-block">
      <div class="section">
        <h3>Authentication</h3>
        <div v-if="!authUser">
          <div class="auth-tabs">
            <button 
              @click="authMode = 'login'" 
              :class="{ active: authMode === 'login' }"
            >
              Login
            </button>
            <button 
              @click="authMode = 'signup'" 
              :class="{ active: authMode === 'signup' }"
            >
              Sign Up
            </button>
          </div>

          <form @submit.prevent="handleAuth" class="auth-form">
            <div class="form-group">
              <input
                type="email"
                v-model="authEmail"
                placeholder="Email"
                required
                class="auth-input"
              />
            </div>
            
            <div class="form-group">
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="authPassword"
                placeholder="Password"
                class="auth-input with-toggle"
                required
              />
              <button
                type="button"
                class="password-toggle"
                @click="showPassword = !showPassword"
                @mousedown.prevent  
              >
                <svg 
                  class="eye-icon" 
                  :class="{ 'visible': showPassword }" 
                  viewBox="0 0 24 24"
                >
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
              </button>
            </div>
            
            <div class="form-group" v-if="authMode === 'signup'">
              <input
                :type="showRepeatPassword ? 'text' : 'password'"
                v-model="authRepeatPassword"
                placeholder="Repeat Password"
                required
                class="auth-input"
                :class="{ 'input-error': showPasswordMismatch }"
              />
              <button 
                type="button" 
                class="password-toggle"
                @click="showRepeatPassword = !showRepeatPassword"
                @mousedown.prevent
              >
                <svg class="eye-icon" :class="{ 'visible': showRepeatPassword }" viewBox="0 0 24 24">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
              </button>
              <p v-if="showPasswordMismatch" class="error-message">
                Passwords do not match
              </p>
            </div>

            <button 
              type="submit" 
              class="auth-submit"
              :disabled="authLoading || (authMode === 'signup' && showPasswordMismatch)"
            >
              {{ authMode === 'login' ? 'Login' : 'Sign Up' }}
            </button>
          </form>
        </div>
        <div v-else class="auth-user">
          <p>Logged in as {{ authUser.email }}</p>
          <button @click="handleLogout" class="auth-submit">Logout</button>
        </div>
      </div>

      <div v-if="authUser">
          <div class="uploaded-tracks-panel" v-if="showUploadedTracks && uploadedTracks.length > 0">
            <div class="uploaded-tracks-header">
              <h4>Uploaded tracks</h4>
              <button @click="showUploadedTracks = false">×</button>
            </div>
            
            <ul class="uploaded-tracks-list">
              <li v-for="(track, index) in uploadedTracks" :key="track.path">
                <span>{{ track.name }} ({{ formatFileSize(track.size) }})</span>
                <button @click="deleteUploadedTrack(index)">Delete</button>
              </li>
            </ul>

            <button 
              @click="syncTracksFromBucket" 
              :disabled="isSyncing"
            >
              {{ isSyncing ? 'Syncing...' : 'Sync' }}
            </button>
          </div>
          <button class="folder" @click="showUploadForm = !showUploadForm">
            {{ showUploadForm ? 'Cancel' : 'Upload track' }}
          </button>

          <div v-if="showUploadForm" class="upload-form">
            <div class="file-input-container">
              <label class="file-label">
                <input 
                  type="file" 
                  @change="handleFileUpload" 
                  accept="audio/*" 
                  ref="fileInput"
                  class="file-input-hidden"
                  multiple
                />
                <span class="file-custom">
                  {{ selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : 'Select audio files' }}
                </span>
              </label>
            </div>

            <ul class="selected-files-list" v-if="selectedFiles.length > 0">
              <li v-for="(file, index) in selectedFiles" :key="index">
                {{ file.name }} ({{ formatFileSize(file.size) }})
              </li>
            </ul>

            <div class="upload-progress" v-if="uploadProgress > 0">
              Uploading: {{ uploadProgress }}%
              <progress :value="uploadProgress" max="100"></progress>
            </div>

            <button 
              @click="uploadTrack" 
              :disabled="selectedFiles.length === 0 || isUploading"
              class="upload-button"
            >
              {{ isUploading ? 'Uploading...' : 'Upload track' }}
            </button>
          </div>
      </div>
      

      <div class="section">
        <button @click="toggleTheme">Toggle theme</button>
      </div>
    </div>
  </div>
</template>

<script>
import Playlist from './Playlist.vue'
import defaultCover from '@/assets/default-cover.jpg'
import ThreeDButton from './ThreeDButton.vue'
import { supabase } from '../supabase.js'
import { parseBlob } from 'music-metadata-browser'  
import { useAuth } from '@/composables/useAuth'

// Функция для очистки имени файла
const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9-_.]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/\.+/g, '.');
};

export default {
  components: {
    Playlist,
    ThreeDButton,
  },
  setup() {
    const {
      user: authUser,
      loading: authLoading,
      error: authError,
      login,
      signUp,
      logout
    } = useAuth()

    return {
      authUser,
      authLoading,
      authError,
      login,
      signUp,
      logout
    }
  },
  data() {
    return {
      tracks: [],
      currentTrackIndex: 0,
      isPlaying: false,
      isMuted: false,
      volume: 0.5,
      currentTime: 0,
      duration: 0,
      albumCover: defaultCover,
      isDarkTheme: true,
      showUploadForm: false,
      selectedFile: null,
      isSyncing: false,
      isUploading: false,
      uploadProgress: 0,
      searchQuery: '',
      searchInTitles: true,
      searchInArtists: true,
      searchInAlbums: true,
      selectedFiles: [],
      filteredTracks: [],
      originalTracks: [],
      uploadedTracks: [],
      showUploadedTracks: false,
      authMode: 'login',
      authEmail: '',
      authPassword: '',
      authRepeatPassword: '',
      showPassword: false,
      showRepeatPassword: false,
      authLoading: false,
      authError: null
    };
  },
  computed: {
    currentTrack() {
      return this.tracks[this.currentTrackIndex] || null;
    },
    currentTrackIndexInFiltered() {
      if (!this.currentTrack) return -1;
      return this.filteredTracks.findIndex(track => track.id === this.currentTrack.id);
    },
    showPasswordMismatch() {
      return (
        this.authMode === 'signup' && 
        this.authRepeatPassword && 
        this.authPassword !== this.authRepeatPassword
      )
    }
  },
  methods: {
    async handleAuth() {
      this.authError = null;
  
      if (this.authMode === 'signup' && this.showPasswordMismatch) {
        return;
      }

      try {
        if (this.authMode === 'login') {
          await this.login(this.authEmail, this.authPassword);
        } else {
          await this.signUp(this.authEmail, this.authPassword);
        }
        
        this.authEmail = '';
        this.authPassword = '';
        this.authRepeatPassword = '';
      } catch (error) {
        this.authError = error.message;
      }
    },

    async handleLogout() {
      try {
        await this.logout()
        this.currentTrackIndex = 0
        this.isPlaying = false
        this.currentTime = 0
        this.tracks = []
        this.filteredTracks = []
      } catch (err) {
        console.error('Logout failed:', err)
        this.authError = 'Logout error'
      }
    },

    async syncTracksFromBucket() {
      this.isSyncing = true;
      try {
        console.log('Starting synchronization...');

        if (this.uploadedTracks.length === 0) {
          alert('No tracks available for synchronization.');
          this.isSyncing = false;
          return;
        }

        for (const [index, track] of this.uploadedTracks.entries()) {
          try {
            console.log(`Processing track ${index + 1}/${this.uploadedTracks.length}: ${track.name}`);

            const fileName = track.path;

            const { data: { publicUrl: trackUrl } } = supabase
              .storage
              .from('tracks')
              .getPublicUrl(fileName);

            const { count } = await supabase
              .from('tracks')
              .select('*', { count: 'exact' })
              .eq('audio_url', trackUrl);

            if (count > 0) {
              console.log(`Track already exists: ${fileName}`);
              continue;
            }

            const { data: fileData, error: downloadError } = await supabase
              .storage
              .from('tracks')
              .download(fileName);

            if (downloadError) {
              console.error(`Loading error ${fileName}:`, downloadError);
              continue;
            }

            const fileBlob = new Blob([fileData]);

            let metadata = {};
            try {
              metadata = await this.extractMetadata(fileBlob);
              console.log('Metadata:', metadata);
            } catch (metaError) {
              console.error(`Error reading metadata for ${fileName}:`, metaError);
              metadata = {
                title: track.name.replace(/\.[^.]+$/, ""),
                artist: 'Unknown artist',
                album: 'Unknown album',
                duration: 0,
                format: fileName.split('.').pop()
              };
            }

            let duration = metadata.duration || 0;
            if (!duration && fileBlob instanceof Blob) {
              duration = await this.calculateAudioDuration(fileBlob);
            }

            const trackData = {
              title: metadata.title,
              artist: metadata.artist,
              album: metadata.album,
              audio_url: trackUrl,
              cover_url: null,
              duration: Math.floor(duration),
              format: metadata.format,
              bitrate: metadata.bitrate ? Math.round(metadata.bitrate) : null,
              lyrics: null,
              created_at: new Date().toISOString()
            };

            const { error: insertError } = await supabase
              .from('tracks')
              .insert([trackData]);

            if (insertError) {
              console.error('Track addition error:', insertError);
            } else {
              console.log(`Track successfully added: ${fileName}`);
            }

          } catch (fileError) {
            console.error(`File processing error ${track.name}:`, fileError);
          }
        }

        console.log(' ');
        alert(`Processed ${this.uploadedTracks.length} tracks`);

        this.uploadedTracks = [];
        this.showUploadedTracks = false;

        await this.loadTracksFromSupabase();

      } catch (error) {
        console.error('Synchronization error:', error);
        alert('Synchronization error: ' + error.message);
      } finally {
        this.isSyncing = false;
      }
    },

    async calculateAudioDuration(blob) {
      return new Promise((resolve) => {
        const audio = new Audio();
        audio.src = URL.createObjectURL(blob);
        audio.onloadedmetadata = () => {
          resolve(Math.floor(audio.duration));
          URL.revokeObjectURL(audio.src);
        };
        audio.onerror = () => {
          console.warn('Could not determine duration');
          resolve(0);
        };
      });
    },

    async extractMetadata(fileBlob) {
      try {
        const fullMetadata = await parseBlob(fileBlob, {
          duration: true,
          skipCovers: false,
          skipPostHeaders: true
        });

        const common = fullMetadata.common || {};
        const format = fullMetadata.format || {};

        const result = {
          title: common.title || 'Untitled track',
          artist: common.artist || 'Unknown artist',
          album: common.album || 'Unknown album',
          duration: format.duration || 0,
          bitrate: format.bitrate || null,
          format: format.container || 'mp3',
          picture: common.picture?.[0] || null
        };

        return result;

      } catch (error) {
        console.error('Metadata read error:', error);
        return {
          title: 'Untitled track',
          artist: 'Unknown artist',
          album: 'Unknown album',
          duration: 0,
          bitrate: null,
          format: 'mp3',
          picture: null
        };
      }
    },

    async loadTracksFromSupabase() {
      try {
        console.log('Loading tracks from database...');
        const { data: tracks, error } = await supabase
          .from('tracks')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Database error:', error);
          throw error;
        }

        if (tracks && tracks.length > 0) {
          console.log(`Loaded ${tracks.length} tracks`);
          this.originalTracks = tracks.map(track => ({
            id: track.id,
            title: track.title || 'Untitled track',
            url: track.audio_url,
            audio_url: track.audio_url,
            artist: track.artist || 'Unknown artist',
            album: track.album || 'Unknown album',
            bitrate: track.bitrate || null,
            format: track.format || null,
            lyrics: track.lyrics || null,
            cover_url: track.cover_url || null,
            duration: track.duration || 0,
          }));

          this.tracks = [...this.originalTracks]
          this.filteredTracks = [...this.originalTracks];
          this.currentTrackIndex = 0;
          this.loadAlbumCover();
        } else {
          console.warn('No tracks found');
          this.originalTracks = [];
          this.filteredTracks = [];
        }
      } catch (error) {
        console.error('Track loading error:', error);
        alert('Track loading error: ' + error.message);
      }
    },

    async deleteUploadedTrack(index) {
      const track = this.uploadedTracks[index];
      
      if (confirm(`Delete "${track.name}"?`)) {
        try {
          await supabase
            .storage
          .from('tracks')
          .remove([track.path]);
          
          this.uploadedTracks.splice(index, 1);
        } catch (error) {
          alert('Deletion error: ' + error.message);
        }
      }
    },

    handleSearch() {
      if (!this.searchQuery) {
        this.filteredTracks = [...this.originalTracks];
        return;
      }

      const query = this.searchQuery.toLowerCase();
      this.filteredTracks = this.originalTracks.filter(track => {
        const matches = [];
        
        if (this.searchInTitles) {
          matches.push(track.title.toLowerCase().includes(query));
        }
        if (this.searchInArtists) {
          matches.push(track.artist.toLowerCase().includes(query));
        }
        if (this.searchInAlbums) {
          matches.push(track.album.toLowerCase().includes(query));
        }
        
        return matches.some(match => match);
      });
    },

    handleTrackSelectedFromFiltered(index) {
      const filteredTrack = this.filteredTracks[index];
      const originalIndex = this.originalTracks.findIndex(t => t.id === filteredTrack.id);

      if (originalIndex === -1) return;

      if (this.currentTrackIndex === originalIndex) {
        const audio = this.$refs.audioElement;
        if (this.isPlaying) {
          audio.pause();
        } else {
          audio.play();
        }
        this.isPlaying = !this.isPlaying;
      } else {
        this.currentTrackIndex = originalIndex;
        this.playTrack();
        this.isPlaying = true;
      }
    },

    handleFileUpload(event) {
      const files = Array.from(event.target.files);
      if (files.length > 0) {
        this.selectedFiles = files;
        this.uploadProgress = 0;
        this.$nextTick(() => {
          const form = this.$el.querySelector('.upload-form');
          form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
      }
    },

    async uploadTrack() {
      if (this.selectedFiles.length === 0) {
        alert('Please select at least one file');
        return;
      }

      this.isUploading = true;
      this.uploadProgress = 0;
      const uploadedFiles = [];
      const failedFiles = [];

      try {
        for (let i = 0; i < this.selectedFiles.length; i++) {
          const file = this.selectedFiles[i];
          
          try {
            const sanitizedFilename = sanitizeFilename(file.name);
            const filePath = `${Date.now()}_${i}_${sanitizedFilename}`;
            
            const { error: uploadError } = await supabase
              .storage
              .from('tracks')
              .upload(filePath, file, {
                onUploadProgress: (progress) => {
                  const currentFileProgress = progress.loaded / progress.total;
                  const overallProgress = 
                    (i + currentFileProgress) / this.selectedFiles.length * 100;
                  this.uploadProgress = Math.round(overallProgress);
                }
              });

            if (uploadError) {
              throw uploadError;
            }

            const { data: { publicUrl } } = supabase
              .storage
              .from('tracks')
              .getPublicUrl(filePath);

            uploadedFiles.push({
              name: file.name,
              path: filePath,
              url: publicUrl,
              size: file.size,
              uploadedAt: new Date()
            });

            this.uploadedTracks = [...uploadedFiles];
            
          } catch (error) {
            console.error(`"File upload error ${file.name}:`, error);
            failedFiles.push({
              name: file.name,
              error: error.message
            });
            continue
          }
        }

        this.showUploadedTracks = true;
        
        let resultMessage = `Successfully uploaded ${uploadedFiles.length} from ${this.selectedFiles.length}  files.`;
        if (failedFiles.length > 0) {
          resultMessage += ` Failed to upload ${failedFiles.length} files.`;
        }
        if (uploadedFiles.length > 0) {
          resultMessage += "Sync tracks to add them to your library.";
        }
        
        alert(resultMessage);

        if (failedFiles.length > 0) {
          console.log("Failed to upload:", failedFiles);
        }

      } catch (error) {
        console.error('General upload error:', error);
        alert('General upload error:' + error.message);
      } finally {
        this.isUploading = false;
        this.selectedFiles = [];
        this.uploadProgress = 0;
        
        this.$nextTick(() => {
          if (this.$el.querySelector('.uploaded-tracks-panel')) {
            this.$el.querySelector('.uploaded-tracks-panel').scrollIntoView({
              behavior: 'smooth'
            });
          }
        });
      }
    },  

    playPause() {
      const audio = this.$refs.audioElement;
      if (!this.currentTrack) return;

      if (this.isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      this.isPlaying = !this.isPlaying;
    },

    nextTrack() {
      if (this.tracks.length === 0) return;
      this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
      this.playTrack();
    },

    previousTrack() {
      if (this.tracks.length === 0) return;
      this.currentTrackIndex =
        (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
      this.playTrack();
    },

    playTrack() {
      const audio = this.$refs.audioElement;
      if (!this.currentTrack) return;

      audio.oncanplay = () => {
        audio.play();
        this.isPlaying = true;
      };
      this.loadAlbumCover();
    },

    setVolume() {
      const audio = this.$refs.audioElement;
      audio.volume = this.volume;
      if (this.isMuted && this.volume > 0) {
        this.isMuted = false;
      }
    },

    toggleMute() {
      const audio = this.$refs.audioElement;
      this.isMuted = !this.isMuted;
      audio.muted = this.isMuted;
    },

    updateProgress() {
      const audio = this.$refs.audioElement;
      this.currentTime = audio.currentTime;
      this.duration = audio.duration || this.currentTrack?.duration || 0;
    },

    seekTrack() {
      const audio = this.$refs.audioElement;
      audio.currentTime = this.currentTime;
    },

    formatTime(seconds) {
      if (!seconds || isNaN(seconds)) return '0:00';
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    },

    handleTrackSelected(index) {
      if (index === this.currentTrackIndex && this.isPlaying) {
        this.playPause();
      } else {
        this.currentTrackIndex = index;
        this.playTrack();
      }
    },

    loadAlbumCover() {
      if (!this.currentTrack) {
        this.albumCover = defaultCover;
        return;
      }

      console.log('cover_url of current track:', this.currentTrack.cover_url);

      if (this.currentTrack.cover_url) {
        const img = new Image();
        img.onload = () => this.albumCover = this.currentTrack.cover_url;
        img.onerror = () => this.tryFallbackCover();
        img.src = this.currentTrack.cover_url;
      } else {
        this.tryFallbackCover();
      }
    },

    tryFallbackCover() {
      if (this.currentTrack?.metadata?.picture?.base64) {
        this.albumCover = this.currentTrack.metadata.picture.base64;
      } else {
        this.albumCover = defaultCover;
      }
    },

    toggleTheme() {
      const root = document.documentElement;
      const newTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      this.isDarkTheme = newTheme === 'dark';
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    shareTrack() {
      if (this.currentTrack) {
        const shareData = {
          title: this.currentTrack.title,
          text: `Listening to "${this.currentTrack.title}" by ${this.currentTrack.artist || 'Unknown artist'}`,
          url: window.location.href,
        };
        if (navigator.share) {
          navigator.share(shareData).catch(console.error);
        } else {
          alert('Your browser doesn\'t support the "Share" feature');
        }
      } else {
        alert('No track selected');
      }
    },
  },
  mounted() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.isDarkTheme = savedTheme === 'dark';
    
    this.loadTracksFromSupabase();
  },
};
</script>

<style scoped>
.music-container {
  box-sizing: border-box;
  display: flex;  
  width: 100vw;
  height: 100vh;
  background-color: var(--background-color);
  color: var(--text-color);
  font-family: 'Inter', sans-serif;
  overflow: hidden;
  box-sizing: border-box;
}

.left-block, .center-block, .right-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: calc(100% - 40px);
  align-items: center;
  padding: 20px;
  border-radius: 15px;
  background-color: var(--block-background);
  border-right: 1px solid var(--border-color);
  margin: 10px;
  overflow-x: hidden;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .music-container {
    flex-direction: column;
  }

  .left-block, .center-block, .right-block {
    width: calc(100% - 20px);
    border-right: none;
    border-bottom: 1px solid var(--border-color);
    flex: none;
    height: auto;
    margin: 10px;
  }

  .left-block, .right-block {
    width: calc(100% - 20px);
    padding-left: 15px;
    padding-right: 15px;
  }
}

.search-container {
  width: 100%;
  padding: 0;
  margin: 0 0 20px 0;
  background: var(--block-background);
  border-radius: 10px;
}

.search-input {
  width: 100%;
  padding: 10px 15px;
  margin: 0;
  border: 1px solid var(--border-color);
  border-radius: 25px;
  background: var(--input-background);
  color: var(--text-color);
  font-size: 16px;
  margin-bottom: 10px;
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: var(--button-background);
}

.search-filters {
  display: flex;
  gap: 15px;
  font-size: 14px;
  color: var(--text-secondary-color);
  flex-wrap: wrap;
}

.search-filters label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

.search-filters input[type="checkbox"] {
  accent-color: var(--button-background);
  cursor: pointer;
}

.section {
  width: 100%;
  align-items: center;
  text-align: center;
  padding: 20px;
  background: var(--block-background);
  border-radius: 15px;
  margin: 10px;
}

.section h3 {
  font-size: 30px;
  margin-bottom: 10px;
  color: var(--button-background);
}

.upload-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 15px;
  margin: 0 0 15px 0;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  width: 100%;
}

.file-input-container {
  position: relative;
  width: 100%;
}

.file-label {
  display: block;
  width: 100%;
  cursor: pointer;
}

.file-custom {
  display: block;
  padding: 12px 15px;
  border: 1px solid var(--border-color);
  border-radius: 25px;
  background: var(--input-background);
  color: var(--text-color);
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  transition: all 0.3s ease;
  text-align: center;
}

.file-custom:hover {
  border-color: var(--button-background);
}

.file-input-hidden {
  position: absolute;
  width: 0.1px;
  height: 0.1px;
  opacity: 0;
  overflow: hidden;
  z-index: -1;
}

.file-input {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 25px;
  background: var(--input-background);
  color: var(--text-color);
  font-size: 16px;
  box-sizing: border-box;
  cursor: pointer;
}

.upload-form input[type="file"] {
  padding: 8px;
  border-radius: 5px;
  border: 1px solid var(--border-color);
  background: var(--block-background);
  color: var(--text-color);
  width: 100%;
}

.upload-progress {
  width: 100%;
  font-size: 14px;
  color: var(--text-secondary-color);
}

.upload-progress progress {
  width: 100%;
  height: 6px;
  margin-top: 5px;
  border-radius: 3px;
  background: var(--progress-bar-background);
}

.upload-progress progress::-webkit-progress-bar {
  background: var(--progress-bar-background);
  border-radius: 3px;
}

.upload-progress progress::-webkit-progress-value {
  background: var(--button-background);
  border-radius: 3px;
}

.empty-playlist {
  color: var(--text-secondary-color);
  font-style: italic;
  padding: 20px;
  text-align: center;
}

.album-art img {
  width: 200px;
  height: 200px;
  border-radius: 15px;
  object-fit: cover;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.track-info {
  margin-top: 20px;
  text-align: center;
}

.track-title {
  font-size: 24px;
  font-weight: bold;
}

.track-meta {
  margin-top: 10px;
  font-size: 16px;
  color: var(--text-secondary-color);
}

.track-artist, .track-album {
  display: block;
  margin-top: 5px;
}

.controls {
  margin-top: 20px;
  display: flex;
  gap: 50px;
  align-items: center;
}

.backforth {
  width: 150px;
}

button {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  background: var(--button-background);
  color: white;
  border: none;
  border-radius: 25px;
  transition: background 0.3s ease;
  margin: 5px;
}

button:hover {
  background: var(--button-hover);
}

button:disabled {
  background: var(--button-disabled);
  cursor: not-allowed;
}

.folder {
  width: 100%;
}

.progress-bar {
  width: 90%;
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

input[type='range'] {
  flex: 1;
  height: 5px;
  background: var(--progress-bar-background);
  border-radius: 5px;
  outline: none;
  opacity: 0.7;
  transition: opacity 0.2s;
}

input[type='range']:hover {
  opacity: 1;
}

input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 15px;
  height: 15px;
  background: var(--button-background);
  border-radius: 50%;
  cursor: pointer;
}

.volume-controls {
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.volume-btn {
  background: none;
  border: none;
  color: var(--text-color);
  font-size: 20px;
  cursor: pointer;
  transition: color 0.3s ease;
}

.volume-btn:hover {
  color: var(--button-background);
}

.volume-slider {
  width: 100px;
  height: 5px;
  background: var(--progress-bar-background);
  border-radius: 5px;
  outline: none;
  opacity: 0.7;
  transition: opacity 0.2s;
} 

.volume-slider:hover {
  opacity: 1;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 15px;
  height: 15px;
  background: var(--button-background);
  border-radius: 50%;
  cursor: pointer;
}

.uploaded-tracks-panel {
  width: 100%;
  background: var(--block-background);
  border-radius: 10px;
  padding: 15px;
  margin: 10px 0;
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.uploaded-tracks-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.uploaded-tracks-header h4 {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary-color);
}

.uploaded-tracks-header button {
  background: none;
  border: none;
  color: var(--text-secondary-color);
  font-size: 16px;
  cursor: pointer;
  padding: 0;
}

.uploaded-tracks-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 150px;
  overflow-y: auto;
  flex-grow: 1;
}

.uploaded-tracks-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 13px;
  border-bottom: 1px solid var(--border-color);
}

.uploaded-tracks-list li:last-child {
  border-bottom: none;
}

.uploaded-tracks-list button {
  background: #ff4444;
  color: white;
  border: none;
  padding: 3px 6px;
  border-radius: 3px;
  font-size: 12px;
  cursor: pointer;
}

.selected-files-list {
  list-style: none;
  padding: 8px;
  margin: 10px 0;
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.03);
}

.selected-files-list li {
  padding: 6px 8px;
  font-size: 13px;
  border-bottom: 1px solid var(--border-color);
}

.selected-files-list li:last-child {
  border-bottom: none;
}

.auth-tabs {
  display: flex;
  margin-bottom: 20px;
  border-radius: 25px;
  overflow: hidden;
  background: var(--input-background);
  border: 1px solid var(--border-color);
}

.auth-tabs button {
  flex: 1;
  padding: 10px;
  background: transparent;
  border: none;
  color: var(--text-secondary-color);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.auth-tabs button.active {
  background: var(--button-background);
  color: white;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 10px;
  position: relative;
}

.auth-input {
  width: 50%;
  flex: 1;
  padding: 12px 15px;
  border: 1px solid var(--border-color);
  border-radius: 25px;
  background: var(--input-background);
  color: var(--text-color);
  font-size: 14px;
  transition: border-color 0.3s ease;
  height: 44px;
  box-sizing: border-box;
}

.auth-input:focus {
  outline: none;
  height: 40px;
  line-height: 40px;
  border-color: var(--button-background);
}

.input-error {
  border-color: #ff4444;
}

.auth-submit {
  padding: 12px;
  width: 100%;
  background: var(--button-background);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.auth-form input[type="password"] {
  margin-bottom: 10px;
}

.auth-error {
  color: #ff4444;
  font-size: 14px;
  margin-top: 5px;
  margin-bottom: 10px;
}

.auth-submit:hover {
  background: var(--button-hover);
}

.auth-submit:disabled {
  background: var(--button-disabled);
  cursor: not-allowed;
}

.error-message {
  margin-top: 5px;
  font-size: 13px;
  color: #ff4444;
  text-align: center;
}

.auth-user {
  text-align: center;
}

.auth-user p {
  margin-bottom: 15px;
  color: var(--text-color);
}

button[disabled] {
  opacity: 0.7;
  cursor: not-allowed;
}

.password-match {
  border: 1px solid #4CAF50 !important;
}

.password-mismatch {
  border: 1px solid #ff4444 !important;
}

.password-toggle {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.password-toggle svg {
  width: 24px;
  height: 24px;
}

.password-toggle:hover .eye-icon {
  fill: #999;
}

.password-toggle:active {
  transform: translateZ(0);
}

.password-toggle .eye-icon {
  width: 20px;
  height: 20px;
  fill: #666;
  pointer-events: none;
}

.eye-icon.visible {
  opacity: 0.5;
}

.auth-input.with-toggle {
  padding-right: 40px;
}
</style>