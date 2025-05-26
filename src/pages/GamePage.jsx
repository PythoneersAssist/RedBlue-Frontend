import React, { useEffect, useRef, useState } from 'react';
import './GamePage.css';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

function GamePage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const gameCode = params.get('code');
  const playerName = params.get('player_name') || 'Player';
  const [myName, setMyName] = useState(playerName);
  const [opponentName, setOpponentName] = useState('');

  useEffect(() => {
    setPlayer1Name(playerName);
  }, [playerName]);

  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [myIndex, setMyIndex] = useState(null); // 0 sau 1
  const [round, setRound] = useState(1);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [result, setResult] = useState('');
  const [choiceMade, setChoiceMade] = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [showDiscussionPrompt, setShowDiscussionPrompt] = useState(false);
  const [playerWantsChat, setPlayerWantsChat] = useState(null);
  const [opponentWantsChat, setOpponentWantsChat] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [roundHistory, setRoundHistory] = useState([]);

  const gameSocketRef = useRef(null);
  const chatSocketRef = useRef(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [message, setMessage] = useState('');

  const fetchGameInfo = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/games?game_code=${gameCode}`);
      const game = res.data.games[0];
      if (!game) return;

      const opponent = game.player1 === playerName ? game.player2 : game.player1;
      setOpponentName(opponent || 'Waiting...');
    } catch (err) {
      console.error('❌ Failed to fetch game info:', err);
    }
  };

  useEffect(() => {
    if (!gameCode || !playerName) return;

    const timeout = setTimeout(() => {
      const socket = new WebSocket(`ws://localhost:8000/api/ws/${gameCode}?player_name=${playerName}`);
      gameSocketRef.current = socket;

      socket.onopen = () => {
        console.log('✅ Game WebSocket connected');
        fetchGameInfo(); // <-- aici!
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('📥 WebSocket message:', data);

        if (data.event === 'game_reconnection_token') {
          localStorage.setItem('reconnection_token', data.reconnection_token);
        } 
        if (data.event === 'game_player_join') {
          if (data.player_name !== playerName) {
            setOpponentName(data.player_name);
          }
        }
        if (data.event === 'game_round_over') {
          const index = data.index;
          const opponentIndex = index === 0 ? 1 : 0;

          setMyIndex(index);
          setPlayerScore(data.score[index]);
          setOpponentScore(data.score[opponentIndex]);
          setMyName(playerName);
          setOpponentName((prev) => prev || `Player ${opponentIndex + 1}`);

          const colorNames = ['🔴 RED', '🔵 BLUE'];

          setResult(`You chose ${colorNames[data.choice[index]]} and opponent chose ${colorNames[data.choice[opponentIndex]]}`);
          setWaitingForOpponent(false);
          setChoiceMade(true);

          const myChoice = parseInt(data.choice[index]);
          const opponentChoice = parseInt(data.choice[1 - index]);
          const myScore = data.score[index];

          setRoundHistory(prev => [
            ...prev,
            {
              round: data.round,
              myChoice,
              opponentChoice,
              myScore
            }
          ]);

          setTimeout(() => {
            if (data.round < 10) {
              setRound(data.round + 1);
              setResult('');
              setChoiceMade(false);
              setWaitingForOpponent(false);
            } else {
              setShowEndScreen(true);
            }
          }, 4000);
        }
        if (data.event === 'game_over') {
          if (data.scores && typeof data.scores === 'object') {
            // Find your and opponent's scores by name
            const myScore = data.scores[playerName];
            // Find opponent name (the other key in scores)
            const opponentNameKey = Object.keys(data.scores).find(name => name !== playerName);
            const oppScore = data.scores[opponentNameKey];

            setPlayerScore(myScore);
            setOpponentScore(oppScore);

            setOpponentName(opponentNameKey);
          }
          setShowEndScreen(true);
        }
        if (data.event === 'game_round_wfp') {
          setWaitingForOpponent(true);
          setChoiceMade(true);
          setResult('Waiting for the other opponent to choose...');
        }
        if (data.event === 'chat_possibilty') {
          setShowDiscussionPrompt(true);
          setResult('');
        }
        if (data.event === 'chat_start') {
          setShowChat(true);

          // Închide vechiul chatSocket dacă e deja deschis
          if (chatSocketRef.current && chatSocketRef.current.readyState <= 1) {
            chatSocketRef.current.close();
          }

          const encodedName = encodeURIComponent(playerName);
          chatSocketRef.current = new WebSocket(`ws://localhost:8000/api/chat?player_name=${encodedName}`);

          chatSocketRef.current.onopen = () => {
            console.log('💬 Chat WebSocket connected');
          };

          chatSocketRef.current.onmessage = (event) => {
            const chatData = JSON.parse(event.data);
            setChatMessages(prev => [...prev, { from: chatData.from, message: chatData.message }]);
          };

          chatSocketRef.current.onclose = () => {
            console.log('❌ Chat WebSocket closed');
          };
        }
        if (data.event === 'chat_declined') {
          setResult("❌ Chat request declined.");
          setChoiceMade(false);
          setWaitingForOpponent(false);
          setShowDiscussionPrompt(false);
        }
      };
      socket.onclose = () => console.log('🛑 Game WebSocket closed');
    }, 300);

    return () => {
      clearTimeout(timeout);
      gameSocketRef.current?.close();
    };
  }, []);

  const handleChoice = (color) => {
    if (!gameSocketRef.current || choiceMade || round > 10) return;

    let content = null;

    switch (color) {
      case 'RED':
        content = "0"; // <-- string
        break;
      case 'BLUE':
        content = "1"; // <-- string
        break;
      default:
        console.warn('❌ Invalid color selected:', color);
        return;
    }

    console.log('📤 Sending WebSocket message:', { event: 'game_choice', content });

    setChoiceMade(true);
    setWaitingForOpponent(true);
    setResult('Waiting for the other opponent to choose...');

    gameSocketRef.current.send(JSON.stringify({
      event: 'game_choice',
      content
    }));
  };

  const nextRound = () => {
    if (round === 4 || round === 8) {
      setShowDiscussionPrompt(true);
      return;
    }

    if (round < 10) {
      setRound(prev => prev + 1);
      setResult('');
      setChoiceMade(false);
      setWaitingForOpponent(false);
    } else {
      setShowEndScreen(true);
    }
  };


  const nextRoundAfterChat = () => {
    if (round < 10) {
      setRound(prev => prev + 1);
      setResult('');
      setChoiceMade(false);
      setPlayerWantsChat(null);
      setOpponentWantsChat(null);
      setShowDiscussionPrompt(false);
      setShowChat(false);
    } else {
      setShowEndScreen(true);
    }
  };

  const handleDiscussionChoice = (playerChoice) => {
    const payload = {
      event: playerChoice ? "chat_accept" : "chat_decline"
    };

    console.log("📤 Sending chat decision:", payload);
    gameSocketRef.current.send(JSON.stringify(payload));

    setShowDiscussionPrompt(false);
    setChoiceMade(true);
    setWaitingForOpponent(true);
    setResult("Waiting for opponent response...");
  };

  const sendMessage = () => {
    if (
      message.trim() &&
      chatSocketRef.current &&
      chatSocketRef.current.readyState === WebSocket.OPEN
    ) {
      chatSocketRef.current.send(JSON.stringify({ message }));
      setChatMessages(prev => [...prev, { from: playerName, message }]);
      setMessage('');
    }
    if (!showChat) {
      console.warn("⛔ You can't send messages, chat is closed.");
      return;
    }
  };

  const closeChat = () => {
    if (chatSocketRef.current && chatSocketRef.current.readyState === WebSocket.OPEN) {
      chatSocketRef.current.close();
    }
    chatSocketRef.current = null;
    setShowChat(false);
  };

  return (
    <div className="game-container">
      <div className="top-bar">
        <div className="game-code-banner">
          Game Code: <span className="game-code" onClick={() => {
            navigator.clipboard.writeText(gameCode);
            alert("Copied!");
          }}>{gameCode}</span>
        </div>
      </div>
      <div className="round-history">
        <h3>📜 Round History</h3>
        <ul>
          {roundHistory.map((entry, i) => {
            const colorNames = ['🔴 RED', '🔵 BLUE'];
            return (
              <li key={i}>
                <strong>Round {entry.round}:</strong> You chose {colorNames[entry.myChoice]}, 
                Opponent chose {colorNames[entry.opponentChoice]}, 
                Score: {entry.myScore >= 0 ? `+${entry.myScore}` : entry.myScore}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="scoreboard">
        <div className="player1">{myName || 'You'}: {playerScore}</div>
        <div className="player2">{opponentName || 'Waiting...'}: {opponentScore}</div>
      </div>
          {!showEndScreen && (
        <>
          <h2 className="round">Round {round} / 10</h2>

          {showDiscussionPrompt ? (
            <div className="discussion-prompt">
              <p>🤝 Do you want to discuss with your opponent?</p>
              <div className="discussion-buttons">
                <button className="yes-btn" onClick={() => handleDiscussionChoice(true)}>✅ Yes</button>
                <button className="no-btn" onClick={() => handleDiscussionChoice(false)}>❌ No</button>
              </div>
            </div>
          ) : !choiceMade ? (
            <div className="choices">
              <button className="red-btn" onClick={() => handleChoice('RED')}>🔴 RED</button>
              <button className="blue-btn" onClick={() => handleChoice('BLUE')}>🔵 BLUE</button>
            </div>
          ) : (
            <div className="result">
              <p>{result}</p>
            </div>
          )}

          {showChat && (
            <div className="chat-box">
              <div className="chat-messages">
                {chatMessages.map((msg, index) => (
                  <p key={index}><strong>{msg.from}:</strong> {msg.message}</p>
                ))}
              </div>
              <input
                type="text"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button onClick={sendMessage}>📨 Send</button>
              <button onClick={closeChat}>🛑 Stop Discussion</button>
            </div>
          )}
        </>
      )}
      {showEndScreen && (
        <div className="end-screen">
          <h2>🏁 Final Results</h2>
          <p>You: {playerScore} {playerScore > 0 ? '🏆 Winner!' : '❌ Lost'}</p>
          <p>Opponent: {opponentScore} {opponentScore > 0 ? '🏆 Winner!' : '❌ Lost'}</p>
          <button className="next-btn" onClick={() => window.location.href = '/'}>
            🏠 Back to Home
          </button>
        </div>
      )}
    </div>
  );
}

export default GamePage;
