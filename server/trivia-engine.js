const QUESTION_DURATION = 15;
const REVEAL_DURATION = 5;
const ROUND_COMPLETE_DURATION = 5;
const TOTAL_QUESTIONS = 10;

const QUESTION_BANK = [
  { q: "What planet is known as the Red Planet?", o: ["Venus", "Mars", "Jupiter", "Saturn"], c: 1 },
  { q: "What is the largest ocean on Earth?", o: ["Atlantic", "Indian", "Arctic", "Pacific"], c: 3 },
  { q: "Who painted the Mona Lisa?", o: ["Michelangelo", "Da Vinci", "Raphael", "Rembrandt"], c: 1 },
  { q: "What is the smallest country in the world?", o: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"], c: 1 },
  { q: "How many bones are in the adult human body?", o: ["186", "206", "226", "256"], c: 1 },
  { q: "What element has the chemical symbol 'O'?", o: ["Gold", "Osmium", "Oxygen", "Oganesson"], c: 2 },
  { q: "Which language has the most native speakers?", o: ["English", "Hindi", "Spanish", "Mandarin"], c: 3 },
  { q: "What year did the Titanic sink?", o: ["1905", "1912", "1918", "1923"], c: 1 },
  { q: "What is the hardest natural substance?", o: ["Titanium", "Quartz", "Diamond", "Sapphire"], c: 2 },
  { q: "Which country hosted the 2016 Summer Olympics?", o: ["China", "UK", "Brazil", "Japan"], c: 2 },
  { q: "What gas do plants absorb from the atmosphere?", o: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], c: 2 },
  { q: "Who wrote 'Romeo and Juliet'?", o: ["Dickens", "Shakespeare", "Austen", "Hemingway"], c: 1 },
  { q: "What is the capital of Australia?", o: ["Sydney", "Melbourne", "Canberra", "Brisbane"], c: 2 },
  { q: "How many sides does a hexagon have?", o: ["5", "6", "7", "8"], c: 1 },
  { q: "What is the speed of light (approx)?", o: ["300 km/s", "3,000 km/s", "30,000 km/s", "300,000 km/s"], c: 3 },
  { q: "Which planet has the most moons?", o: ["Jupiter", "Saturn", "Uranus", "Neptune"], c: 1 },
  { q: "What is the largest mammal?", o: ["Elephant", "Blue Whale", "Giraffe", "Hippo"], c: 1 },
  { q: "In which year did World War II end?", o: ["1943", "1944", "1945", "1946"], c: 2 },
  { q: "What is the currency of Japan?", o: ["Yuan", "Won", "Yen", "Ringgit"], c: 2 },
  { q: "Who discovered penicillin?", o: ["Pasteur", "Fleming", "Curie", "Darwin"], c: 1 },
  { q: "What is the tallest mountain in the world?", o: ["K2", "Kangchenjunga", "Everest", "Lhotse"], c: 2 },
  { q: "Which planet is closest to the Sun?", o: ["Venus", "Mercury", "Mars", "Earth"], c: 1 },
  { q: "How many continents are there?", o: ["5", "6", "7", "8"], c: 2 },
  { q: "What does 'HTTP' stand for?", o: ["HyperText Transfer Protocol", "High Tech Transfer Protocol", "HyperText Transmission Process", "Home Tool Transfer Protocol"], c: 0 },
  { q: "Which animal is known as the 'King of the Jungle'?", o: ["Tiger", "Lion", "Elephant", "Gorilla"], c: 1 },
  { q: "What is the boiling point of water in Celsius?", o: ["90°C", "95°C", "100°C", "110°C"], c: 2 },
  { q: "Who was the first person to walk on the Moon?", o: ["Buzz Aldrin", "Neil Armstrong", "Yuri Gagarin", "John Glenn"], c: 1 },
  { q: "What is the chemical formula for water?", o: ["HO2", "H2O", "OH", "H2O2"], c: 1 },
  { q: "Which organ pumps blood through the body?", o: ["Brain", "Lungs", "Heart", "Liver"], c: 2 },
  { q: "What is the longest river in the world?", o: ["Amazon", "Nile", "Mississippi", "Yangtze"], c: 1 },
];

