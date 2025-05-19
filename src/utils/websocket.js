export function openGameSocket(gameCode, playerName) {
    const url = `${import.meta.env.VITE_WS_URL}/api/ws/${gameCode}` +
      `?player_name=${encodeURIComponent(playerName)}`;
    const ws = new WebSocket(url);
    return ws;
  }
  
  export function openChatSocket(gameCode, playerName) {
    const url = `${import.meta.env.VITE_WS_URL}/api/chat/${gameCode}` +
      `?player_name=${encodeURIComponent(playerName)}`;
    return new WebSocket(url);
  }