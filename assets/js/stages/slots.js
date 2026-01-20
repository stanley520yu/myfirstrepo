const container = document.querySelector("[data-ui='stage']");
let reels = [];
let names = [];

function buildSlots(list) {
  container.innerHTML = "";
  names = list.map((item) => item.name);
  const stage = document.createElement("div");
  stage.className = "slot-stage";
  const reelsWrap = document.createElement("div");
  reelsWrap.className = "slot-reels";
  reels = [];
  for (let r = 0; r < 3; r += 1) {
    const reel = document.createElement("div");
    reel.className = "slot-reel";
    const column = document.createElement("div");
    column.className = "slot-column";
    const items = names.length ? names : ["幸运", "祝福", "好运"];
    const displayItems = [...items, ...items];
    displayItems.slice(0, 10).forEach((name) => {
      const item = document.createElement("div");
      item.className = "slot-item";
      item.textContent = name;
      column.appendChild(item);
    });
    reel.appendChild(column);
    reelsWrap.appendChild(reel);
    reels.push({ reel, column });
  }
  stage.appendChild(reelsWrap);
  container.appendChild(stage);
}

const LotteryStage = {
  init(state) {
    buildSlots(state.participants);
  },
  onParticipantsUpdate(list) {
    buildSlots(list);
  },
  async startAnimation({ prize }) {
    reels.forEach(({ reel }) => reel.classList.add("slot-spinning"));
    return new Promise((resolve) => setTimeout(resolve, 1600));
  },
  async showWinners(winners) {
    reels.forEach(({ reel }) => reel.classList.remove("slot-spinning"));
    winners.forEach((winner, index) => {
      const reel = reels[index % reels.length];
      if (!reel) return;
      reel.column.innerHTML = "";
      const item = document.createElement("div");
      item.className = "slot-item";
      item.textContent = `${winner.name}${winner.id ? `(${winner.id})` : ""}`;
      reel.column.appendChild(item);
    });
    return Promise.resolve();
  },
  reset() {
    buildSlots(names.map((name) => ({ name })));
  },
};

window.LotteryStage = LotteryStage;
