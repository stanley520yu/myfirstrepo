import { parseCSV, parseTextList, parseXLSX } from "./modules/parser.js";
import { loadState, saveState, resetState } from "./modules/storage.js";
import { createLotteryState, drawWinners, undoLastDraw } from "./modules/lottery.js";

const state = loadState();
const runtime = createLotteryState({
  participants: state.participants,
  results: state.results,
});

const selectors = {
  titleInput: document.querySelector("[data-field='title']"),
  prizeInput: document.querySelector("[data-field='prize']"),
  drawCount: document.querySelector("[data-field='count']"),
  allowRepeat: document.querySelector("[data-field='repeat']"),
  fileInput: document.querySelector("[data-field='file']"),
  textInput: document.querySelector("[data-field='text']"),
  importBtn: document.querySelector("[data-action='import']"),
  clearBtn: document.querySelector("[data-action='clear']"),
  startBtn: document.querySelector("[data-action='start']"),
  undoBtn: document.querySelector("[data-action='undo']"),
  exportBtn: document.querySelector("[data-action='export']"),
  summary: document.querySelector("[data-ui='summary']"),
  resultsBody: document.querySelector("[data-ui='results']"),
  stageTitle: document.querySelector("[data-ui='stage-title']"),
};

const stage = window.LotteryStage;
if (!stage) {
  console.error("Stage module missing.");
}

function syncInputs() {
  selectors.titleInput.value = state.settings.title;
  selectors.prizeInput.value = state.settings.prize;
  selectors.drawCount.value = state.settings.drawCount;
  selectors.allowRepeat.checked = state.settings.allowRepeat;
  selectors.stageTitle.textContent = state.settings.title;
}

function updateSummary() {
  selectors.summary.innerHTML = `
    <span class="badge">名单总数：${runtime.participants.length}</span>
    <span class="badge">奖池剩余：${runtime.pool.length}</span>
    <span class="badge">已中奖：${runtime.results.length}</span>
    <span class="badge">随机源：crypto.getRandomValues</span>
  `;
}

function renderResults() {
  selectors.resultsBody.innerHTML = runtime.results
    .slice()
    .reverse()
    .map(
      (entry) => `
        <tr>
          <td>${entry.prize}</td>
          <td>${entry.participant.name}</td>
          <td>${entry.participant.id || "-"}</td>
          <td>${new Date(entry.time).toLocaleString()}</td>
        </tr>
      `
    )
    .join("");
}

function persistState() {
  state.participants = runtime.participants;
  state.results = runtime.results;
  state.settings.title = selectors.titleInput.value.trim() || state.settings.title;
  state.settings.prize = selectors.prizeInput.value.trim() || state.settings.prize;
  state.settings.drawCount = Number(selectors.drawCount.value) || 1;
  state.settings.allowRepeat = selectors.allowRepeat.checked;
  saveState(state);
}

async function handleFileImport(file) {
  if (!file) return;
  const ext = file.name.split(".").pop().toLowerCase();
  let list = [];
  try {
    if (ext === "csv") {
      const text = await file.text();
      list = parseCSV(text);
    } else if (ext === "xlsx" || ext === "xls") {
      const buffer = await file.arrayBuffer();
      list = await parseXLSX(buffer);
    } else {
      alert("仅支持 .xlsx / .csv 格式");
      return;
    }
  } catch (error) {
    console.error(error);
    alert(`导入失败：${error.message || error}`);
    return;
  }
  runtime.participants = list;
  runtime.pool = [...list];
  runtime.results = [];
  persistState();
  updateSummary();
  renderResults();
  if (stage?.onParticipantsUpdate) stage.onParticipantsUpdate(list);
}

function handleTextImport() {
  const text = selectors.textInput.value;
  if (!text.trim()) return;
  const list = parseTextList(text);
  runtime.participants = list;
  runtime.pool = [...list];
  runtime.results = [];
  persistState();
  updateSummary();
  renderResults();
  if (stage?.onParticipantsUpdate) stage.onParticipantsUpdate(list);
}

async function runDraw() {
  if (!runtime.participants.length) {
    alert("请先导入名单");
    return;
  }
  const prize = selectors.prizeInput.value.trim() || "奖项";
  const count = Number(selectors.drawCount.value) || 1;
  const allowRepeat = selectors.allowRepeat.checked;
  await stage?.startAnimation?.({ prize, count });
  const winners = drawWinners(runtime, count, allowRepeat);
  const now = Date.now();
  winners.forEach((winner) => {
    runtime.results.push({
      prize,
      participant: winner,
      time: now,
    });
  });
  persistState();
  updateSummary();
  renderResults();
  await stage?.showWinners?.(winners, { prize, count });
}

function handleUndo() {
  const count = Number(selectors.drawCount.value) || 1;
  undoLastDraw(runtime, count, selectors.allowRepeat.checked);
  persistState();
  updateSummary();
  renderResults();
  stage?.reset?.();
}

function handleExport() {
  if (!runtime.results.length) {
    alert("暂无结果可导出");
    return;
  }
  const rows = [
    ["奖项", "姓名", "工号", "时间"],
    ...runtime.results.map((entry) => [
      entry.prize,
      entry.participant.name,
      entry.participant.id,
      new Date(entry.time).toLocaleString(),
    ]),
  ];
  const csv = rows.map((row) => row.map((cell) => `"${cell ?? ""}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `lottery-results-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

selectors.fileInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  handleFileImport(file);
});

selectors.importBtn.addEventListener("click", handleTextImport);
selectors.clearBtn.addEventListener("click", () => {
  if (!confirm("确认清空名单与结果？")) return;
  runtime.participants = [];
  runtime.pool = [];
  runtime.results = [];
  resetState();
  updateSummary();
  renderResults();
  stage?.reset?.();
});
selectors.startBtn.addEventListener("click", runDraw);
selectors.undoBtn.addEventListener("click", handleUndo);
selectors.exportBtn.addEventListener("click", handleExport);
[selectors.titleInput, selectors.prizeInput, selectors.drawCount, selectors.allowRepeat].forEach(
  (el) => {
    el.addEventListener("change", () => {
      persistState();
      selectors.stageTitle.textContent = selectors.titleInput.value.trim() || "年度抽奖夜";
    });
  }
);
window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    runDraw();
  }
});

syncInputs();
updateSummary();
renderResults();
stage?.init?.(runtime);
