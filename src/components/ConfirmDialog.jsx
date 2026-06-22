import React from 'react';

export default function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: '400px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', marginTop: 0 }}>{title}</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>{message}</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button 
            type="button" 
            className="btn" 
            style={{ border: '1px solid var(--glass-border)', background: 'var(--color-surface)', color: 'var(--color-text-main)' }} 
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="btn" 
            style={{ background: 'var(--color-error)', color: 'white' }} 
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
