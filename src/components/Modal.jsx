import React from 'react';
export default function Modal({ title, children, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow-lg">
        <h2 className="text-xl mb-4">{title}</h2>
        <div className="mb-4">{children}</div>
        <div className="flex justify-end">
          <button onClick={onCancel} className="btn mr-2">Cancel</button>
          <button onClick={onConfirm} className="btn btn-blue">Yes</button>
        </div>
      </div>
    </div>
  );
}