export function createTriviaState({ players, rng }) {
  const playerIds = players.map((p) => p.id);
  const scores = new Map();
  playerIds.forEach((id) => scores.set(id, 0));

  const shuffled = [...QUESTION_BANK].sort(() => rng() - 0.5);
  const questions = shuffled.slice(0, TOTAL_QUESTIONS);

  return {
    gameType: "trivia",
    status: "question",
    playerIds,
    questions,
    questionIndex: 0,
    answers: new Map(),
    scores,
    timer: QUESTION_DURATION,
    questionStartTime: Date.now(),
    triviaRound: 1,
    roundStartScores: new Map(scores),
    roundWinnerId: null,
  };
}

export function handleTriviaAction(state, playerId, action) {
  if (action.kind === "answer") {
    return submitAnswer(state, playerId, action.index);
  }
  return state;
}

function submitAnswer(state, playerId, index) {
  if (state.status !== "question") return state;
  if (typeof index !== "number" || index < 0 || index > 3) return state;
  if (state.answers.has(playerId)) return state;

  const answers = new Map(state.answers);
  answers.set(playerId, { index, timestamp: Date.now() });
  return { ...state, answers };
}

export function allAnswered(state) {
  return state.answers.size >= state.playerIds.length;
}

export function revealTrivia(state) {
  const current = state.questions[state.questionIndex];
  const scores = new Map(state.scores);

  state.answers.forEach(({ index, timestamp }, playerId) => {
    if (index === current.c) {
      const elapsed = (timestamp - state.questionStartTime) / 1000;
      const remaining = Math.max(0, QUESTION_DURATION - elapsed);
      const points = Math.max(100, Math.ceil((remaining / QUESTION_DURATION) * 1000));
      scores.set(playerId, (scores.get(playerId) || 0) + points);
    }
  });

  return { ...state, status: "reveal", scores, timer: REVEAL_DURATION };
}

export function nextTriviaQuestion(state) {
  const nextIndex = state.questionIndex + 1;

  // All questions in this round answered — compute round winner
  if (nextIndex >= state.questions.length) {
    let maxGain = 0;
    let winnerId = null;
    state.scores.forEach((score, id) => {
      const start = state.roundStartScores?.get(id) || 0;
      const gain = score - start;
      if (gain > maxGain) {
        maxGain = gain;
        winnerId = id;
      }
    });
    return {
      ...state,
      status: "round_complete",
      roundWinnerId: winnerId,
      timer: ROUND_COMPLETE_DURATION,
    };
  }

  return {
    ...state,
    status: "question",
    questionIndex: nextIndex,
    answers: new Map(),
    timer: QUESTION_DURATION,
    questionStartTime: Date.now(),
  };
}

export function nextTriviaRound(state, rng) {
  const shuffled = [...QUESTION_BANK].sort(() => rng() - 0.5);
  const questions = shuffled.slice(0, TOTAL_QUESTIONS);

  return {
    ...state,
    status: "question",
    questions,
    questionIndex: 0,
    answers: new Map(),
    timer: QUESTION_DURATION,
    questionStartTime: Date.now(),
    triviaRound: (state.triviaRound || 1) + 1,
    roundStartScores: new Map(state.scores),
    roundWinnerId: null,
  };
}

export function tickTrivia(state) {
  if (state.timer <= 0) return state;
  return { ...state, timer: state.timer - 1 };
}

export function serializeTrivia(state) {
  const current = state.questions[state.questionIndex];
  const result = {
    gameType: "trivia",
    status: state.status,
    questionIndex: state.questionIndex,
    totalQuestions: state.questions.length,
    question: current.q,
    options: current.o,
    timer: state.timer,
    scores: Object.fromEntries(state.scores),
    answerCount: state.answers.size,
    playerCount: state.playerIds.length,
    triviaRound: state.triviaRound || 1,
    roundWinnerId: state.roundWinnerId,
  };

  if (state.status === "reveal") {
    result.correctIndex = current.c;
    result.answers = {};
    state.answers.forEach(({ index }, playerId) => {
      result.answers[playerId] = index;
    });
  }

  return result;
}
