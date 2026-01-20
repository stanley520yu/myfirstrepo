const container = document.querySelector("[data-ui='stage']");
let cards = [];
let names = [];

function buildGrid(list) {
  container.innerHTML = "";
  names = list.map((item) => item.name);
  const stage = document.createElement("div");
  stage.className = "flip-stage";
  const grid = document.createElement("div");
  grid.className = "flip-grid";
  cards = [];
  const total = 12;
  for (let i = 0; i < total; i += 1) {
    const card = document.createElement("div");
    card.className = "flip-card";
    const inner = document.createElement("div");
    inner.className = "flip-inner";
    const front = document.createElement("div");
    front.className = "flip-front";
    front.textContent = "翻牌中";
    const back = document.createElement("div");
    back.className = "flip-back";
    back.textContent = names[i % names.length] || `候选${i + 1}`;
    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);
    grid.appendChild(card);
    cards.push({ card, back });
  }
  stage.appendChild(grid);
  container.appendChild(stage);
}

export const LotteryStage = {
  init(state) {
    buildGrid(state.participants);
  },
  onParticipantsUpdate(list) {
    buildGrid(list);
  },
  async startAnimation() {
    cards.forEach(({ card }) => card.classList.remove("reveal"));
    return new Promise((resolve) => setTimeout(resolve, 1200));
  },
  async showWinners(winners) {
    winners.forEach((winner, index) => {
      const item = cards[index % cards.length];
      if (!item) return;
      item.back.textContent = `${winner.name}${winner.id ? `(${winner.id})` : ""}`;
      item.card.classList.add("reveal");
    });
    return Promise.resolve();
  },
  reset() {
    cards.forEach(({ card }) => card.classList.remove("reveal"));
  },
};

window.LotteryStage = LotteryStage;
