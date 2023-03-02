<script setup>
import { ref, onMounted } from "vue";

import MicroPhoneIcon from "../../../assets/svg/microphone.svg";
import MuteMicroIcon from "../../../assets/svg/cancel-microphone.svg";
import CameraIcon from "../../../assets/svg/camera.svg";
import CameraOffIcon from "../../../assets/svg/cancel-camera.svg";

const video = ref(new MediaStream());

const microphones = ref([]);
const cameras = ref([]);
const selectedMicro = ref({ deviceId: undefined });
const selectedCamera = ref({ deviceId: undefined });

const devicesOptions = ref({ camera: true, audio: true });

onMounted(async () => {
  video.value = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });

  const devices = await navigator.mediaDevices.enumerateDevices();

  devices.forEach((item) => {
    if (item.kind === "audioinput") {
      microphones.value.push({ text: item.label, deviceId: item.deviceId });
    }

    if (item.kind === "videoinput") {
      cameras.value.push({ text: item.label, deviceId: item.deviceId });
    }
  });

  selectedCamera.value = cameras.value[0];
  selectedMicro.value = microphones.value[0];
});

async function refreshSources() {
  video.value = await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: selectedMicro.value.deviceId
        ? { exact: selectedMicro.value.deviceId }
        : undefined,
    },
    video: {
      deviceId: selectedCamera.value.deviceId
        ? { exact: selectedCamera.value.deviceId }
        : undefined,
    },
  });
}

function switchCamera() {
  devicesOptions.value.camera = !devicesOptions.value.camera;

  if (devicesOptions.value.camera) {
    video.value.getVideoTracks()[0].enabled = true;
    return;
  }

  video.value.getVideoTracks()[0].enabled = false;
  return;
}

function switchMicrophone() {
  devicesOptions.value.audio = !devicesOptions.value.audio;

  if (devicesOptions.value.audio) {
    video.value.getAudioTracks()[0].enabled = true;
    return;
  }

  video.value.getAudioTracks()[0].enabled = false;
  return;
}
</script>

<template>
  <div class="flex justify-center items-center">
    <div class="mt-20">
      <div class="relative w-[640px] h-[480px] flex justify-center">
        <video
          class="absolute w-full h-full object-cover"
          :srcObject="video"
          playsinline
          autoplay
        />
        <div class="absolute bottom-0 flex gap-x-12 mb-5">
          <button
            @click="switchMicrophone"
            class="btn btn-circle"
            :class="[devicesOptions.audio ? 'btn-accent' : 'btn-error ']"
          >
            <MicroPhoneIcon class="w-8" v-if="devicesOptions.audio" />
            <MuteMicroIcon class="w-8" v-else />
          </button>
          <button
            @click="switchCamera"
            class="btn btn-circle"
            :class="[devicesOptions.camera ? 'btn-accent' : 'btn-error ']"
          >
            <CameraIcon class="w-8" v-if="devicesOptions.camera" />
            <CameraOffIcon class="w-8" v-else />
          </button>
        </div>
      </div>

      <div class="mt-10 flex justify-between">
        <div>
          <h1 class="mb-3">Choose microphone</h1>
          <select
            v-model="selectedMicro"
            @change="refreshSources"
            class="select select-accent min-w-xs max-w-xs"
          >
            <option
              v-for="micro in microphones"
              :key="micro.deviceId"
              :value="micro"
            >
              {{ micro.text }}
            </option>
          </select>
        </div>

        <div>
          <h1 class="mb-3">Choose camera</h1>
          <select
            v-model="selectedCamera"
            @change="refreshSources"
            class="select select-accent min-w-xs max-w-xs"
          >
            <option
              v-for="camera in cameras"
              :key="camera.deviceId"
              :value="camera"
            >
              {{ camera.text }}
            </option>
          </select>
        </div>
      </div>
      <button
        @click="() => $router.push(`/room/${$route.params.id}`)"
        class="btn btn-secondary w-full mt-10"
      >
        Join to my ass
      </button>
    </div>
  </div>
</template>
