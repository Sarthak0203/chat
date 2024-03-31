import { io } from "socket.io-client";
import { useRef, useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../UserContextProvider";
import { FiVideo, FiVideoOff, FiMic, FiMicOff } from "react-icons/fi";
import "./style.css";
import Navbar from "../../Components/Navbar/Navbar";


const configuration = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

let pc;
let localStream;
let startButton;
let hangupButton;
let muteAudButton;
let remoteVideo;
let localVideo;

const VideoCall = ({ setIsAuthenticated }) => {
  startButton = useRef(null);
  hangupButton = useRef(null);
  muteAudButton = useRef(null);
  localVideo = useRef(null);
  remoteVideo = useRef(null);
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const socket = useRef();
  let pcs = {}; // Store RTCPeerConnections for each room
let localStreams = {}; // Store local streams for each room

async function makeCall(roomId) {
  try {
    pcs[roomId] = new RTCPeerConnection(configuration);
    pcs[roomId].onicecandidate = (e) => {
      const message = {
        type: "candidate",
        candidate: null,
      };
      if (e.candidate) {
        message.candidate = e.candidate.candidate;
        message.sdpMid = e.candidate.sdpMid;
        message.sdpMLineIndex = e.candidate.sdpMLineIndex;
      }
      socket.current.emit("message", message);
    };
    pcs[roomId].ontrack = (e) => (remoteVideo.current.srcObject = e.streams[0]);
    localStreams[roomId]
      .getTracks()
      .forEach((track) => pcs[roomId].addTrack(track, localStreams[roomId]));
    const offer = await pcs[roomId].createOffer();
    socket.current.emit("message", { type: "offer", sdp: offer.sdp });
    await pcs[roomId].setLocalDescription(offer);
    setIsCallActive(true);
  } catch (e) {
    console.log(e);
  }
}


async function handleOffer(offer, roomId) {
  if (pcs[roomId]) {
    console.error("existing peerconnection");
    return;
  }
  try {
    pcs[roomId] = new RTCPeerConnection(configuration);
    pcs[roomId].onicecandidate = (e) => {
      const message = {
        type: "candidate",
        candidate: null,
      };
      if (e.candidate) {
        message.candidate = e.candidate.candidate;
        message.sdpMid = e.candidate.sdpMid;
        message.sdpMLineIndex = e.candidate.sdpMLineIndex;
      }
      socket.current.emit("message", message);
    };
    pcs[roomId].ontrack = (e) => (remoteVideo.current.srcObject = e.streams[0]);
    localStreams[roomId]
      .getTracks()
      .forEach((track) => pcs[roomId].addTrack(track, localStreams[roomId]));
    await pcs[roomId].setRemoteDescription(offer);

    const answer = await pcs[roomId].createAnswer();
    socket.current.emit("message", { type: "answer", sdp: answer.sdp });
    await pcs[roomId].setLocalDescription(answer);
  } catch (e) {
    console.log(e);
  }
}

  async function handleAnswer(answer) {
    if (!pc) {
      console.error("no peerconnection");
      return;
    }
    try {
      await pc.setRemoteDescription(answer);
    } catch (e) {
      console.log(e);
    }
  }

  async function handleCandidate(candidate) {
    try {
      if (!pc) {
        console.error("no peerconnection");
        return;
      }
      if (!candidate) {
        await pc.addIceCandidate(null);
      } else {
        await pc.addIceCandidate(candidate);
      }
    } catch (e) {
      console.log(e);
    }
  }

  async function hangup(roomId) {
    if (pcs[roomId]) {
      pcs[roomId].close();
      pcs[roomId] = null;
    }
    if (localStreams[roomId]) {
      localStreams[roomId].getTracks().forEach((track) => track.stop());
      localStreams[roomId] = null;
    }
    startButton.current.disabled = false;
    hangupButton.current.disabled = true;
    muteAudButton.current.disabled = true;
    setIsCallActive(false);
  }
  

  useEffect(() => {
    window.addEventListener("popstate", hangB);
    socket.current = io("http://localhost:7500", { transports: ["websocket"] });

    socket.current.on("message", (e) => {
      if (!localStream) {
        console.log("not ready yet");
        return;
      }
      switch (e.type) {
        case "offer":
          handleOffer(e);
          break;
        case "answer":
          handleAnswer(e);
          break;
        case "candidate":
          handleCandidate(e);
          break;
        case "ready":
          if (pc) {
            console.log("already in call, ignoring");
            return;
          }
          makeCall();
          break;
        case "hangup":
          // If a 'hangup' message is received, end the call
          if (pc) {
            hangup();
          }
          break;
        case "bye":
          if (pc) {
            hangup();
          }
          break;
        default:
          console.log("unhandled", e);
          break;
      }
    });

    hangupButton.current.disabled = true;
    muteAudButton.current.disabled = true;
    return () => {
      window.removeEventListener("popstate", hangB);
    };
  }, []);

  const [audiostate, setAudio] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);

  const startB = async (roomId) => {
    try {
      localStreams[roomId] = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: { echoCancellation: true },
      });
      localVideo.current.srcObject = localStreams[roomId];
    } catch (err) {
      console.log(err);
    }
  
    startButton.current.disabled = true;
    hangupButton.current.disabled = false;
    muteAudButton.current.disabled = false;
  
    socket.current.emit("message", { type: "ready" });
  };

  const hangB = async () => {
    hangup();
    socket.current.emit("message", { type: "hangup" });
  };

  function muteAudio() {
    if (audiostate) {
      localVideo.current.muted = true;
      setAudio(false);
    } else {
      localVideo.current.muted = false;
      setAudio(true);
    }
  }

  const handleLogout = () => {
    console.log("Logout emitted outside function");
    socket.current.emit("logout", { firstName: user.firstName }, (error) => {
      if (error) {
        console.error("Error logging out:", error);
      } else {
        console.log("Logout emitted from function");
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        navigate("/login");
        setUser(null);
      }
    });
  };
  const handleAccount = () => {
    navigate("/account");
  };

  return (
    <>
      <Navbar
        handleLogout={handleLogout}
        handleAccount={handleAccount}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      />
      <main className="container1">
        <div className="video-container">
          <div className="video-item-wrapper">
            <video
              ref={localVideo}
              className="video-item"
              autoPlay
              playsInline
              src=" "
            ></video>
            {/* <div className="video-label">Me</div> */}
          </div>
          <div className="video-item-wrapper">
            <video
              ref={remoteVideo}
              className="video-item"
              autoPlay
              playsInline
              src=" "
            ></video>
            {/* <div className="video-label">{user.firstName}</div> */}
          </div>
        </div>

        <div className="btn-container">
          <button
            className="btn-item btn-start"
            ref={startButton}
            onClick={startB}
          >
            <FiVideo size={25} />
          </button>
          <button
            className="btn-item btn-end"
            ref={hangupButton}
            onClick={hangB}
          >
            <FiVideoOff size={25} />
          </button>
          <button
            className="btn-item btn-start"
            ref={muteAudButton}
            onClick={muteAudio}
          >
            {audiostate ? <FiMic size={25} /> : <FiMicOff size={25} />}
          </button>
        </div>
      </main>
    </>
  );
};

export default VideoCall;
