import React from 'react';
import './RulesModal.css';

function RulesModal({ onClose }) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2 className="modal-title">How to Play RED + BLUE</h2>
        <ul className="modal-list">
          <li>🎯 Each game has 10 rounds.</li>
          <li>🟥 You choose between RED or BLUE each round.</li>
          <li>💥 Points depend on both players' choices:</li>
          <ul>
            <li>RED + RED = +3 / +3</li>
            <li>RED + BLUE = -6 / +6</li>
            <li>BLUE + RED = +6 / -6</li>
            <li>BLUE + BLUE = -3 / -3</li>
          </ul>
          <li>🗣️ After rounds 4 & 8, players can chat if both agree.</li>
          <li>🔥 Rounds 9 & 10 are DOUBLE POINTS.</li>
          <li>🚪 You can leave anytime — but that means you lose!</li>
        </ul>
        <button className="close-btn" onClick={onClose}>❌ Close</button>
      </div>
    </div>
  );
}

export default RulesModal;
