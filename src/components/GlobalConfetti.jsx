import { useHabits } from '../context/HabitContext.jsx'; // gives us the global confettiActive flag
import Confetti from './Confetti.jsx';                   // fullscreen overlay component

// Tiny wrapper component that reads the global flag and renders Confetti accordingly
export default function GlobalConfetti() {
  const { confettiActive } = useHabits(); // read the flag from context
  return <Confetti active={confettiActive} />; // render the overlay
}
