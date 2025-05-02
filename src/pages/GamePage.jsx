import React, { useState, useEffect, useRef } from 'react';
import './GamePage.css';
import { useNavigate, useLocation } from 'react-router-dom';

function GamePage() {
  const [round, setRound] = useState(1);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [result, setResult] = useState('');
  const [choiceMade, setChoiceMade] = useState(false);

  const [showDiscussionPrompt, setShowDiscussionPrompt] = useState(false);
  const [playerWantsChat, setPlayerWantsChat] = useState(null);
  const [opponentWantsChat, setOpponentWantsChat] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [showEndScreen, setShowEndScreen] = useState(false);

  const [wsConnected, setWsConnected] = useState(false);
  const socketRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const gameCode = params.get('code');
  const playerName = params.get('name');

  useEffect(() => {
    if (!gameCode || !playerName) return;
  
    const storedToken = localStorage.getItem('reconnection_token');
    let socketUrl = `ws://localhost:8000/api/ws/${gameCode}?player_name=${playerName}`;
    if (storedToken) {
      socketUrl += `&token=${storedToken}`;
    }
  
    console.log("🔗 Connecting to WebSocket:", socketUrl);
  
    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;
  
    socket.onopen = () => {
      console.log('✅ WebSocket connected');
      setWsConnected(true);
    };
  
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📩 WS message:', data);
  
        if (data.token) {
          localStorage.setItem('reconnection_token', data.token);
        }
  
        if (data.event === 'error') {
          alert(`Server error: ${data.error}`);
        }
  
        if (data.event === 'game_join_wfp') {
          setResult('Waiting for opponent to join...');
        }
  
        if (data.event === 'game_start') {
          setResult('Game has started! Choose a color.');
        }
        
        if (data.event === 'round_result') {
          const playerChoice = data.your_choice === 0 ? 'RED' : 'BLUE';
          const oppChoice = data.opponent_choice === 0 ? 'RED' : 'BLUE';
          const points = data.your_points;
        
          setResult(`You chose ${playerChoice}. Opponent chose ${oppChoice}. You ${points >= 0 ? 'gained' : 'lost'} ${Math.abs(points)} points.`);
          setPlayerScore((prev) => prev + data.your_points);
          setOpponentScore((prev) => prev + data.opponent_points);
          setChoiceMade(true);
        }

        if (data.event === 'game_round_over') {
          const myIndex = 0; // presupunem că jucătorul care a creat jocul e primul conectat
        
          const newMyScore = data.scores[myIndex];
          const newOppScore = data.scores[1 - myIndex];
        
          const myChoice = data.choices[myIndex] === "0" ? "RED" : "BLUE";
          const oppChoice = data.choices[1 - myIndex] === "0" ? "RED" : "BLUE";
        
          const myDelta = newMyScore - playerScore;
        
          console.log("🎯 scoruri:", newMyScore, newOppScore);
          console.log("🎯 alegeri:", myChoice, oppChoice);
        
          setResult(
            `You chose ${myChoice}, opponent chose ${oppChoice}. This round: ${myDelta >= 0 ? "+" : ""}${myDelta}`
          );
          setPlayerScore(newMyScore);
          setOpponentScore(newOppScore);
          setChoiceMade(true);
        }         
  
        if (data.event === 'game_round_start') {
          setRound(data.round);
          setChoiceMade(false);
          setResult(`Round ${data.round} has started. Make your choice.`);
        }
             
        
      } catch (err) {
        console.error('❌ Failed to parse WS message', event.data);
      }
    };
  
    socket.onerror = (err) => {
      console.error('❌ WebSocket error:', err);
    };
  
    socket.onclose = () => {
      console.log('🔌 WebSocket closed');
      setWsConnected(false);
    };
  
    return () => {
      socket.close();
    };
  }, [gameCode, playerName]);

  const handleChoice = (playerChoice) => {
    if (choiceMade || round > 10 || !wsConnected) return;
  
    const value = playerChoice === 'RED' ? 0 : 1;
    console.log('🔼 Sending choice:', value);
    socketRef.current?.send(JSON.stringify(value));
  };  

  const nextRound = () => {
    if (round === 4 || round === 8) {
      setShowDiscussionPrompt(true);
      return;
    }

    if (round < 10) {
      setRound(round + 1);
      setResult('');
      setChoiceMade(false);
    } else {
      setShowEndScreen(true);
    }
  };
  const nextRoundAfterChat = () => {
    if (round < 10) {
      setRound(round + 1);
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
      return;
    }

    if (!(playerChoice && opponentChoice)) {
      setResult(`Opponent chose ${opponentChoice ? '✅ YES' : '❌ NO'}. No discussion started.`);
      setTimeout(() => {
        setShowChat(false);
        nextRoundAfterChat();
      }, 2000);
    }    
  
    setTimeout(() => {
      setShowChat(false);
      nextRoundAfterChat();
    }, 1500);
  };

  const resetGame = () => {
    setRound(1);
    setPlayerScore(0);
    setOpponentScore(0);
    setResult('');
    setChoiceMade(false);
    setShowDiscussionPrompt(false);
    setPlayerWantsChat(null);
    setOpponentWantsChat(null);
    setShowChat(false);
    setShowEndScreen(false);
  };  

  return (
    <div className="game-container">
      <div className="scoreboard">
        <div>🧑 You: {playerScore}</div>
        <div>👤 Opponent: {opponentScore}</div>
      </div>

      {!wsConnected && <p>🔄 Connecting to server...</p>}

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
              {round <= 10 && !showDiscussionPrompt && !showChat && (
                <button className="next-btn" onClick={nextRound}>➡️ Next Round</button>
              )}
            </div>
          )}

          {/* Discusii, Chat, End screen – codul tău original */}

          {showDiscussionPrompt && (
            <div className="discussion-box">
              <p>🗣️ Do you want to discuss with your opponent?</p>
              <button onClick={() => handleDiscussionChoice(true)}>✅ Yes</button>
              <button onClick={() => handleDiscussionChoice(false)}>❌ No</button>
            </div>
          )}

          {showChat && (
            <div className="chat-box">
              <p>💬 Chat is open. (Simulated)</p>
              <button onClick={() => {
                setShowChat(false);
                nextRoundAfterChat();
              }}>🛑 Stop Discussion</button>
            </div>
          )}
        </>
      )}

      {showEndScreen && (
        <div className="end-screen">
          <h2>🏁 Final Results</h2>
          <p>🧑 You: {playerScore} {playerScore > 0 ? '🏆 Winner!' : '❌ Lost'}</p>
          <p>👤 Opponent: {opponentScore} {opponentScore > 0 ? '🏆 Winner!' : '❌ Lost'}</p>
          <button className="next-btn" onClick={resetGame}>
            🔁 Play Again
          </button>
          <button onClick={() => navigate('/')}>
            🏠 Back to Home
          </button>
        </div>
      )}
    </div>
  );
}

export default GamePage;
