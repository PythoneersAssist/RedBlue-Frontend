import React, { useState } from 'react';
import './HomePage.css';
import { useNavigate } from 'react-router-dom';
import RulesModal from './RulesModal';

function HomePage() {
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      alert('Please enter your name!');
      return;
    }

    try {
      const res = await fetch('/api/create', {
        method: 'POST',
      });

      const data = await res.json();
      const code = data.code || data.game_code;
      if (!code) throw new Error('Invalid response: no game code');

      navigate(`/game?code=${encodeURIComponent(code)}&name=${encodeURIComponent(playerName)}`);
    } catch (err) {
      console.error(err);
      alert('Error creating game!');
    }
  };

  const handleJoinGame = () => {
    if (!playerName.trim() || !gameCode.trim()) {
      alert('Please enter your name and the game code!');
      return;
    }

    navigate(`/game?code=${encodeURIComponent(gameCode)}&name=${encodeURIComponent(playerName)}`);
  };

  return (
    <div className="homepage-container">
      <div className="card">
        <h1 className="title">
          <span className="red">RED</span> <span className="plus">+</span> <span className="blue">BLUE</span>
        </h1>

        <input
          className="input"
          placeholder="Your Name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />

        <button className="btn create-btn" onClick={handleCreateGame}>
          🚀 Create Game
        </button>

        <input
          className="input"
          placeholder="Enter Game Code"
          value={gameCode}
          onChange={(e) => setGameCode(e.target.value)}
        />

        <button className="btn join-btn" onClick={handleJoinGame}>
          🎮 Join Game
        </button>

        <button className="btn create-btn" onClick={() => setShowModal(true)}>
          📘 How to Play?
        </button>
      </div>

      {showModal && <RulesModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

export default HomePage;
