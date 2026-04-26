// ===========================================================================
// UndoToast.jsx — A small bottom-of-screen notification with an Undo button.
// It auto-dismisses after 5 seconds. Shown after the user marks a habit done.
// ===========================================================================

// useEffect is a Hook that runs side-effects (timers, fetches, subscriptions)
// AFTER the component has rendered. Perfect for setting up our auto-dismiss timer.
import { useEffect } from 'react';
// Import the toast's own styles (animation, colors, position).
import './UndoToast.css';

// Props:
//   message: string to show inside the toast.
//   onUndo:  function called when the user clicks Undo.
//   onClose: function the parent gave us to remove the toast.
export default function UndoToast({ message, onUndo, onClose }) {
  // useEffect takes a setup function and (optionally) a "dependency array".
  // It runs:
  //   - After the first render.
  //   - Again every time something in the dependency array changes.
  // The function we RETURN is the cleanup, called before the next run or unmount.
  useEffect(() => {
    // Schedule onClose() to fire 5,000 ms (5 seconds) from now.
    const t = setTimeout(onClose, 5000);
    // Cleanup: if the toast disappears earlier, cancel the pending timer
    // so we don't accidentally call onClose twice.
    return () => clearTimeout(t);
  }, [onClose]); // Re-run only if the onClose function reference changes.

  // The visible toast UI.
  return (
    // role="status" tells screen readers this is a polite live update.
    <div className="undo-toast" role="status">
      {/* Display the message text passed in by the parent. */}
      <span className="undo-toast-msg">{message}</span>
      {/* When clicked: undo the action AND close the toast. */}
      <button
        className="undo-toast-btn"
        onClick={() => { onUndo(); onClose(); }}
      >
        Undo
      </button>
    </div>
  );
}
