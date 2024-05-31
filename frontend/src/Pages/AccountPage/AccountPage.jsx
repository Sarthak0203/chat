import React, { useState, useContext, useEffect, useRef } from "react";
import { UserContext } from "../../UserContextProvider";
import "./AccountPage.css";
import io from "socket.io-client";
import Navbar from "../../Components/Navbar/Navbar";

const AccountPage = () => {
  const { user: userFromContext, setUser } = useContext(UserContext);
  const [user, updateUser] = useState(userFromContext);
  const [loading, setLoading] = useState(!user);
  const [editing, setEditing] = useState(false);
  const [firstName, setName] = useState(user ? user.firstName : "");
  const [email, setEmail] = useState(user ? user.email : "");
  const socket = useRef(null);

  useEffect(() => {
    socket.current = io("http://localhost:8000");
    if (userFromContext) {
      setName(userFromContext.firstName);
      setEmail(userFromContext.email);
      updateUser(userFromContext);
      setUser(userFromContext);
      setLoading(false);
    }
  }, [userFromContext, setUser]);

  const handleEdit = () => {
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      const response = await fetch("http://localhost:9000/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldEmail: user.email,
          newEmail: email,
          firstName: firstName,
        }),
      });
      const data = await response.json();
      if (data.success) {
        // Update the user state and context only after the fetch function has completed
        await updateUser({ ...user, firstName: firstName, email: email });
        await setUser({ ...user, firstName: firstName, email: email });
        // Emit the name-change event only if the name has actually changed
        if (user.firstName !== firstName) {
          socket.current.emit("name-change", {
            oldName: user.firstName,
            newName: firstName,
          });
        }
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
    setEditing(false);
  };

  if (loading) {
    return <div>Loading...</div>;
  } else {
    return (
      <>
        <Navbar />
        <div className="account-wrapper">
          <h1 className="account-heading">Account</h1>
          {editing ? (
            <div className="edit-form">
              <label className="edit-label">
                Name:
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setName(e.target.value)}
                  className="edit-input"
                />
              </label>
              <label className="edit-label">
                Email:
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="edit-input"
                />
              </label>
              <button onClick={handleSave} className="save-btn">
                Save
              </button>
            </div>
          ) : (
            <div className="user-info">
              <p>
                <span className="info-label">Name:</span> {user.firstName}
              </p>
              <p>
                <span className="info-label">Email:</span> {user.email}
              </p>
              <button onClick={handleEdit} className="edit-btn">
                Edit
              </button>
            </div>
          )}
        </div>
      </>
    );
  }
};

export default AccountPage;
