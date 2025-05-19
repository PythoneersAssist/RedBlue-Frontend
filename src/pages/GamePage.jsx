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

        if (data.event === 'game_player_join') {
          if (data.player_name !== playerName) {
            setOpponentName(data.player_name);
          }
        }
        if (data.event === 'game_reconnection_token') {
          localStorage.setItem('reconnection_token', data.reconnection_token);
        } else if (data.event === 'game_round_over') {
          const index = data.index;
          const opponentIndex = index === 0 ? 1 : 0;

          setMyIndex(index);
          setPlayerScore(data.score[index]);
          setOpponentScore(data.score[opponentIndex]);

          setMyName(playerName);
          setOpponentName((prev) => prev || `Player ${opponentIndex + 1}`);

          setResult(`You chose ${data.choice[index]} and opponent chose ${data.choice[opponentIndex]}`);
          setWaitingForOpponent(false);
          setChoiceMade(true);

          setTimeout(() => nextRound(), 4000);
        } else if (data.event === 'game_over') {
          setShowEndScreen(true);
        } else if (data.event === 'game_round_wfp') {
          setWaitingForOpponent(true);
          setChoiceMade(true);
          setResult('Waiting for the other opponent to choose...');
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
    const opponentChoice = Math.random() < 0.5;
    setPlayerWantsChat(playerChoice);
    setOpponentWantsChat(opponentChoice);
    setShowDiscussionPrompt(false);

    if (playerChoice && opponentChoice) {
      setShowChat(true);
      setChoiceMade(true);

      const chatSocket = new WebSocket(`ws://localhost:8000/api/chat/${gameCode}?player_name=${playerName}`);
      chatSocketRef.current = chatSocket;

      chatSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.event === "chat_message") {
          setChatMessages(prev => [...prev, { from: data.player, message: data.content }]);
        }
      };

      chatSocket.onclose = () => console.log('🛑 Chat WebSocket closed');
      return;
    }

    setResult(`Opponent chose ${opponentChoice ? '✅ YES' : '❌ NO'}. No discussion.`);
    setTimeout(() => {
      setShowChat(false);
      nextRoundAfterChat();
    }, 2000);
  };

  const sendMessage = () => {
    if (chatSocketRef.current && message.trim()) {
      chatSocketRef.current.send(JSON.stringify({
        event: "chat_message",
        content: message
      }));
      setChatMessages(prev => [...prev, { from: playerName, message }]);
      setMessage('');
    }
  };

  const closeChat = () => {
    chatSocketRef.current?.close();
    setShowChat(false);
    nextRoundAfterChat();
  };

  return (
    <div className="game-container">
      <div className="scoreboard">
        <div>{myName || 'You'}: {playerScore}</div>
        <div>{opponentName || 'Waiting...'}: {opponentScore}</div>
      </div>
      {!showEndScreen && (
        <>
          <h2 className="round">Round {round} / 10</h2>

          {!choiceMade ? (
            <div className="choices">
              <button className="red-btn" onClick={() => handleChoice('RED')}>🔴 RED</button>
              <button className="blue-btn" onClick={() => handleChoice('BLUE')}>🔵 BLUE</button>
            </div>
          ) : (
            <div className="result">
              <p>{result}</p>
            </div>
          )}

          {showDiscussionPrompt && (
            <div className="discussion-box">
              <p>🗣️ Do you want to discuss with your opponent?</p>
              <button onClick={() => handleDiscussionChoice(true)}>✅ Yes</button>
              <button onClick={() => handleDiscussionChoice(false)}>❌ No</button>
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
          <p>🧑 You: {playerScore} {playerScore > opponentScore ? '🏆 Winner!' : '❌ Lost'}</p>
          <p>👤 Opponent: {opponentScore} {opponentScore > playerScore ? '🏆 Winner!' : '❌ Lost'}</p>
          <button className="next-btn" onClick={() => window.location.href = '/'}>
            🏠 Back to Home
          </button>
        </div>
      )}
    </div>
  );
}

export default GamePage;
