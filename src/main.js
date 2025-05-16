import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { Buffer } from 'buffer'

window.Buffer = Buffer

const app = createApp(App)
app.mount('#app')