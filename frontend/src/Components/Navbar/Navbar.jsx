import React, { useContext, useState, useEffect } from "react";
import { Route, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import { UserContext } from "../../UserContextProvider";
import "./Navbar.css";

const Navbar = ({ handleLogout, handleAccount, roomCode, joinRoom }) => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Function to handle closing the menu
  const closeMenu = () => {
    setIsMenuOpen(false);
  };
  const handleimgclick = (()=>{
    navigate('/chat');
  })

  // Event listener for clicks outside the menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMenuOpen &&
        event.target.closest(".menuToggle") === null &&
        event.target.closest(".menu") === null
      ) {
        closeMenu();
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isMenuOpen]);

  // Event listener for pressing the Escape key
  useEffect(() => {
    const handleEscapeKeyPress = (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };
    console.log(roomCode);
    document.addEventListener("keydown", handleEscapeKeyPress);

    return () => {
      document.removeEventListener("keydown", handleEscapeKeyPress);
    };
  }, [roomCode]);


  return (
    <nav>
      <div className="wrapperAnon">
        <img className="logo" src={logo} alt="" onClick={() => navigate("/chat")} />
        <h2 id="h2">Anonymous Chat {roomCode && `Room: ${roomCode}`}</h2>
      </div>
      <div className="btnWrapper">
        <div className="menuToggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <div className={isMenuOpen ? "hamburger open" : "hamburger"}></div>
        </div>
        {isMenuOpen && (
          <div className="menu">
            <button onClick={handleAccount}>Account</button>
            <button onClick={handleLogout}>Logout</button>
            <button onClick={joinRoom}>Join Room</button> {/* Button to join room */}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
