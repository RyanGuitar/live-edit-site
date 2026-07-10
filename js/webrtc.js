// js/webrtc.js
import { sync } from "./sync.js";

class WebRTCController {
  constructor() {
    // Broadcaster: stores multiple connections (one per tourist)
    this.peers = {};

    // Viewer: stores single connection to the broadcaster
    this.peerConnection = null;

    // Generate a unique ID for this device
    this.myId = Math.random().toString(36).substring(2, 15);

    this.localStream = null;
    this.isBroadcaster = false;

    this.config = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };
  }

  // Step 1: Broadcaster starts the stream and announces it
  async startBroadcasting(stream) {
    this.isBroadcaster = true;
    this.localStream = stream;

    // Announce to the network that the stream is live
    sync.broadcastSignal({ type: "stream-active", sender: this.myId });
  }

  // Step 2: Broadcaster stops the stream and cleans up
  stopBroadcasting() {
    this.isBroadcaster = false;
    this.localStream = null;

    // Close all viewer connections
    for (let viewerId in this.peers) {
      if (this.peers[viewerId]) {
        this.peers[viewerId].close();
      }
    }
    this.peers = {};
  }

  // Step 3: Broadcaster creates a dedicated connection for a specific viewer
  async createBroadcasterPeer(viewerId) {
    const pc = new RTCPeerConnection(this.config);
    this.peers[viewerId] = pc;

    // Add the live mic stream to this specific connection
    this.localStream
      .getTracks()
      .forEach((track) => pc.addTrack(track, this.localStream));

    // Send ICE routing candidates directly to this viewer
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sync.broadcastSignal({
          type: "candidate",
          candidate: event.candidate,
          target: viewerId,
          sender: this.myId,
        });
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Send the targeted offer
    sync.broadcastSignal({
      type: "offer",
      offer: offer,
      target: viewerId,
      sender: this.myId,
    });
  }

  // Step 4: Viewer processes the targeted offer
  async handleOffer(offer, broadcasterId, onStreamReceived) {
    this.peerConnection = new RTCPeerConnection(this.config);

    // Listen for the live audio stream
    this.peerConnection.ontrack = (event) => {
      if (onStreamReceived) onStreamReceived(event.streams[0]);
    };

    // Send ICE routing candidates back to the broadcaster
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sync.broadcastSignal({
          type: "candidate",
          candidate: event.candidate,
          target: broadcasterId,
          sender: this.myId,
        });
      }
    };

    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(offer)
    );
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    // Send targeted answer
    sync.broadcastSignal({
      type: "answer",
      answer: answer,
      target: broadcasterId,
      sender: this.myId,
    });
  }

  // Step 5: Broadcaster finalizes connection with a specific viewer
  async handleAnswer(answer, viewerId) {
    const pc = this.peers[viewerId];
    if (pc && pc.signalingState === "have-local-offer") {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  // Step 6: Route ICE candidates to the correct connection
  async handleCandidate(candidate, senderId) {
    const pc = this.isBroadcaster ? this.peers[senderId] : this.peerConnection;
    if (pc && pc.remoteDescription) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }
}

export const webrtc = new WebRTCController();
