import React from 'react';
export default function RoundInfo({ round, score1, score2 }) {
  return (
    <div className="flex justify-between mb-4">
      <span>Round: {round}/10</span>
      <span>Scores – You: {score1} Opponent: {score2}</span>
    </div>
  );
}