const container = document.querySelector("[data-ui='stage']");
let orbit;
let nodes = [];
let names = [];

function buildOrbit(list) {
  container.innerHTML = "";
  names = list.map((item) => item.name);
  const stage = document.createElement("div");
  stage.className = "nebula-stage";
  orbit = document.createElement("div");
  orbit.className = "nebula-orbit";
  nodes = [];
  const total = 6;
  for (let i = 0; i < total; i += 1) {
    const node = document.createElement("div");
    node.className = "nebula-node";
    const angle = (360 / total) * i;
    node.style.transform = `rotate(${angle}deg) translate(170px) rotate(-${angle}deg)`;
    node.textContent = names[i % names.length] || `候选${i + 1}`;
    orbit.appendChild(node);
    nodes.push(node);
  }
  stage.appendChild(orbit);
  container.appendChild(stage);
}

const LotteryStage = {
  init(state) {
    buildOrbit(state.participants);
  },
  onParticipantsUpdate(list) {
    buildOrbit(list);
  },
  async startAnimation({ prize }) {
    if (orbit) orbit.classList.remove("paused");
    return new Promise((resolve) => setTimeout(resolve, 1500));
  },
  async showWinners(winners) {
    if (orbit) orbit.classList.add("paused");
    winners.forEach((winner, index) => {
      const node = nodes[index % nodes.length];
      if (node) {
        node.textContent = `${winner.name}${winner.id ? `(${winner.id})` : ""}`;
      }
    });
    return Promise.resolve();
  },
  reset() {
    if (orbit) orbit.classList.remove("paused");
  },
};

window.LotteryStage = LotteryStage;
