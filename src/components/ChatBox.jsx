import React, { useState, useEffect } from 'react';
export default function ChatBox({ socket, onStop }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    socket.onmessage = e => {
      const data = JSON.parse(e.data);
      if (data.event === 'chat_msg') setMsgs(m => [...m, data]);
    };
  }, [socket]);

  const sendMsg = () => {
    socket.send(JSON.stringify({ event: 'chat_msg', content: input }));
    setInput('');
  };

  return (
    <div className="border p-4 max-h-64 overflow-y-auto">
      {msgs.map((m,i) => <div key={i}><strong>{m.player}:</strong> {m.content}</div>)}
      <div className="mt-2 flex">
        <input
          className="border flex-grow p-1 mr-2"
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button onClick={sendMsg} className="btn">Send</button>
        <button onClick={onStop} className="btn btn-red ml-2">Stop Discussion</button>
      </div>
    </div>
  );
}