import React from 'react';

const Dialog = ({ show, title, message, onConfirm, onCancel }) => {
  if (!show) {
    return null;
  }

  return (
    <div style={dialogOverlayStyle}>
      <div style={dialogBoxStyle}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div style={dialogActionsStyle}>
          <button style={confirmButtonStyle} onClick={onConfirm}>Confirm</button>
          <button style={cancelButtonStyle} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// Styles for dialog
const dialogOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const dialogBoxStyle = {
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '8px',
  width: '300px',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
  textAlign: 'center',
};

const dialogActionsStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: '20px',
};

const confirmButtonStyle = {
  backgroundColor: 'red',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  cursor: 'pointer',
  borderRadius: '4px',
};

const cancelButtonStyle = {
  backgroundColor: 'gray',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  cursor: 'pointer',
  borderRadius: '4px',
};

export default Dialog;
