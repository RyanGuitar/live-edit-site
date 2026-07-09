// js/webrtc.js
import { sync } from "./sync.js";

class WebRTCController {
  constructor() {
    this.peerConnection = null;
    this.config = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }], // Public STUN server to find your IP
    };
  }

  // Initialize Peer Connection
  createPeerConnection(isBroadcaster, onStreamReceived) {
    this.peerConnection = new RTCPeerConnection(this.config);

    // When a stream is received from the broadcaster
    this.peerConnection.ontrack = (event) => {
      if (onStreamReceived) onStreamReceived(event.streams[0]);
    };

    // When an ICE candidate is found, send it to the other peer via WebSocket
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sync.broadcastSignal({
          type: "candidate",
          candidate: event.candidate,
        });
      }
    };

    return this.peerConnection;
  }

  // Step 1: Broadcaster (You) creates the offer
  async startBroadcasting(stream) {
    this.createPeerConnection(true);
    stream
      .getTracks()
      .forEach((track) => this.peerConnection.addTrack(track, stream));

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    sync.broadcastSignal({ type: "offer", offer });
  }

  // Step 2: Viewer (Tourist) processes the offer and answers
  async handleOffer(offer, stream) {
    this.createPeerConnection(false);
    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(offer)
    );

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    sync.broadcastSignal({ type: "answer", answer });
  }
}

export const webrtc = new WebRTCController();
