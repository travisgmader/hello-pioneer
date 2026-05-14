export const MOTIVATIONAL_PHRASES = [
  'Fall in love with the journey.',
  'The only bad workout is the one that didn\'t happen.',
  'Show up. Do the work. Repeat.',
  'Strength is built one rep at a time.',
  'Progress, not perfection.',
  'Every set is a promise kept to yourself.',
  'The body achieves what the mind believes.',
  'Iron sharpens iron.',
  'Earn your rest.',
  'Small steps still move you forward.',
  'Discipline is freedom.',
  'The hardest part is showing up.',
  'You are stronger than yesterday.',
  'Chase the feeling, not the numbers.',
  'Consistency compounds.',
  'Embrace the grind.',
  'Pain is temporary. Pride is permanent.',
  'Do it for the person you\'re becoming.',
  'Make it count.',
  'One more rep. One more day. One more version of you.',
]

export function getPhraseForWorkout(historyLength) {
  return MOTIVATIONAL_PHRASES[historyLength % MOTIVATIONAL_PHRASES.length]
}
