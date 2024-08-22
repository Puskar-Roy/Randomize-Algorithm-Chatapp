import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('https://randomize-algorithm-chatapp.onrender.com');

const RandomChat = () => {
  const [partner, setPartner] = useState(null);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);

  useEffect(() => {
    // Remove any existing listeners before adding new ones
    socket.off('connectedToChatPartner');
    socket.off('receiveMessage');
    socket.off('partnerDisconnected');

    socket.on('connectedToChatPartner', (partnerId) => {
      setPartner(partnerId);
      alert('You have been connected to a random chat partner!');
    });

    socket.on('receiveMessage', (message) => {
      setChat((prevChat) => [...prevChat, { from: 'Partner', text: message.text }]);
    });

    socket.on('partnerDisconnected', () => {
      alert('Your chat partner has disconnected.');
      setPartner(null);
      setChat([]);
    });

    return () => {
      socket.off('connectedToChatPartner');
      socket.off('receiveMessage');
      socket.off('partnerDisconnected');
    };
  }, []);

  const findChatPartner = () => {
    socket.emit('findChatPartner');
  };

  const sendMessage = () => {
    if (message.trim() !== '' && partner) {
      socket.emit('sendMessage', { to: partner, text: message });
      setChat((prevChat) => [...prevChat, { from: 'You', text: message }]);
      setMessage('');
    }
  };

  return (
    <div>
      <button onClick={findChatPartner}>Find Chat Partner</button>

      {partner && (
        <div>
          <h2>Chat with Partner</h2>
          <div>
            {chat.map((msg, index) => (
              <div key={index}><strong>{msg.from}:</strong> {msg.text}</div>
            ))}
          </div>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message"
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      )}
    </div>
  );
};

export default RandomChat;

