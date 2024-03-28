import React, { useEffect, useContext, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import arrow from "../../assets/arrow.png";
import vc from "../../assets/vc.svg";
import "./ChatPage.css";
import ping from "../../assets/ping.mp3";
import { UserContext } from "../../UserContextProvider";
import Navbar from "../../Components/Navbar/Navbar"

const ChatPage = ({ setIsAuthenticated }) => {
  const { user, setUser } = useContext(UserContext);
  const userRef = useRef(user);
  const navigate = useNavigate();
  const socket = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Define the append function
  const append = (message, position, messageType) => {
    const messageElement = document.createElement("div");
    const date = new Date();
    const timestamp = `${date.getHours()}:${date.getMinutes()}`;
    messageElement.innerHTML = `<span class="timestamp">${timestamp}</span>${message}`;
    messageElement.classList.add("message");
    messageElement.classList.add(position);
    messageElement.classList.add(messageType);
    if (messageType === "video-call") {
      console.log(messageElement.classList);
      messageElement.classList.add("video-call");
      console.log(messageElement.classList);
    }
    const messageContainer = document.querySelector(".container");
    messageContainer.append(messageElement);
    console.log(messageElement);
  };

  useEffect(() => {
    socket.current = io("http://localhost:8000");
    const token = localStorage.getItem("token");
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
      if (user && user.firstName) {
        append(`You: ${message}`, "right");
        socket.current.emit("send", message);
        messageInput.value = "";
      }
    });

    socket.current.on("user-joined", (data) => {
      append(`${data.firstName} joined the chat`, "left", "joined"); // Use "joined" messageType
    });

    socket.current.on("receive", (data) => {
      append(`${data.firstName}: ${data.message}`, "left");
      audio.play();
    });

    socket.current.on("left", (name) => {
      append(`${name.firstName} left the chat`, "leftchat", "left"); // Use "left" messageType
    });
    socket.current.on("welcome-message", (message) => {
      append(message, "center");
    });

    return () => {
      socket.current.disconnect();
    };
  }, []);

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
      socket.current.emit("video-call-started", { firstName: user.firstName });
      append(`${user.firstName} started a video call.`, "left", "video-call"); // Use "video-call" messageType
      navigate("/vc");
    }
  };

  return (
    <div className="wrapper">
      <Navbar
        handleLogout={handleLogout}
        handleAccount={handleAccount}
        setIsMenuOpen={setIsMenuOpen}
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
    </div>
  );
};

export default ChatPage;
