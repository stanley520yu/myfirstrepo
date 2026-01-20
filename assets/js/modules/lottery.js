import { randomInt } from "./crypto.js";

export function createLotteryState({ participants, results }) {
  return {
    pool: [...participants],
    participants: [...participants],
    results: [...results],
  };
}

export function drawWinners(state, count, allowRepeat) {
  const winners = [];
  if (!state.participants.length) {
    return winners;
  }
  if (allowRepeat) {
    const actualCount = Math.min(count, state.participants.length || 0);
    for (let i = 0; i < actualCount; i += 1) {
      const index = randomInt(state.participants.length);
      winners.push(state.participants[index]);
    }
  } else {
    const available = state.pool;
    const actualCount = Math.min(count, available.length || 0);
    for (let i = 0; i < actualCount; i += 1) {
      const index = randomInt(available.length);
      const [picked] = available.splice(index, 1);
      winners.push(picked);
    }
  }
  return winners;
}

export function undoLastDraw(state, drawCount, allowRepeat) {
  if (!state.results.length) return [];
  const removed = state.results.splice(-drawCount, drawCount);
  if (!allowRepeat) {
    const restored = removed.map((entry) => entry.participant);
    state.pool.push(...restored);
  }
  return removed;
}
