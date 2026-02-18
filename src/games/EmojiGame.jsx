import { useState } from "react";

export default function EmojiGame({ game, room, me, send }) {
  const [emojiInput, setEmojiInput] = useState("");
  const [guessInput, setGuessInput] = useState("");

  if (!game) return null;

  const isStoryteller = me.id === game.storytellerId;
  const storytellerName = room?.players.find((p) => p.id === game.storytellerId)?.name || "Someone";
  const roundWinnerName = game.roundWinnerId
    ? room?.players.find((p) => p.id === game.roundWinnerId)?.name
    : null;

  const handleSubmitEmojis = () => {
    if (emojiInput.trim().length === 0) return;
    send({ type: "gameAction", action: { kind: "submitEmojis", emojis: emojiInput } });
    setEmojiInput("");
  };

  const handleGuess = () => {
    if (guessInput.trim().length === 0) return;
    send({ type: "gameAction", action: { kind: "guess", text: guessInput } });
    setGuessInput("");
  };

  const playerName = (id) => room?.players.find((p) => p.id === id)?.name || "?";

  return (
    <main className="game-stage">
      <div className="game-header">
        <span>Emoji Storytelling</span>
        <span>Round {game.round}</span>
        <span className="voting-timer">{game.timer}s</span>
      </div>

      {game.status === "composing" && isStoryteller && (
        <div className="panel">
          <div className="status">
            Describe with emojis only: <strong>{game.prompt?.text}</strong>
            {" "}({game.promptCategory})
          </div>
          <label className="field">
            <span>Your Emojis</span>
            <input
              value={emojiInput}
              onChange={(e) => setEmojiInput(e.target.value)}
              placeholder="Type emojis..."
              maxLength={30}
            />
          </label>
          <div className="actions">
            <button type="button" onClick={handleSubmitEmojis}>Send Emojis</button>
          </div>
        </div>
      )}

      {game.status === "composing" && !isStoryteller && (
        <div className="panel">
          <div className="status">{storytellerName} is picking emojis ({game.promptCategory})...</div>
        </div>
      )}

      {game.status === "guessing" && (
        <div className="panel">
          <div className="emoji-display">{game.emojis}</div>
          {!isStoryteller && (
            <div className="guess-row">
              <input
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                placeholder="Type your guess..."
                maxLength={200}
                onKeyDown={(e) => e.key === "Enter" && handleGuess()}
              />
              <button type="button" onClick={handleGuess}>Guess</button>
            </div>
          )}
          {isStoryteller && (
            <div className="status">Players are guessing...</div>
          )}
          <div className="guess-feed">
            {game.guesses.map((g, i) => (
              <div key={i} className={`guess-item ${g.correct ? "guess-correct" : ""}`}>
                <strong>{playerName(g.playerId)}:</strong> {g.text}
                {g.correct && " ✓"}
              </div>
            ))}
          </div>
        </div>
      )}

      {game.status === "reveal" && (
        <div className="panel">
          <div className="emoji-display">{game.emojis}</div>
          <div className="status">The answer was: <strong>{game.answer}</strong></div>
          {roundWinnerName && (
            <div className="status round-winner">Round winner: {roundWinnerName}</div>
          )}
        </div>
      )}

      <Scoreboard game={game} room={room} />
    </main>
  );
}

function Scoreboard({ game, room }) {
  if (!game?.scores || !room) return null;
  const sorted = room.players
    .map((p) => ({
      ...p,
      score: game.scores[p.id] || 0,
      roundWins: room.roundWins?.[p.id] || 0,
    }))
    .sort((a, b) => b.roundWins - a.roundWins || b.score - a.score);

  return (
    <div className="panel">
      <div className="players">
        {sorted.map((p) => (
          <div key={p.id} className="player">
            <span className="swatch" style={{ background: p.color }} />
            <span>{p.name}</span>
            <span>{p.score} pts</span>
            <span>{p.roundWins} {p.roundWins === 1 ? "round" : "rounds"} won</span>
          </div>
        ))}
      </div>
    </div>
  );
}
