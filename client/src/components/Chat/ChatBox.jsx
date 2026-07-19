import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../../services/socket';

export default function ChatBox() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef(null);

  // Listen for real-time chat messages
  useEffect(() => {
    function onChatMessage(message) {
      setMessages((prev) => [...prev, message]);
    }

    socket.on('chatMessage', onChatMessage);

    // Add a system welcome message when joining the lobby
    setMessages([
      {
        id: 'system-welcome',
        isSystem: true,
        text: 'Welcome to the lobby! Chat with your friends here.',
        timestamp: Date.now()
      }
    ]);

    return () => {
      socket.off('chatMessage', onChatMessage);
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text) return;

    socket.emit('sendChatMessage', { text }, (response) => {
      if (response && !response.success) {
        console.error('Failed to send message:', response.message);
      }
    });

    setInputValue('');
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="flex flex-col h-[400px] md:h-full min-h-[350px] bg-white border border-gray-200 rounded-3xl overflow-hidden flex-1 shadow-xl">
      {/* Chat Box Header */}
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center space-x-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500"></span>
        </span>
        <h2 className="text-xs font-black text-gray-700 uppercase tracking-widest">
          Room Chat
        </h2>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        {messages.map((msg) => {
          if (msg.isSystem) {
            return (
              <div key={msg.id} className="text-center py-1">
                <span className="text-[10px] bg-gray-100 text-gray-500 border border-gray-200 px-3 py-1 rounded-full font-bold">
                  {msg.text}
                </span>
              </div>
            );
          }

          const isSelf = msg.senderId === socket.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
            >
              {/* Sender Name */}
              {!isSelf && (
                <span className="text-[10px] font-bold text-gray-400 mb-1 ml-1 uppercase tracking-wider">
                  {msg.senderName}
                </span>
              )}
              {/* Message Bubble */}
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed break-words shadow-sm ${
                  isSelf
                    ? 'bg-violet-600 text-white rounded-tr-none shadow-violet-200'
                    : 'bg-gray-50 text-gray-700 rounded-tl-none border border-gray-100'
                }`}
              >
                <p>{msg.text}</p>
                <span
                  className={`block text-[9px] mt-1.5 font-bold text-right leading-none ${
                    isSelf ? 'text-violet-300' : 'text-gray-400'
                  }`}
                >
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} className="h-1" />
      </div>

      {/* Chat Input form */}
      <form
        onSubmit={handleSend}
        className="p-4 bg-gray-50 border-t border-gray-100 flex items-center space-x-2"
      >
        <input
          type="text"
          placeholder="Type a message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          maxLength={100}
          className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition duration-150 text-sm font-medium text-gray-800 placeholder-gray-400 outline-none shadow-sm"
        />
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="p-3 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl transition duration-150 active:scale-95 flex items-center justify-center shadow-md shadow-violet-200 disabled:shadow-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
            />
          </svg>
        </button>
      </form>
    </div>
  );
}
