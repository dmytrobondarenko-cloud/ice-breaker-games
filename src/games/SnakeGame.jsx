import { useMemo } from "react";

export default function SnakeGame({ game, room, me, send }) {
  const snakeCells = useMemo(() => {
    const map = new Map();
    if (!game?.snakes) return map;
    game.snakes.forEach((snake) => {
      snake.body.forEach((segment, index) => {
        const key = `${segment.x},${segment.y}`;
        map.set(key, { color: snake.color, head: index === 0, alive: snake.alive });
      });
    });
    return map;
  }, [game]);

  const boardCells = useMemo(() => {
    if (!game) return [];
    const cells = [];
    for (let y = 0; y < game.rows; y += 1) {
      for (let x = 0; x < game.cols; x += 1) {
        const key = `${x},${y}`;
        const sc = snakeCells.get(key);
        let className = "cell";
        let style = undefined;
        if (sc) {
          className += " snake";
          if (sc.head) className += " head";
          if (!sc.alive) className += " dead";
          style = { background: sc.color };
        }
        if (game.food && key === `${game.food.x},${game.food.y}`) className += " food";
        cells.push(<div key={key} className={className} style={style} />);
      }
    }
    return cells;
  }, [game, snakeCells]);

  const isHost = room?.hostId === me.id;
  const roundOver = game?.status === "gameover" || game?.status === "win";

  const statusLabel = (() => {
    if (game?.status === "gameover") return "Round Over!";
    if (game?.status === "win") return "Board Full — Round Over!";
    return "Use arrow keys or WASD";
  })();

  return (
    <>
      <main className="stage">
        <div className="board" style={{ gridTemplateColumns: `repeat(${game?.cols || 20}, 1fr)` }}>
          {boardCells}
        </div>
        <div className="panel">
          <div className="status" aria-live="polite">{statusLabel}</div>
          {isHost && roundOver && (
            <div className="actions">
              <button type="button" onClick={() => send({ type: "restart" })}>
                Next Round
              </button>
            </div>
          )}
          <Scoreboard game={game} room={room} />
        </div>
      </main>
      <section className="controls" aria-label="On-screen controls">
        <div className="controls-row">
          <button type="button" onClick={() => send({ type: "input", dir: "UP" })}>Up</button>
        </div>
        <div className="controls-row">
          <button type="button" onClick={() => send({ type: "input", dir: "LEFT" })}>Left</button>
          <button type="button" onClick={() => send({ type: "input", dir: "DOWN" })}>Down</button>
          <button type="button" onClick={() => send({ type: "input", dir: "RIGHT" })}>Right</button>
        </div>
      </section>
    </>
  );
}

function Scoreboard({ game, room }) {
  if (!room) return null;
  const sorted = room.players
    .map((p) => {
      const snake = game?.snakes?.find((s) => s.id === p.id);
      return {
        ...p,
        score: snake?.score ?? 0,
        alive: snake?.alive ?? true,
        roundWins: room.roundWins?.[p.id] || 0,
      };
    })
    .sort((a, b) => b.roundWins - a.roundWins || b.score - a.score);

  return (
    <div className="players">
      {sorted.map((p) => (
        <div key={p.id} className="player">
          <span className="swatch" style={{ background: p.color }} />
          <span>{p.name}</span>
          <span>{p.score} pts</span>
          <span>{p.roundWins} {p.roundWins === 1 ? "round" : "rounds"} won</span>
          {!p.alive && game?.status !== "waiting" ? <span>✕</span> : null}
          {room.hostId === p.id ? <span>★</span> : null}
        </div>
      ))}
    </div>
  );
}
