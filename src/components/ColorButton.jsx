import React from 'react';
export default function ColorButton({ color, onClick, disabled }) {
  const bg = color === 'RED' ? 'bg-red-500' : 'bg-blue-500';
  return (
    <button
      className={`${bg} text-white font-bold py-2 px-4 rounded disabled:opacity-50`}
      onClick={() => onClick(color)}
      disabled={disabled}
    >{color}</button>
  );
}
