<script setup>
import { onMounted, ref } from "vue";

import io from "socket.io-client";
import { useRoute } from "vue-router";

const socket = io();

const localStream = ref(new MediaStream());

const localPeerId = ref();

const peerConnections = ref({});

const remoteStreams = ref([]);

const router = useRoute();

const iceServers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const offerOptions = {
  offerToReceiveVideo: 1,
  offerToReceiveAudio: 1,
};

onMounted(async () => {
  localStream.value = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });

  socket.emit("join", { room: router.params.id, peerUUID: localPeerId.value });
});

socket.on("room_created", async (event) => {
  localPeerId.value = event.peerId;
});

socket.on("room_joined", async (event) => {
  localPeerId.value = event.peerId;

  socket.emit("start_call", {
    roomId: event.roomId,
    senderId: localPeerId.value,
  });
});

socket.on("start_call", async (event) => {
  const remotePeerId = event.senderId;

  peerConnections.value[remotePeerId] = new RTCPeerConnection(iceServers);
  addLocalTracks(peerConnections.value[remotePeerId]);
  peerConnections.value[remotePeerId].ontrack = (event) =>
    setRemoteStream(event, remotePeerId);
  peerConnections.value[remotePeerId].oniceconnectionstatechange = (event) =>
    checkPeerDisconnect(event, remotePeerId);
  peerConnections.value[remotePeerId].onicecandidate = (event) =>
    sendIceCandidate(event, remotePeerId);
  await createOffer(peerConnections.value[remotePeerId], remotePeerId);
});

/**
 * Mensaje webrtc_offer recibido con la oferta y envía la respuesta al otro par
 */
socket.on("webrtc_offer", async (event) => {
  const remotePeerId = event.senderId;

  peerConnections.value[remotePeerId] = new RTCPeerConnection(iceServers);
  peerConnections.value[remotePeerId].setRemoteDescription(
    new RTCSessionDescription(event.sdp)
  );

  addLocalTracks(peerConnections.value[remotePeerId]);

  peerConnections.value[remotePeerId].ontrack = (event) =>
    setRemoteStream(event, remotePeerId);
  peerConnections.value[remotePeerId].oniceconnectionstatechange = (event) =>
    checkPeerDisconnect(event, remotePeerId);
  peerConnections.value[remotePeerId].onicecandidate = (event) =>
    sendIceCandidate(event, remotePeerId);
  await createAnswer(peerConnections.value[remotePeerId], remotePeerId);
});

socket.on("webrtc_ice_candidate", (event) => {
  const senderPeerId = event.senderId;
  console.log(
    `Socket event callback: webrtc_ice_candidate. RECEIVED from ${senderPeerId}`
  );

  // ICE candidate configuration.
  var candidate = new RTCIceCandidate({
    sdpMLineIndex: event.label,
    candidate: event.candidate,
  });
  peerConnections.value[senderPeerId].addIceCandidate(candidate);
});

socket.on("webrtc_answer", async (event) => {
  peerConnections.value[event.senderId].setRemoteDescription(
    new RTCSessionDescription(event.sdp)
  );
});

function addLocalTracks(rtcPeerConnection) {
  localStream.value.getTracks().forEach((track) => {
    rtcPeerConnection.addTrack(track, localStream.value);
  });
}

function setRemoteStream(event, remotePeerId) {
  console.log(event.track.kind === "video");
  if (event.track.kind === "video") {
    remoteStreams.value.push({
      srcObject: event.streams[0],
      id: `remoteVideo_${remotePeerId}`,
    });
  }
}

function checkPeerDisconnect(event, remotePeerId) {
  const state = peerConnections.value[remotePeerId].iceConnectionState;

  if (["failed", "closed", "disconnected"].includes(state)) {
    const streamIndex = remoteStreams.value.findIndex(
      (item) => item.id === remotePeerId
    );

    remoteStreams.value.splice(streamIndex, 1);
  }
}

function sendIceCandidate(event, remotePeerId) {
  if (event.candidate) {
    socket.emit("webrtc_ice_candidate", {
      senderId: localPeerId.value,
      receiverId: remotePeerId,
      roomId: router.params.id,
      label: event.candidate.sdpMLineIndex,
      candidate: event.candidate.candidate,
    });
  }
}

async function createOffer(rtcPeerConnection, remotePeerId) {
  let sessionDescription;
  try {
    sessionDescription = await rtcPeerConnection.createOffer(offerOptions);
    rtcPeerConnection.setLocalDescription(sessionDescription);
  } catch (error) {
    console.error(error);
  }

  socket.emit("webrtc_offer", {
    type: "webrtc_offer",
    sdp: sessionDescription,
    roomId: router.params.id,
    senderId: localPeerId.value,
    receiverId: remotePeerId,
  });
}

async function createAnswer(rtcPeerConnection, remotePeerId) {
  let sessionDescription;
  try {
    sessionDescription = await rtcPeerConnection.createAnswer(offerOptions);
    rtcPeerConnection.setLocalDescription(sessionDescription);
  } catch (error) {
    console.error(error);
  }

  socket.emit("webrtc_answer", {
    type: "webrtc_answer",
    sdp: sessionDescription,
    roomId: router.params.id,
    senderId: localPeerId.value,
    receiverId: remotePeerId,
  });
}
</script>

<template>
  <div class="flex flex-col cards-container w-full">
    <video class="" :srcObject="localStream" playsinline autoplay />

    <div v-for="stream in remoteStreams" :key="stream.id">
      <video class="" :srcObject="stream.srcObject" playsinline autoplay />
    </div>
  </div>
</template>

<style scoped>
.cards-container {
  display: grid;
  gap: 2rem;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  height: 100vh;
}
</style>
