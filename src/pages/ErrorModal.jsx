import React from "react";
import "./ErrorModal.css";

function ErrorModal({ message, onClose }) {
    return (
        <div className="error-modal">
        <div className="error-modal-content">
            <div className="title-error">Error</div>
            <p>{message}</p>
        </div>
        </div>
    );
}

export default ErrorModal;