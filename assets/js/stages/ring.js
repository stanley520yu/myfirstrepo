const container = document.querySelector("[data-ui='stage']");
let track;
let winnerBox;
let currentNames = [];

function buildRing(names) {
  container.innerHTML = "";
  const stage = document.createElement("div");
  stage.className = "ring-stage";
  track = document.createElement("div");
  track.className = "ring-track";
  const total = Math.max(names.length, 8);
  const radius = 180;
  for (let i = 0; i < total; i += 1) {
    const card = document.createElement("div");
    card.className = "ring-card";
    const name = names[i % names.length] || `候选${i + 1}`;
    card.textContent = name;
    const angle = (360 / total) * i;
    card.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;
    track.appendChild(card);
  }
  winnerBox = document.createElement("div");
  winnerBox.style.position = "absolute";
  winnerBox.style.width = "70%";
  winnerBox.style.maxWidth = "520px";
  winnerBox.style.height = "160px";
  winnerBox.style.borderRadius = "18px";
  winnerBox.style.background = "rgba(8, 12, 26, 0.7)";
  winnerBox.style.border = "1px solid rgba(94, 243, 255, 0.3)";
  winnerBox.style.display = "grid";
  winnerBox.style.placeItems = "center";
  winnerBox.style.fontSize = "28px";
  winnerBox.style.fontWeight = "700";
  winnerBox.textContent = "准备抽奖";
  stage.appendChild(track);
  stage.appendChild(winnerBox);
  container.appendChild(stage);
}

function updateNames(list) {
  currentNames = list.map((item) => item.name);
  buildRing(currentNames);
}

export const LotteryStage = {
  init(state) {
    currentNames = state.participants.map((item) => item.name);
    buildRing(currentNames.length ? currentNames : ["候选"]);
  },
  onParticipantsUpdate(list) {
    updateNames(list);
  },
  async startAnimation({ prize }) {
    if (track) track.classList.remove("paused");
    if (winnerBox) winnerBox.textContent = `正在抽取 ${prize}`;
    return new Promise((resolve) => setTimeout(resolve, 1400));
  },
  async showWinners(winners) {
    if (track) track.classList.add("paused");
    if (winnerBox) {
      winnerBox.textContent = winners.map((w) => `${w.name}${w.id ? `(${w.id})` : ""}`).join(" · ");
    }
    return Promise.resolve();
  },
  reset() {
    if (winnerBox) winnerBox.textContent = "准备抽奖";
  },
};

window.LotteryStage = LotteryStage;
