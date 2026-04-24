import { useEffect } from 'react';
import './UndoToast.css';

// A small toast at the bottom that auto-dismisses after 5s, with an Undo button
export default function UndoToast({ message, onUndo, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="undo-toast" role="status">
      <span className="undo-toast-msg">{message}</span>
      <button
        className="undo-toast-btn"
        onClick={() => { onUndo(); onClose(); }}
      >
        Undo
      </button>
    </div>
  );
}
