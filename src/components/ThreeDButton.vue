<template>
  <div ref="container" class="three-d-button" @click="handleClick"></div>
</template>

<script>
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { markRaw } from 'vue';

export default {
  props: {
    modelPath: { type: String, required: true },
    onClick: { type: Function, required: true },
    reverseAnimation: { type: Boolean, default: false },
    rotationZ: { type: Number, default: 0 }, // в градусах
  },
  data() {
    return {
      scene: null,
      camera: null,
      renderer: null,
      model: null,
      mixer: null,
      animation: null,
      clock: new THREE.Clock(),
    };
  },
  mounted() {
    this.initThree();
    this.loadModel();
  },
  watch: {
    reverseAnimation(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.playAnimation();
      }
    }
  },
  methods: {
    initThree() {
      this.scene = markRaw(new THREE.Scene());
      this.camera = markRaw(new THREE.PerspectiveCamera(
        75,
        this.$refs.container.clientWidth / this.$refs.container.clientHeight,
        0.1,
        1000
      ));
      this.camera.position.z = 5;

      this.renderer = markRaw(new THREE.WebGLRenderer({ antialias: true, alpha: true }));
      this.renderer.setSize(
        this.$refs.container.clientWidth,
        this.$refs.container.clientHeight
      );
      this.$refs.container.appendChild(this.renderer.domElement);

      const ambientLight = new THREE.AmbientLight(0xffffff, 1);
      this.scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(1, 1, 1).normalize();
      this.scene.add(directionalLight);
    },

    loadModel() {
      const loader = new GLTFLoader();
      loader.load(
        this.modelPath,
        (gltf) => {
          this.model = markRaw(gltf.scene);
          this.scene.add(this.model);
          this.model.scale.set(3.5, 3.5, 3.5);
          this.model.position.set(0, 0, 0);
          this.model.rotation.z = THREE.MathUtils.degToRad(this.rotationZ); // поворот по Z

          if (gltf.animations && gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.model);
            this.animation = gltf.animations[0];
          }

          this.animate();
        },
        undefined,
        (error) => {
          console.error('Ошибка загрузки модели:', error);
        }
      );
    },

    animate() {
      requestAnimationFrame(this.animate);
      const delta = this.clock.getDelta();
      if (this.mixer) this.mixer.update(delta);
      this.renderer.render(this.scene, this.camera);
    },

    playAnimation() {
      if (!this.mixer || !this.animation) return;

      this.mixer.stopAllAction();

      const action = this.mixer.clipAction(this.animation);
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
      action.reset();
      action.enabled = true;
      action.paused = false;

      if (this.reverseAnimation) {
        action.timeScale = -1;
        action.time = this.animation.duration;
      } else {
        action.timeScale = 1;
        action.time = 0;
      }

      action.play();
    },

    handleClick() {
      this.onClick();
      this.playAnimation();
    },
  },
};
</script>

<style scoped>
.three-d-button {
  width: 100px;
  height: 100px;
  position: relative;
  cursor: pointer;
}
</style>
