import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import { UserContext } from "../../UserContextProvider";
import "./Navbar.css";

const Navbar = ({ handleLogout, handleAccount }) => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Function to handle closing the menu
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

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

    document.addEventListener("keydown", handleEscapeKeyPress);

    return () => {
      document.removeEventListener("keydown", handleEscapeKeyPress);
    };
  }, []);

  return (
    <nav>
      <div className="wrapperAnon">
        <img className="logo" src={logo} alt="" />
        <h2 id="h2">Anonymous Chat</h2>
      </div>
      <div className="btnWrapper">
        <div className="menuToggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <div className={isMenuOpen ? "hamburger open" : "hamburger"}></div>
        </div>
        {isMenuOpen && (
          <div className="menu">
            <button onClick={handleAccount}>Account</button>
            <button onClick={handleLogout}>Logout</button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
