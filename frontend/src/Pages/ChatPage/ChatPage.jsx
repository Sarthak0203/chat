import React, { useEffect, useContext, useRef } from "react";
import io from "socket.io-client";
import arrow from "../../assets/arrow.png";
import logo from "../../assets/logo.png";
import "./ChatPage.css";
import ping from "../../assets/ping.mp3";
import { UserContext } from "../../UserContextProvider";

const ChatPage = () => {
  const { user, setUser } = useContext(UserContext);
  const userRef = useRef(user);

  useEffect(() => {
    const socket = io("http://localhost:8000");
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
      console.log("User object at start of getname:", userRef.current);
      if (user && user.email) {
        email = user.email;
        const response = await fetch("http://localhost:9000/name", {
          method: "POST",
          body: JSON.stringify({ email: user.email }),
          headers: { "Content-Type": "Application/json" },
          credentials: "include",
        });

        const data = await response.json();
        console.log("Response data from server:", data);
        if (data && data.firstName) {
          // Check if data and data.first_name are not null
          firstName = data.firstName;
          console.log("First name after fetch:", firstName);
          setUser({ firstName, email }); // Update the state here
        } else {
          console.log("First name not available in response data");
        }
      }
      return { firstName, email };
    };

    const fetchUser = async () => {
      console.log("fetchUser start");
      const storedUser = JSON.parse(localStorage.getItem("user"));
      console.log("storedUser:", storedUser);
      let userData;
      if (storedUser) {
        setUser(storedUser);
        userData = storedUser;
      } else if (user) {
        console.log("user:", user);
        const response = await fetch("http://localhost:9000/name", {
          method: "POST",
          headers: { "Content-Type": "Application/json" },
          credentials: "include",
          body: JSON.stringify({ email: user.email }),
        });
        console.log("response:", response);
        userData = await response.json();
        console.log("userData:", userData);
      } else {
        console.log("user is null in fetchuser");
      }
    
      const { firstName, email } = await getname(userData);
      console.log("firstName, email:", firstName, email);
    
      setUser({ firstName, email });
    
      if (firstName) {
        socket.emit("new-user-joined", { firstName });
      } else {
        console.log("user not available");
      }
      console.log("fetchUser end");
    };
    

    // console.log(user)
    fetchUser();

    const append = (message, position) => {
      const messageElement = document.createElement("div");
      const date = new Date(); // Get current date/time
      const timestamp = `${date.getHours()}:${date.getMinutes()}`; // Format: HH:MM
      messageElement.innerHTML = `<span class="timestamp">${timestamp}</span>${message}`;
      messageElement.classList.add("message");
      messageElement.classList.add(position);
      messageContainer.append(messageElement);
    };

    
form.addEventListener("submit", (e) => {
  e.preventDefault();
  console.log('form submitted')
  const message = messageInput.value;
  if (user && user.firstName) { // Check if the user's name is defined
    append(`You: ${message}`, "right");
    socket.emit("send", message);
    messageInput.value = "";
  } else {
    console.log("User's name is not defined yet");
  }
});

    socket.on("user-joined", (data) => {
      append(`${data.firstName} joined the chat`, "left");
    });

    socket.on("receive", (data) => {
      append(`${data.firstName}: ${data.message}`, "left");
      audio.play();
    });
    socket.on("left", (name) => {
      append(`${name.firstName} left the chat`, "left");
    });
    // console.log(user)

    
  }, []);

  return (
    <div className="wrapper">
      <nav>
        <img class="logo" src={logo} alt="" />
        <h2 id="h2">Anonymous Chat</h2>
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
            <img src={arrow} alt="" srcset="" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
