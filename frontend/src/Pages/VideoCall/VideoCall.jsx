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

const VideoCall = ({ setIsAuthenticated }) => {
  const startButton = useRef(null);
  const hangupButton = useRef(null);
  const muteAudButton = useRef(null);
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const socket = useRef();
  const pcs = {}; // Store RTCPeerConnections for each room
  const localStreams = {}; // Store local streams for each room

  const makeCall = async (roomId) => {
    try {
      pcs[roomId] = new RTCPeerConnection(configuration); //asdfasdfasdfasfasdfasdfasdfasdf
      pcs[roomId].onicecandidate = (e) => {
        const message = {
          type: "candidate",
          candidate: null,
          roomId, //asdfasdfasdfasfasdfasdfasdfasdf
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
      socket.current.emit("message", { type: "offer", sdp: offer.sdp, roomId }); //asdfasdfasdfasfasdfasdfasdfasdf
      await pcs[roomId].setLocalDescription(offer);
      setIsCallActive(true);
    } catch (e) {
      console.log(e);
    }
  };

  const handleOffer = async (offer, roomId) => {
    if (pcs[roomId]) {
      console.error("existing peerconnection");
      return;
    }
    try {
      pcs[roomId] = new RTCPeerConnection(configuration); //asdfasdfasdfasfasdfasdfasdfasdf
      pcs[roomId].onicecandidate = (e) => {
        const message = {
          type: "candidate",
          candidate: null,
          roomId, //asdfasdfasdfasfasdfasdfasdfasdf
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
      await pcs[roomId].setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await pcs[roomId].createAnswer();
      socket.current.emit("message", { type: "answer", sdp: answer.sdp, roomId }); //asdfasdfasdfasfasdfasdfasdfasdf
      await pcs[roomId].setLocalDescription(answer);
    } catch (e) {
      console.log(e);
    }
  };

  const handleAnswer = async (answer, roomId) => {
    if (!pcs[roomId]) {
      console.error("no peerconnection");
      return;
    }
    try {
      await pcs[roomId].setRemoteDescription(new RTCSessionDescription(answer));
    } catch (e) {
      console.log(e);
    }
  };

  const handleCandidate = async (candidate, roomId) => {
    try {
      if (!pcs[roomId]) {
        console.error("no peerconnection");
        return;
      }
      if (candidate && candidate.candidate && candidate.sdpMid !== null && candidate.sdpMLineIndex !== null) {
        await pcs[roomId].addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (e) {
      console.log(e);
    }
  };

  const hangup = (roomId) => {
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
  };

  useEffect(() => {
    window.addEventListener("popstate", hangB);
    socket.current = io("http://localhost:7500", { transports: ["websocket"] });

    socket.current.on("message", (e) => {
      if (!localStreams[e.roomId]) {
        console.log("not ready yet");
        return;
      }
      console.log("ready");
      
      const { roomId } = e; //asdfasdfasdfasfasdfasdfasdfasdf
      switch (e.type) {
        case "offer":
          handleOffer(e, roomId); //asdfasdfasdfasfasdfasdfasdfasdf
          break;
        case "answer":
          handleAnswer(e, roomId); //asdfasdfasdfasfasdfasdfasdfasdf
          break;
        case "candidate":
          handleCandidate(e, roomId); //asdfasdfasdfasfasdfasdfasdfasdf
          break;
        case "ready":
          if (pcs[roomId]) { //asdfasdfasdfasfasdfasdfasdfasdf
            console.log("already in call, ignoring");
            return;
          }
          makeCall(roomId); //asdfasdfasdfasfasdfasdfasdfasdf
          break;
        case "hangup":
          if (pcs[roomId]) { //asdfasdfasdfasfasdfasdfasdfasdf
            hangup(roomId); //asdfasdfasdfasfasdfasdfasdfasdf
          }
          break;
        case "bye":
          if (pcs[roomId]) { //asdfasdfasdfasfasdfasdfasdfasdf
            hangup(roomId); //asdfasdfasdfasfasdfasdfasdfasdf
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

    socket.current.emit("message", { type: "ready", roomId }); //asdfasdfasdfasfasdfasdfasdfasdf
  };

  const hangB = async (roomId) => {
    hangup(roomId); //asdfasdfasdfasfasdfasdfasdfasdf
    socket.current.emit("message", { type: "hangup", roomId }); //asdfasdfasdfasfasdfasdfasdfasdf
  };

  const muteAudio = () => {
    if (audiostate) {
      localVideo.current.muted = true;
      setAudio(false);
    } else {
      localVideo.current.muted = false;
      setAudio(true);
    }
  };

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
            ></video>
            {/* <div className="video-label">Me</div> */}
          </div>
          <div className="video-item-wrapper">
            <video
              ref={remoteVideo}
              className="video-item"
              autoPlay
              playsInline
            ></video>
            {/* <div className="video-label">{user.firstName}</div> */}
          </div>
        </div>

        <div className="btn-container">
          <button
            className="btn-item btn-start"
            ref={startButton}
            onClick={() => startB("some-room-id")} //asdfasdfasdfasfasdfasdfasdfasdf
          >
            <FiVideo size={25} />
          </button>
          <button
            className="btn-item btn-end"
            ref={hangupButton}
            onClick={() => hangB("some-room-id")} //asdfasdfasdfasfasdfasdfasdfasdf
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
