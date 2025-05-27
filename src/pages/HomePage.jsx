import React, { useState } from 'react'; //for component and state management
import { useNavigate } from 'react-router-dom'; //for navigation between pages
import axios from 'axios'; //for making HTTP requests to the backend
import './HomePage.css'; //for styling the HomePage component
import RulesModal from './RulesModal'; //for displaying game rules in a modal
import ErrorModal from './ErrorModal'; //for displaying error messages in a modal

function HomePage() {
  const navigate = useNavigate(); //for navigating to different routes
  const [gameCode, setGameCode] = useState(''); //for storing the game code input by the user
  const [playerName, setPlayerName] = useState(''); //for storing the player's name input by the user
  const [showRules, setShowRules] = useState(false); //for toggling the visibility of the rules modal
  const [showError, setShowError] = useState(false); //for toggling the visibility of the error modal
  const [errorMessage, setErrorMessage] = useState('Unexpected error occurred. Please try again later.'); //for storing the error message to be displayed in the error modal

  // Automatically hide the error message after 5 seconds
  if (showError) {
    setTimeout(() => setShowError(false), 5000); 
  }

  // Function to handle creating a new game
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

  // Function to handle joining an existing game
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