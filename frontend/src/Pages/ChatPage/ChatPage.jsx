import React, { useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import arrow from "../../assets/arrow.png";
import logo from "../../assets/logo.png";
import vc from "../../assets/vc.svg";
import "./ChatPage.css";
import ping from "../../assets/ping.mp3";
import { UserContext } from "../../UserContextProvider";

const ChatPage = ({ setIsAuthenticated }) => {
  const { user, setUser } = useContext(UserContext);
  const userRef = useRef(user);
  const navigate = useNavigate();
  const socket = useRef(null);

  useEffect(() => {
    socket.current = io("http://localhost:8000");  
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }

    const form = document.getElementById("send-container");
    const messageInput = document.getElementById("messageInp");
    const messageContainer = document.querySelector(".container");
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
        } else {
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
      } else {
      }
    
      const { firstName, email } = await getname(userData);
    
      setUser({ firstName, email });
    
      if (firstName) {
        socket.current.emit("new-user-joined", { firstName });
      } else {
      }
    };
    
    fetchUser();

    const append = (message, position) => {
      const messageElement = document.createElement("div");
      const date = new Date();
      const timestamp = `${date.getHours()}:${date.getMinutes()}`;
      messageElement.innerHTML = `<span class="timestamp">${timestamp}</span>${message}`;
      messageElement.classList.add("message");
      messageElement.classList.add(position);
      messageContainer.append(messageElement);
    };

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const message = messageInput.value;
      if (user && user.firstName) {
        append(`You: ${message}`, "right");
        socket.current.emit("send", message);
        messageInput.value = "";
      } else {
      }
    });

    socket.current.on("user-joined", (data) => {
      append(`${data.firstName} joined the chat`, "left");
    });

    socket.current.on("receive", (data) => {
      append(`${data.firstName}: ${data.message}`, "left");
      audio.play();
    });
    socket.current.on("left", (name) => {
      append(`${name.firstName} left the chat`, "left");
    });
    return () => {
      socket.current.disconnect(); 
    };
  }, []);

  const handleLogout = () => {
    socket.current.emit('logout', { firstName: user.firstName }, () => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        navigate('/login');
        setUser(null);
    });
  };

  return (
    <div className="wrapper">
      <nav>
        <div className="wrapperAnon">
        <img class="logo" src={logo} alt="" />
        <h2 id="h2">Anonymous Chat</h2>
        </div>
        <div className="btnWrapper">
        <button className="logoutBtn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div class="container"></div>
      <div class="send">
        <form action="#" id="send-container">
          <input
            type="text"
            name="messageInp"
            placeholder="Message..."
            id="messageInp"
          />
          <button class="btn" type="submit">
            <img src={arrow} alt="" secSet="" />
          </button>
          <button class="btn" onClick={() => navigate('/vc')}>
          <img src={vc} alt="" secSet="" />
        </button>
          
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
