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
  const userRef = useRef(user);
  const navigate = useNavigate();
  const socket = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [roomCode, setRoomCode] = useState(null);

  const append = (message, position, messageType) => {
    const messageElement = document.createElement("div");
    const date = new Date();
    const timestamp = `${date.getHours()}:${date.getMinutes()}`;
    messageElement.innerHTML = `<div class="message-content">${message}</div><div class="timestamp">${timestamp}</div>`;
    messageElement.classList.add("message");
    messageElement.classList.add(position);
    messageElement.classList.add(messageType);
    if (messageType === "video-call") {
      messageElement.classList.add("video-call");
    }

    // Add the fade-in class after a short delay to trigger the animation
    setTimeout(() => {
      messageElement.classList.add("fade-in");
    }, 50);

    const messageContainer = document.querySelector(".container");
    messageContainer.append(messageElement);

    // Smooth scroll animation
    setTimeout(() => {
      messageContainer.scrollTo({
        top: messageContainer.scrollHeight,
        behavior: "smooth",
      });
    }, 100); // Adjust the delay as needed for animation timing
  };

  const joinRoom = async () => {
    const roomCode = window.prompt("Enter room code");
    if (roomCode) {
      socket.current.emit("join-room", roomCode, (response) => {
        console.log("Join room response:", response); // Add this line to check the response
        if (response.success) {
          setRoomCode(roomCode);
          toast.success(`Joined room with code ${roomCode}`);
        } else {
          // Check if the response contains an error message
          if (response.error) {
            // Display an alert with the error message
            alert(response.error);
          } else {
            // If no error message is provided, display a generic error
            toast.error(`Failed to join room. Please try again.`);
          }
        }
      });
    }
  };

  useEffect(() => {
    console.log("Room code:", roomCode);
    socket.current = io("http://localhost:8000");
    const token = localStorage.getItem("token");
    socket.current.on('room-not-found', (error) => {
      alert(error.message);
    });
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
      const action = window.prompt(
        'Do you want to create or join a room? Enter "create" or "join".'
      );
      if (action === "create") {
        socket.current.emit("create-room");
      } else if (action === "join") {
        joinRoom(); // Just call the joinRoom function for joining a room
      }
    };
    createOrJoinRoom();

    socket.current.on("room-created", (code) => {
      console.log(`Created room with code ${code}`);
      setRoomCode(code);
    });

    socket.current.on("room-joined", (code) => {
      console.log(`Joined room with code ${code}`);
      setRoomCode(code);
    });
    // Ensure the user is still present in the room before sending notification
    socket.current.on(
      "video-call-started",
      async ({ user, roomCode, isCaller }) => {
        if (!isCaller && user) {
          // Check if user object exists
          const inRoom = await isUserInRoom(user.id, roomCode); // Call a helper function to check presence

          if (inRoom && window.location.pathname === "/chat") {
            const response = await fetch(
              `http://localhost:8000/user/${user.id}`
            ); // Fetch user details
            const data = await response.json();

            toast.info(
              `${data.firstName} started a video call in room ${roomCode}`,
              {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
              }
            );
          }
        }
      }
    );

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
      // Only send the message if the input is not empty
      if (message.trim() !== "" && user && user.firstName) {
        append(`You: ${message}`, "right");
        socket.current.emit("send", { message: message });
        messageInput.value = "";
      }
    });

    socket.current.on("user-joined", (data) => {
      append(`${data.firstName} joined the chat`, "left", "joined"); // Use "joined" messageType
    });

    socket.current.on("receive", (data) => {
      append(`${data.firstName}: ${data.message}`, "left");
      // audio.play();
    });

    socket.current.on("left", (name) => {
      append(`${name.firstName} left the chat`, "leftchat", "left"); // Use "left" messageType
    });
    socket.current.on("welcome-message", (message) => {
      append(message, "center");
    });
    socket.current.on("incoming-call", (data) => {
      console.log("incoming-call fired");
      toast.info(`${data.firstName} is calling...`, {
        position: "top-right",
        autoClose: 10000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        // Add buttons for answering or declining the call
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

  const isUserInRoom = async (userId, roomCode) => {
    // Implement logic to check user presence in the room using Socket.IO methods
    // This might involve querying the server-side for connected users in the room.
    // Replace the placeholder code with your actual implementation.
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate presence check (replace with actual logic)
        const isPresent = Math.random() > 0.5; // Replace with real presence check
        resolve(isPresent);
      }, 1000); // Simulate delay (remove for actual implementation)
    });
  };
  const handleLogout = () => {
    socket.current.emit("logout", { firstName: user.firstName }, () => {
      localStorage.removeItem("token");
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
      console.log("call invitation from chatpage");
      append(`${user.firstName} started a video call.`, "left", "video-call"); // Use "video-call" messageType
      navigate("/vc");
    }
  };
  const handleAnswer = () => {
    // Emit a 'call-accepted' event and navigate to the video call page
    socket.current.emit("call-accepted", { firstName: user.firstName });
    navigate("/vc");
  };

  const handleDecline = () => {
    // Emit a 'call-declined' event
    socket.current.emit("call-declined", { firstName: user.firstName });
  };
  const scrollToBottom = () => {
    const messageContainer = document.querySelector(".container");
    messageContainer.scrollTo({
      top: messageContainer.scrollHeight,
      behavior: "smooth",
    });
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
