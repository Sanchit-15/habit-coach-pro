// 15+ motivational quotes — selected by date so it stays the same all day
export const quotes = [
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "You'll never change your life until you change something you do daily.", author: "John C. Maxwell" },
  { text: "Small habits, remarkable results.", author: "James Clear" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "The chains of habit are too light to be felt until they are too heavy to be broken.", author: "Warren Buffett" },
  { text: "First we make our habits, then our habits make us.", author: "John Dryden" },
  { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
  { text: "The secret of your future is hidden in your daily routine.", author: "Mike Murdock" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { text: "A year from now you may wish you had started today.", author: "Karen Lamb" },
  { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
  { text: "Great things are done by a series of small things brought together.", author: "Vincent Van Gogh" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Your habits will determine your future.", author: "Jack Canfield" },
];

// Pick a quote based on the day of the year so it changes daily but stays consistent
export function getQuoteOfTheDay() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff = Date.now() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return quotes[dayOfYear % quotes.length];
}
