const nameKeywords = ["name", "姓名", "名字"];
const idKeywords = ["id", "工号", "员工", "编号", "employee"];

function normalizeHeader(value) {
  return String(value || "").trim().toLowerCase();
}

function findColumnIndex(headers, keywords) {
  return headers.findIndex((header) => keywords.some((keyword) => header.includes(keyword)));
}

export function detectColumns(rows) {
  if (!rows.length) {
    return { nameIndex: 0, idIndex: 1, hasHeader: false };
  }
  const headers = rows[0].map(normalizeHeader);
  let nameIndex = findColumnIndex(headers, nameKeywords);
  let idIndex = findColumnIndex(headers, idKeywords);
  const hasHeader = nameIndex !== -1 || idIndex !== -1;
  if (!hasHeader) {
    nameIndex = 0;
    idIndex = 1;
  } else {
    if (nameIndex === -1) nameIndex = 0;
    if (idIndex === -1) idIndex = nameIndex === 0 ? 1 : 0;
  }
  return { nameIndex, idIndex, hasHeader };
}

export function rowsToParticipants(rows) {
  const { nameIndex, idIndex, hasHeader } = detectColumns(rows);
  const startIndex = hasHeader ? 1 : 0;
  const list = [];
  for (let i = startIndex; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row) continue;
    const name = String(row[nameIndex] || "").trim();
    const id = String(row[idIndex] || "").trim();
    if (!name && !id) continue;
    list.push({ name: name || id || `未知${i}`, id: id || "" });
  }
  return list;
}

export function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  const rows = lines.map((line) => line.split(/,|\t/).map((cell) => cell.trim()));
  return rowsToParticipants(rows);
}

export function parseTextList(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  const rows = lines.map((line) => line.split(/,|\t/).map((cell) => cell.trim()));
  return rowsToParticipants(rows);
}

function findEocd(data) {
  for (let i = data.length - 22; i >= 0 && i >= data.length - 65557; i -= 1) {
    if (data[i] === 0x50 && data[i + 1] === 0x4b && data[i + 2] === 0x05 && data[i + 3] === 0x06) {
      return i;
    }
  }
  return -1;
}

function readUint16(view, offset) {
  return view.getUint16(offset, true);
}

function readUint32(view, offset) {
  return view.getUint32(offset, true);
}

function decodeText(bytes) {
  return new TextDecoder("utf-8").decode(bytes);
}

async function inflateData(compressed, method) {
  if (method === 0) return compressed;
  if (method !== 8) throw new Error("Unsupported compression method.");
  if (typeof DecompressionStream === "undefined") {
    throw new Error("浏览器不支持解压缩 XLSX 文件。");
  }
  const tryModes = ["deflate-raw", "deflate"];
  for (const mode of tryModes) {
    try {
      const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream(mode));
      const buffer = await new Response(stream).arrayBuffer();
      return new Uint8Array(buffer);
    } catch (error) {
      continue;
    }
  }
  throw new Error("解压 XLSX 失败。");
}

function columnToIndex(column) {
  let index = 0;
  for (const char of column) {
    index = index * 26 + (char.charCodeAt(0) - 64);
  }
  return index - 1;
}

function parseSharedStrings(xml) {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  return Array.from(doc.querySelectorAll("si")).map((si) => si.textContent || "");
}

function parseSheet(xml, sharedStrings) {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const rows = [];
  doc.querySelectorAll("sheetData row").forEach((row) => {
    const rowIndex = Number(row.getAttribute("r") || rows.length + 1) - 1;
    rows[rowIndex] = rows[rowIndex] || [];
    row.querySelectorAll("c").forEach((cell) => {
      const ref = cell.getAttribute("r") || "";
      const column = ref.replace(/[0-9]/g, "");
      const colIndex = columnToIndex(column || "A");
      const type = cell.getAttribute("t");
      let value = cell.querySelector("v")?.textContent || "";
      if (type === "s") {
        value = sharedStrings[Number(value)] || "";
      }
      if (type === "inlineStr") {
        value = cell.querySelector("is t")?.textContent || "";
      }
      rows[rowIndex][colIndex] = value;
    });
  });
  return rows;
}

export async function parseXLSX(arrayBuffer) {
  const data = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  const eocdOffset = findEocd(data);
  if (eocdOffset === -1) throw new Error("无法识别 XLSX 文件。");
  const centralDirOffset = readUint32(view, eocdOffset + 16);
  const centralDirSize = readUint32(view, eocdOffset + 12);
  let offset = centralDirOffset;
  const entries = {};
  const decoder = new TextDecoder("utf-8");
  while (offset < centralDirOffset + centralDirSize) {
    if (readUint32(view, offset) !== 0x02014b50) break;
    const compression = readUint16(view, offset + 10);
    const compressedSize = readUint32(view, offset + 20);
    const fileNameLength = readUint16(view, offset + 28);
    const extraLength = readUint16(view, offset + 30);
    const commentLength = readUint16(view, offset + 32);
    const localHeaderOffset = readUint32(view, offset + 42);
    const nameBytes = data.slice(offset + 46, offset + 46 + fileNameLength);
    const fileName = decoder.decode(nameBytes);
    entries[fileName] = {
      compression,
      compressedSize,
      localHeaderOffset,
    };
    offset += 46 + fileNameLength + extraLength + commentLength;
  }
  const sheetName =
    Object.keys(entries).find((name) => name.startsWith("xl/worksheets/sheet")) || "xl/worksheets/sheet1.xml";
  const sharedName = "xl/sharedStrings.xml";

  const sheetEntry = entries[sheetName];
  if (!sheetEntry) throw new Error("未找到 Excel 工作表。");

  async function extractXml(entry) {
    const localOffset = entry.localHeaderOffset;
    if (readUint32(view, localOffset) !== 0x04034b50) throw new Error("XLSX 文件格式异常。");
    const fileNameLength = readUint16(view, localOffset + 26);
    const extraLength = readUint16(view, localOffset + 28);
    const dataStart = localOffset + 30 + fileNameLength + extraLength;
    const compressed = data.slice(dataStart, dataStart + entry.compressedSize);
    const inflated = await inflateData(compressed, entry.compression);
    return decodeText(inflated);
  }

  const sharedStrings = entries[sharedName] ? parseSharedStrings(await extractXml(entries[sharedName])) : [];
  const sheetXml = await extractXml(sheetEntry);
  const rows = parseSheet(sheetXml, sharedStrings);
  return rowsToParticipants(rows);
}
