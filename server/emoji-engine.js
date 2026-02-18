const REVEAL_DURATION = 6;

const PROMPTS = [
  { text: "Jurassic Park", category: "Movie" },
  { text: "Star Wars", category: "Movie" },
  { text: "Titanic", category: "Movie" },
  { text: "The Lion King", category: "Movie" },
  { text: "Finding Nemo", category: "Movie" },
  { text: "Frozen", category: "Movie" },
  { text: "The Matrix", category: "Movie" },
  { text: "Toy Story", category: "Movie" },
  { text: "Jaws", category: "Movie" },
  { text: "Harry Potter", category: "Movie" },
  { text: "Spider-Man", category: "Movie" },
  { text: "Up", category: "Movie" },
  { text: "Ghostbusters", category: "Movie" },
  { text: "Home Alone", category: "Movie" },
  { text: "Back to the Future", category: "Movie" },
  { text: "Moon Landing", category: "Event" },
  { text: "Olympic Games", category: "Event" },
  { text: "World Cup Final", category: "Event" },
  { text: "New Years Eve", category: "Event" },
  { text: "Birthday Party", category: "Phrase" },
  { text: "Road Trip", category: "Phrase" },
  { text: "Broken Heart", category: "Phrase" },
  { text: "Under the Weather", category: "Phrase" },
  { text: "Piece of Cake", category: "Phrase" },
  { text: "Night Owl", category: "Phrase" },
  { text: "Brain Freeze", category: "Phrase" },
  { text: "Cold Feet", category: "Phrase" },
  { text: "Roller Coaster", category: "Phrase" },
  { text: "Treasure Hunt", category: "Phrase" },
  { text: "Camping Trip", category: "Phrase" },
];

export function createEmojiState({ players, rng }) {
  const playerIds = players.map((p) => p.id);
  const scores = new Map();
  playerIds.forEach((id) => scores.set(id, 0));

  const shuffled = [...PROMPTS].sort(() => rng() - 0.5);

  return {
    gameType: "emoji",
    status: "composing",
    playerIds,
    storytellerId: playerIds[0],
    prompt: shuffled[0],
    emojis: null,
    guesses: [],
    correctGuessers: [],
    scores,
    round: 1,
    timer: null,
    promptPool: shuffled,
    promptIndex: 0,
    roundWinnerId: null,
  };
}

export function handleEmojiAction(state, playerId, action) {
  switch (action.kind) {
    case "submitEmojis":
      return submitEmojis(state, playerId, action.emojis);
    case "guess":
      return submitEmojiGuess(state, playerId, action.text);
    default:
      return state;
  }
}

function submitEmojis(state, playerId, emojis) {
  if (state.status !== "composing") return state;
  if (playerId !== state.storytellerId) return state;

  const cleaned = String(emojis).trim().slice(0, 30);
  if (cleaned.length === 0) return state;

  return {
    ...state,
    status: "guessing",
    emojis: cleaned,
    guesses: [],
    correctGuessers: [],
  };
}

function submitEmojiGuess(state, playerId, text) {
  if (state.status !== "guessing") return state;
  if (playerId === state.storytellerId) return state;
  if (state.correctGuessers.includes(playerId)) return state;

  const guess = String(text).trim().slice(0, 200);
  if (guess.length === 0) return state;

  const answer = state.prompt.text.toLowerCase();
  const correct = guess.toLowerCase().includes(answer) || answer.includes(guess.toLowerCase());

  const guesses = [...state.guesses, { playerId, text: guess, correct }];
  const correctGuessers = correct
    ? [...state.correctGuessers, playerId]
    : state.correctGuessers;

  let scores = state.scores;
  if (correct) {
    scores = new Map(state.scores);
    const points = Math.max(1, 4 - correctGuessers.length);
    scores.set(playerId, (scores.get(playerId) || 0) + points);
    scores.set(state.storytellerId, (scores.get(state.storytellerId) || 0) + 1);
  }

  return { ...state, guesses, correctGuessers, scores };
}

export function allEmojiGuessersCorrect(state) {
  const guessers = state.playerIds.filter((id) => id !== state.storytellerId);
  return guessers.length > 0 && guessers.every((id) => state.correctGuessers.includes(id));
}

export function tickEmoji(state) {
  if (state.timer == null || state.timer <= 0) return state;
  return { ...state, timer: state.timer - 1 };
}

export function revealEmoji(state) {
  const roundWinnerId = state.correctGuessers.length > 0 ? state.correctGuessers[0] : null;
  return { ...state, status: "reveal", timer: REVEAL_DURATION, roundWinnerId };
}

export function nextEmojiRound(state, rng) {
  const nextIndex = state.round % state.playerIds.length;
  const promptIndex = state.round % state.promptPool.length;

  return {
    ...state,
    status: "composing",
    storytellerId: state.playerIds[nextIndex],
    prompt: state.promptPool[promptIndex],
    emojis: null,
    guesses: [],
    correctGuessers: [],
    round: state.round + 1,
    timer: null,
    promptIndex,
    roundWinnerId: null,
  };
}

export function serializeEmoji(state, forPlayerId) {
  const result = {
    gameType: "emoji",
    status: state.status,
    storytellerId: state.storytellerId,
    emojis: state.emojis,
    guesses: state.guesses,
    round: state.round,
    timer: state.timer,
    scores: Object.fromEntries(state.scores),
    promptCategory: state.prompt?.category || null,
    roundWinnerId: state.roundWinnerId,
  };

  if (forPlayerId === state.storytellerId) {
    result.prompt = state.prompt;
  }

  if (state.status === "reveal") {
    result.answer = state.prompt.text;
  }

  return result;
}
