// RoomModal.js
import React from "react";
import "./RoomModal.css";

const RoomModal = ({ onCreateRoom, onJoinRoom }) => {
  return (
    <div className="room-modal-container">
      <div className="room-modal">
        <h2>Welcome to the Chat Room</h2>
        <p>Do you want to create or join a room?</p>
        <div className="button-container">
          <button onClick={onCreateRoom}>Create Room</button>
          <button onClick={onJoinRoom}>Join Room</button>
        </div>
      </div>
    </div>
  );
};

export default RoomModal;
