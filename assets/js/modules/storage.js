const STORAGE_KEY = "lottery.state.v1";

export function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {
      participants: [],
      results: [],
      settings: {
        title: "年度抽奖夜",
        prize: "特等奖",
        drawCount: 1,
        allowRepeat: false,
      },
    };
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      participants: parsed.participants || [],
      results: parsed.results || [],
      settings: {
        title: parsed.settings?.title || "年度抽奖夜",
        prize: parsed.settings?.prize || "特等奖",
        drawCount: parsed.settings?.drawCount || 1,
        allowRepeat: parsed.settings?.allowRepeat || false,
      },
    };
  } catch (error) {
    console.warn("Failed to parse state", error);
    return {
      participants: [],
      results: [],
      settings: {
        title: "年度抽奖夜",
        prize: "特等奖",
        drawCount: 1,
        allowRepeat: false,
      },
    };
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState() {
  localStorage.removeItem(STORAGE_KEY);
}
