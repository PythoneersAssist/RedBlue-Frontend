import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();
  const [gameCode, setGameCode] = useState('');
  const [playerName, setPlayerName] = useState('');

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      alert('Please enter your name!');
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/api/create');
      const gameCode = response.data.code;

      navigate(`/game?code=${gameCode}&player_name=${encodeURIComponent(playerName)}`);
    } catch (error) {
      console.error('Failed to create game:', error);
      alert('Could not create game');
    }
  };

  const handleJoinGame = () => {
    if (!gameCode.trim() || !playerName.trim()) {
      alert('Please enter both your name and the game code');
      return;
    }

    // Backend-ul nu are /join, așa că doar navigăm
    navigate(`/game?code=${gameCode}&player_name=${encodeURIComponent(playerName)}`);
  };

  return (
    <div className="homepage-container">
      <div className="card">
        <h1 className="title">
          <span className="red">RED</span>{' '}
          <span className="plus">+</span>{' '}
          <span className="blue">BLUE</span>
        </h1>

        <input
          type="text"
          className="input"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />

        <button className="btn create-btn" onClick={handleCreateGame}>
          🚀 Create Game
        </button>

        <input
          type="text"
          className="input"
          placeholder="Enter Game Code"
          value={gameCode}
          onChange={(e) => setGameCode(e.target.value)}
        />

        <button className="btn join-btn" onClick={handleJoinGame}>
          🎮 Join Game
        </button>
      </div>
    </div>
  );
}

export default HomePage;