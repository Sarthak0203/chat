import { io } from "socket.io-client";
import { useRef, useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../UserContextProvider";
import { FiVideo, FiVideoOff, FiMic, FiMicOff } from "react-icons/fi";
import "./style.css";
import logo from "../../assets/logo.png";

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

  async function makeCall() {
    try {
      pc = new RTCPeerConnection(configuration);
      pc.onicecandidate = (e) => {
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
      pc.ontrack = (e) => (remoteVideo.current.srcObject = e.streams[0]);
      localStream
        .getTracks()
        .forEach((track) => pc.addTrack(track, localStream));
      const offer = await pc.createOffer();
      socket.current.emit("message", { type: "offer", sdp: offer.sdp });
      await pc.setLocalDescription(offer);
    } catch (e) {
      console.log(e);
    }
  }

  async function handleOffer(offer) {
    if (pc) {
      console.error("existing peerconnection");
      return;
    }
    try {
      pc = new RTCPeerConnection(configuration);
      pc.onicecandidate = (e) => {
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
      pc.ontrack = (e) => (remoteVideo.current.srcObject = e.streams[0]);
      localStream
        .getTracks()
        .forEach((track) => pc.addTrack(track, localStream));
      await pc.setRemoteDescription(offer);

      const answer = await pc.createAnswer();
      socket.current.emit("message", { type: "answer", sdp: answer.sdp });
      await pc.setLocalDescription(answer);
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

  async function hangup() {
    if (pc) {
      pc.close();
      pc = null;
    }
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
    startButton.current.disabled = false;
    hangupButton.current.disabled = true;
    muteAudButton.current.disabled = true;
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
          // A second tab joined. This tab will initiate a call unless in a call already.
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

  const startB = async () => {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: { echoCancellation: true },
      });
      localVideo.current.srcObject = localStream;
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

  return (
    <>
      <nav>
        <div className="wrapperAnon">
          <img class="logo" src={logo} alt="" />
          <h2 id="h2">Anonymous Chat</h2>
        </div>
        <div className="btnWrapper">
          <button className="logoutBtn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>
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
