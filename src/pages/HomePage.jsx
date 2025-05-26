import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './HomePage.css';
import RulesModal from './RulesModal';
import ErrorModal from './ErrorModal';

function HomePage() {
  const navigate = useNavigate();
  const [gameCode, setGameCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [showRules, setShowRules] = useState(false);

  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('Unexpected error occurred. Please try again later.');

  if (showError) {
    setTimeout(() => setShowError(false), 5000);
  }
  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      setShowError(true);
      setErrorMessage('Please enter your name before creating a game');
      setTimeout(() => setShowError(false), 5000);
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/api/create');
      const gameCode = response.data.code;

      navigate(`/game?code=${gameCode}&player_name=${encodeURIComponent(playerName)}`);
    } catch (error) {
      console.error('Failed to create game:', error);
        setShowError(true);
      setErrorMessage('Failed to create game. Please try again later.');
      setTimeout(() => setShowError(false), 5000);
    }
  };

  const handleJoinGame = async () => {
  if (!gameCode.trim() || !playerName.trim()) {
    setShowError(true);
    setErrorMessage('Please enter both your name and a valid game code');
    setTimeout(() => setShowError(false), 5000);
    return;
  }

  try {
    const response = await axios.get(`http://localhost:8000/api/games?game_code=${gameCode}`);
    const game = response.data.games && response.data.games[0];
    if (!game) {
      setShowError(true);
      setErrorMessage('Game code not found. Please check and try again.');
      setTimeout(() => setShowError(false), 5000);
      return;
    }
    navigate(`/game?code=${gameCode}&player_name=${encodeURIComponent(playerName)}`);
  } catch (error) {
    setShowError(true);
    setErrorMessage('Failed to join game. Please try again later.');
    setTimeout(() => setShowError(false), 5000);
  }
};

  const [activeTab, setActiveTab] = useState('create');

  return (
    <div className="homepage-container">
      <img src="logo.png" alt="Game Logo" className="logo" />
      <div className="card">
        <div className="card-tabs">
          <button
            className={`tab-btn ${activeTab === 'create' ? ' active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Create Game
          </button>
          <button
            className={`tab-btn ${activeTab === 'join' ? ' active' : ''}`}
            onClick={() => setActiveTab('join')}
          >
            Join Game
          </button>
        </div>

        {activeTab === 'create' && (
          <>
            <input
              type="text"
              className="input"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <button className="btn create-btn" onClick={handleCreateGame}>
              Create Game
            </button>
          </>
        )}

        {activeTab === 'join' && (
          <>
            <input
              type="text"
              className="input"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <input
              type="text"
              className="input"
              placeholder="Enter Game Code"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value)}
            />
            <button className="btn join-btn" onClick={handleJoinGame}>
              Join Game
            </button>
          </>
        )}

        {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      </div>
      {showError && <ErrorModal message={errorMessage} onClose={() => setShowError(false)} />}
      <button className="rules-btn" onClick={() => setShowRules(true)}>
        How to Play?
      </button>
      <div className="footer">
        <p className="footer-text">
          Made with ❤️ by The Pythoneers
        </p>
      </div>
    </div>
  );
}

export default HomePage;