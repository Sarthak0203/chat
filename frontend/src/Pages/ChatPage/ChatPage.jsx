import React, { useEffect, useContext, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import arrow from "../../assets/arrow.png";
import vc from "../../assets/vc.svg";
import "./ChatPage.css";
import ping from "../../assets/ping.mp3";
import { UserContext } from "../../UserContextProvider";
import Navbar from "../../Components/Navbar/Navbar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ChatPage = ({ setIsAuthenticated }) => {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const socket = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [roomCode, setRoomCode] = useState(null);

  const append = (message, position, messageType = "", senderName = "") => {
    const messageElement = document.createElement("div");
    const date = new Date();
    const timestamp = `${date.getHours()}:${date.getMinutes()}`;

    messageElement.innerHTML = `
      <div class="chat ${position === 'left' ? 'chat-start' : 'chat-end'}">
        <div class="chat-image avatar">
          <div class="w-10 rounded-full">
            <img alt="Tailwind CSS chat bubble component" src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg" />
          </div>
        </div>
        <div class="chat-header">
          ${position === 'left' ? senderName : `${user.firstName}`}
          <time class="text-xs opacity-50">${timestamp}</time>
        </div>
        <div class="chat-bubble">${message}</div>
        <div class="chat-footer opacity-50">
          ${position === 'left' ? 'Delivered' : `Seen at ${timestamp}`}
        </div>
      </div>
    `;

    messageElement.classList.add("message");
    messageElement.classList.add(position);
    if (messageType) {
      messageElement.classList.add(messageType);
    }
    if (messageType === "video-call") {
      messageElement.classList.add("video-call");
    }

    setTimeout(() => {
      messageElement.classList.add("fade-in");
    }, 50);

    const messageContainer = document.querySelector(".container");
    messageContainer.append(messageElement);

    setTimeout(() => {
      messageContainer.scrollTo({
        top: messageContainer.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  };

  const joinRoom = async (code) => {
    const roomCode = code || window.prompt("Enter room code");
    if (roomCode) {
      socket.current.emit("join-room", roomCode, (response) => {
        if (response.success) {
          setRoomCode(roomCode);
          localStorage.setItem("roomCode", roomCode); // Store room code in local storage
          toast.success(`Joined room with code ${roomCode}`);
        } else {
          if (response.error) {
            alert(response.error);
          } else {
            toast.error(`Failed to join room. Please try again.`);
          }
        }
      });
    }
  };

  useEffect(() => {
    socket.current = io("http://localhost:7500");
    const token = localStorage.getItem("token");
    const storedRoomCode = localStorage.getItem("roomCode"); // Retrieve stored room code

    if (!token) {
      navigate("/login");
    }

    const form = document.getElementById("send-container");
    const messageInput = document.getElementById("messageInp");
    var audio = new Audio(ping);
    audio.muted = true;

    window.addEventListener("click", function () {
      audio.muted = false;
    });

    const createOrJoinRoom = async () => {
      if (storedRoomCode) {
        joinRoom(storedRoomCode); // Reuse stored room code
      } else {
        const action = window.prompt(
          'Do you want to create or join a room? Enter "create" or "join".'
        );
        if (action === "create") {
          socket.current.emit("create-room");
        } else if (action === "join") {
          joinRoom();
        }
      }
    };
    createOrJoinRoom();

    socket.current.on("room-created", (code) => {
      setRoomCode(code);
      localStorage.setItem("roomCode", code); // Store room code in local storage
    });

    socket.current.on("room-joined", (code) => {
      setRoomCode(code);
      localStorage.setItem("roomCode", code); // Store room code in local storage
    });

    const getname = async function (user) {
      let firstName = "";
      let email = "";
      if (user && user.email) {
        email = user.email;
        const response = await fetch("http://localhost:9000/name", {
          method: "POST",
          body: JSON.stringify({ email: user.email }),
          headers: { "Content-Type": "Application/json" },
          credentials: "include",
        });

        const data = await response.json();
        if (data && data.firstName) {
          firstName = data.firstName;
          setUser({ firstName, email });
        }
      }
      return { firstName, email };
    };

    const fetchUser = async () => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      let userData;
      if (storedUser) {
        setUser(storedUser);
        userData = storedUser;
      } else if (user) {
        const response = await fetch("http://localhost:9000/name", {
          method: "POST",
          headers: { "Content-Type": "Application/json" },
          credentials: "include",
          body: JSON.stringify({ email: user.email }),
        });
        userData = await response.json();
      }

      const { firstName, email } = await getname(userData);

      setUser({ firstName, email });

      if (firstName) {
        socket.current.emit("new-user-joined", { firstName });
      }
    };

    fetchUser();

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const message = messageInput.value;
      if (message.trim() !== "" && user && user.firstName) {
        append(`${message}`, "right", "", user.firstName);
        socket.current.emit("send", { message: message });
        messageInput.value = "";
      }
    });

    socket.current.on("user-joined", (data) => {
      append(` joined the chat`, "left", "joined", data.firstName);
    });

    socket.current.on("receive", (data) => {
      append(`${data.message}`, "left", "", data.firstName);
    });

    socket.current.on("left", (name) => {
      append(`left the chat`, "left", "left", name.firstName);
    });

    socket.current.on("welcome-message", (message) => {
      append(message, "center", "", "");
    });

    socket.current.on("incoming-call", (data) => {
      toast.info(`${data.firstName} is calling...`, {
        position: "top-right",
        autoClose: 10000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        closeButton: (
          <div>
            <button className="answerbtn" onClick={handleAnswer}>
              Answer
            </button>
            <button className="declinebtn" onClick={handleDecline}>
              Decline
            </button>
          </div>
        ),
      });
    });

    return () => {
      socket.current.disconnect();
    };
  }, []);

  const handleLogout = () => {
    socket.current.emit("logout", { firstName: user.firstName }, () => {
      localStorage.removeItem("token");
      localStorage.removeItem("roomCode"); // Clear room code from local storage on logout
      setIsAuthenticated(false);
      navigate("/login");
      setUser(null);
    });
  };

  const handleAccount = () => {
    navigate("/account");
  };

  const handleVideoCall = () => {
    if (user && user.firstName) {
      socket.current.emit("call-invitation", { firstName: user.firstName });
      append(`${user.firstName} started a video call.`, "left", "video-call", user.firstName);
      navigate("/vc");
    }
  };

  const handleAnswer = () => {
    socket.current.emit("call-accepted", { firstName: user.firstName });
    navigate("/vc");
  };

  const handleDecline = () => {
    socket.current.emit("call-declined", { firstName: user.firstName });
  };

  return (
    <div className="wrapper">
      <Navbar
        handleLogout={handleLogout}
        handleAccount={handleAccount}
        setIsMenuOpen={setIsMenuOpen}
        roomCode={roomCode}
        joinRoom={joinRoom}
      />
      <div className="container"></div>
      <div className="send">
        <form action="#" id="send-container">
          <input
            type="text"
            name="messageInp"
            placeholder="Message..."
            id="messageInp"
          />
          <button className="btn" type="submit">
            <img src={arrow} alt="" secSet="" />
          </button>
          <button className="btn" onClick={handleVideoCall}>
            <img src={vc} alt="" secSet="" />
          </button>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
};

export default ChatPage;
