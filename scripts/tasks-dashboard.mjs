// Generates docs/tasks/dashboard.html from the task docs. Plain Node, no dependencies.
//
//   npm run tasks:dashboard
//
// Sources (the only ones): docs/tasks/README.md (task list, status, deps, branch) and
// docs/tasks/NN-slug/progress.md (overall status + step table). The HTML is fully rendered
// here, so it opens from file:// without fetching anything. Problems in the markdown become
// warnings (console + page); the script only fails if it cannot write the output file.
//
// Visual style: .claude/skills/architecture-diagram (dark theme, JetBrains Mono, palette,
// Copy/PNG/PDF export toolbar).

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// TASKS_DIR env var: point at another tasks folder (used to test the script on sample data).
const TASKS_DIR = process.env.TASKS_DIR ? resolve(process.env.TASKS_DIR) : join(ROOT, "docs", "tasks");
const OUT_FILE = join(TASKS_DIR, "dashboard.html");

const warnings = [];
function warn(message) {
  warnings.push(message);
  console.warn(`[warn] ${message}`);
}

// ---------------------------------------------------------------------------
// Status symbols (CLAUDE.md) -> colours from the architecture-diagram palette
// ---------------------------------------------------------------------------

const STATUS = {
  done: { symbol: "✅", label: "xong", stroke: "#34d399", fill: "rgba(6, 78, 59, 0.4)" },
  doing: { symbol: "🔄", label: "đang làm", stroke: "#22d3ee", fill: "rgba(8, 51, 68, 0.4)" },
  unreviewed: { symbol: "❓", label: "có code chưa rà soát", stroke: "#a78bfa", fill: "rgba(76, 29, 149, 0.4)" },
  differs: { symbol: "⚠️", label: "khác task.md", stroke: "#fbbf24", fill: "rgba(120, 53, 15, 0.3)" },
  missing: { symbol: "❌", label: "thiếu", stroke: "#fb7185", fill: "rgba(136, 19, 55, 0.4)" },
  todo: { symbol: "⬜", label: "chưa làm", stroke: "#94a3b8", fill: "rgba(30, 41, 59, 0.5)" },
  unknown: { symbol: "·", label: "ký hiệu lạ", stroke: "#64748b", fill: "rgba(30, 41, 59, 0.3)", dashed: true },
};

// "⚠" matched without U+FE0F so both "⚠" and "⚠️" are recognised.
const SYMBOLS = [
  ["✅", "done"],
  ["🔄", "doing"],
  ["❓", "unreviewed"],
  ["⚠", "differs"],
  ["❌", "missing"],
  ["⬜", "todo"],
];

/** First known status symbol in the text, or "unknown". */
function parseStatus(text) {
  const value = String(text ?? "");
  let found = null;
  for (const [symbol, key] of SYMBOLS) {
    const index = value.indexOf(symbol);
    if (index >= 0 && (found === null || index < found.index)) found = { index, key };
  }
  return found ? found.key : "unknown";
}

// ---------------------------------------------------------------------------
// Markdown tables
// ---------------------------------------------------------------------------

function splitRow(line) {
  let row = line.trim();
  if (row.startsWith("|")) row = row.slice(1);
  if (row.endsWith("|")) row = row.slice(0, -1);
  return row.split(/(?<!\\)\|/).map((cell) => cell.trim().replace(/\\\|/g, "|"));
}

const isSeparatorRow = (cells) => cells.length > 0 && cells.every((cell) => /^:?-{2,}:?$/.test(cell));

/** Every pipe table in the document: header, data rows (with 1-based line numbers). */
function findTables(markdown) {
  const lines = markdown.split(/\r?\n/);
  const tables = [];
  for (let i = 0; i < lines.length - 1; i++) {
    if (!lines[i].trim().startsWith("|") || !lines[i + 1].trim().startsWith("|")) continue;
    if (!isSeparatorRow(splitRow(lines[i + 1]))) continue;
    const rows = [];
    let j = i + 2;
    for (; j < lines.length && lines[j].trim().startsWith("|"); j++) rows.push({ cells: splitRow(lines[j]), line: j + 1 });
    tables.push({ header: splitRow(lines[i]), rows, line: i + 1 });
    i = j - 1;
  }
  return tables;
}

const normalizeHeader = (text) => text.replace(/[*_`]/g, "").trim().toLowerCase();

function columnIndex(header, ...names) {
  const wanted = names.map(normalizeHeader);
  return header.findIndex((cell) => wanted.includes(normalizeHeader(cell)));
}

const readText = (path) => readFileSync(path, "utf8").replace(/^\uFEFF/, "");

// ---------------------------------------------------------------------------
// README.md
// ---------------------------------------------------------------------------

/** "—", "-", "" -> []; "02, 03-cart", "[02](02-x/task.md)" -> ["02", "03"] / ["02"]. */
function parseDeps(cell, where) {
  const text = plain(cell).trim();
  if (!text || /^[—–-]+$/.test(text)) return [];
  const deps = [];
  for (const token of text.split(/[,;\s]+/).filter(Boolean)) {
    const match = token.match(/^(\d+)/);
    if (match) deps.push(match[1].padStart(2, "0"));
    else warn(`${where}: không hiểu phụ thuộc "${token}" (cần dạng NN hoặc NN-slug) — bỏ qua.`);
  }
  return deps;
}

function parseReadme() {
  const path = join(TASKS_DIR, "README.md");
  if (!existsSync(path)) {
    warn("Không tìm thấy docs/tasks/README.md — dashboard dựng từ các thư mục task.");
    return [];
  }
  const table = findTables(readText(path)).find(
    (t) => columnIndex(t.header, "#") >= 0 && columnIndex(t.header, "Task") >= 0 && columnIndex(t.header, "Trạng thái") >= 0,
  );
  if (!table) {
    warn("README.md: không tìm thấy bảng task (cần các cột #, Task, Trạng thái).");
    return [];
  }

  const col = {
    nn: columnIndex(table.header, "#"),
    task: columnIndex(table.header, "Task"),
    status: columnIndex(table.header, "Trạng thái"),
    deps: columnIndex(table.header, "Phụ thuộc"),
    branch: columnIndex(table.header, "Nhánh git", "Nhánh"),
  };

  const entries = [];
  for (const { cells, line } of table.rows) {
    const where = `README.md dòng ${line}`;
    if (cells.length !== table.header.length) {
      warn(`${where}: có ${cells.length} cột, bảng có ${table.header.length} — bỏ qua dòng.`);
      continue;
    }
    const nnMatch = cells[col.nn].match(/\d+/);
    if (!nnMatch) {
      warn(`${where}: cột # không có số — bỏ qua dòng.`);
      continue;
    }
    const taskCell = cells[col.task];
    const link = taskCell.match(/\[([^\]]*)\]\(([^)]*)\)/);
    const slug = link?.[2].match(/(?:^|\/)(\d+-[^/]+)\//)?.[1] ?? null;
    const afterDash = (link ? taskCell.slice(taskCell.indexOf(link[0]) + link[0].length) : taskCell).match(/[—–]\s*(.+)$/);
    const statusCell = cells[col.status];
    const status = parseStatus(statusCell);
    if (status === "unknown") warn(`${where}: ký hiệu trạng thái lạ "${statusCell}".`);

    entries.push({
      nn: nnMatch[0].padStart(2, "0"),
      slug,
      name: link?.[1]?.trim() || null,
      title: afterDash?.[1].trim() || null,
      status,
      deps: col.deps >= 0 ? parseDeps(cells[col.deps], where) : [],
      branch: col.branch >= 0 ? cells[col.branch].replace(/`/g, "").replace(/^[—–-]+$/, "").trim() : "",
    });
  }
  return entries;
}

// ---------------------------------------------------------------------------
// NN-slug/progress.md
// ---------------------------------------------------------------------------

function parseProgress(slug) {
  const path = join(TASKS_DIR, slug, "progress.md");
  if (!existsSync(path)) return null;
  const markdown = readText(path);
  const file = `${slug}/progress.md`;

  const overallMatch = markdown.match(/Trạng thái chung:\s*([^\n·]*)/);
  const updatedMatch = markdown.match(/Cập nhật lần cuối:\s*([^\n·|]*)/);
  let overall = null;
  if (!overallMatch) {
    warn(`${file}: thiếu dòng "Trạng thái chung".`);
  } else {
    overall = parseStatus(overallMatch[1]);
    if (overall === "unknown") warn(`${file}: "Trạng thái chung" có ký hiệu lạ "${overallMatch[1].trim()}".`);
  }

  const steps = [];
  const table = findTables(markdown).find(
    (t) => columnIndex(t.header, "Bước") >= 0 && columnIndex(t.header, "Trạng thái") >= 0,
  );
  if (!table) {
    warn(`${file}: không tìm thấy bảng bước (cần các cột Bước, Trạng thái).`);
  } else {
    const col = {
      step: columnIndex(table.header, "Bước"),
      name: columnIndex(table.header, "Tên"),
      status: columnIndex(table.header, "Trạng thái"),
      note: columnIndex(table.header, "Ghi chú"),
    };
    for (const { cells, line } of table.rows) {
      if (cells.length !== table.header.length) {
        warn(`${file} dòng ${line}: có ${cells.length} cột, bảng có ${table.header.length} — bỏ qua dòng.`);
        continue;
      }
      const statusCell = cells[col.status];
      const status = parseStatus(statusCell);
      if (status === "unknown") warn(`${file} dòng ${line}: ký hiệu trạng thái lạ "${statusCell}".`);
      const step = cells[col.step];
      steps.push({
        step,
        numbered: /^\d+$/.test(step),
        name: col.name >= 0 ? cells[col.name] : "",
        status,
        note: col.note >= 0 ? cells[col.note] : "",
      });
    }
  }

  // "<ngày>" is the _template placeholder, not a date.
  const updated = updatedMatch?.[1].trim() || null;
  return { overall, updated: updated && !/^<.*>$/.test(updated) ? updated : null, steps, hasTable: Boolean(table) };
}

// ---------------------------------------------------------------------------
// Merge README + folders
// ---------------------------------------------------------------------------

function collectTasks() {
  const readme = parseReadme();

  let folders = [];
  try {
    folders = readdirSync(TASKS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("."))
      .map((d) => d.name);
  } catch (error) {
    warn(`Không đọc được thư mục docs/tasks: ${error.message}`);
  }
  const folderByNn = new Map();
  for (const name of folders) {
    const match = name.match(/^(\d+)-/);
    if (!match) {
      warn(`Thư mục docs/tasks/${name}: không đúng dạng NN-slug — bỏ qua.`);
      continue;
    }
    folderByNn.set(match[1].padStart(2, "0"), name);
  }

  const tasks = new Map();
  for (const entry of readme) {
    if (tasks.has(entry.nn)) {
      warn(`README.md: task ${entry.nn} xuất hiện nhiều lần — dùng dòng đầu tiên.`);
      continue;
    }
    const slug = entry.slug ?? folderByNn.get(entry.nn) ?? null;
    if (entry.slug && folderByNn.has(entry.nn) && folderByNn.get(entry.nn) !== entry.slug) {
      warn(`README.md: task ${entry.nn} trỏ tới "${entry.slug}" nhưng thư mục là "${folderByNn.get(entry.nn)}".`);
    }
    tasks.set(entry.nn, { ...entry, slug, inReadme: true });
  }
  for (const [nn, slug] of folderByNn) {
    if (tasks.has(nn)) continue;
    warn(`Thư mục ${slug} chưa có dòng trong README.md.`);
    tasks.set(nn, { nn, slug, name: null, title: null, status: "unknown", deps: [], branch: "", inReadme: false });
  }

  for (const task of tasks.values()) {
    task.hasFolder = task.slug !== null && existsSync(join(TASKS_DIR, task.slug));
    if (task.inReadme && !task.hasFolder) warn(`Task ${task.nn}: chưa có thư mục trong docs/tasks/.`);
    task.name ||= task.slug ? task.slug.replace(/^\d+-/, "") : `task ${task.nn}`;
    try {
      task.progress = task.hasFolder ? parseProgress(task.slug) : null;
    } catch (error) {
      warn(`${task.slug}/progress.md: lỗi khi đọc (${error.message}).`);
      task.progress = null;
    }
    if (!task.inReadme && task.progress?.overall) task.status = task.progress.overall;
    if (task.inReadme && task.progress?.overall && task.progress.overall !== task.status) {
      warn(
        `Task ${task.nn}: README ghi ${STATUS[task.status].symbol} nhưng progress.md ghi "Trạng thái chung" ${STATUS[task.progress.overall].symbol}.`,
      );
    }
    const numbered = task.progress?.steps.filter((s) => s.numbered) ?? [];
    task.stepsTotal = numbered.length;
    task.stepsDone = numbered.filter((s) => s.status === "done").length;
  }

  for (const task of tasks.values()) {
    task.deps = task.deps.filter((dep) => {
      if (dep === task.nn) {
        warn(`Task ${task.nn}: tự phụ thuộc vào chính nó — bỏ qua.`);
        return false;
      }
      if (!tasks.has(dep)) {
        warn(`Task ${task.nn}: phụ thuộc task ${dep} không tồn tại — bỏ qua.`);
        return false;
      }
      return true;
    });
  }

  return [...tasks.values()].sort((a, b) => a.nn.localeCompare(b.nn));
}

// ---------------------------------------------------------------------------
// Dependency levels (column = level; tasks without deps in column 0)
// ---------------------------------------------------------------------------

function assignLevels(tasks) {
  const byNn = new Map(tasks.map((t) => [t.nn, t]));
  const level = new Map();
  const visiting = new Set();
  const cyclic = new Set();

  function levelOf(nn) {
    if (level.has(nn)) return level.get(nn);
    if (visiting.has(nn)) {
      cyclic.add(nn);
      return 0;
    }
    visiting.add(nn);
    let value = 0;
    for (const dep of byNn.get(nn).deps) value = Math.max(value, levelOf(dep) + 1);
    visiting.delete(nn);
    level.set(nn, value);
    return value;
  }

  for (const task of tasks) levelOf(task.nn);
  const maxLevel = Math.max(0, ...level.values());
  for (const nn of cyclic) {
    warn(`Phụ thuộc vòng quanh task ${nn} — đặt ở cột cuối.`);
    level.set(nn, maxLevel + 1);
  }
  for (const task of tasks) task.level = level.get(task.nn);
}

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Minimal inline markdown for notes: links -> text, `code`, **bold**. Input is escaped first. */
function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

const plain = (text) =>
  String(text ?? "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*]/g, "");

function truncate(text, max) {
  const value = plain(text);
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

const percent = (done, total) => (total > 0 ? Math.round((done / total) * 100) : 0);

function localTimestamp(date) {
  const pad = (n) => String(n).padStart(2, "0");
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const zone = `UTC${sign}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)}`;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())} (${zone})`;
}

// ---------------------------------------------------------------------------
// SVG dependency diagram (positions computed from levels)
// ---------------------------------------------------------------------------

const BOX_W = 230;
const BOX_H = 92;
const COL_GAP = 90;
const ROW_GAP = 34;
const PAD = 30;
const LEGEND_ITEM_W = 190;
const LEGEND_ROW_H = 18;

function renderDiagram(tasks) {
  if (tasks.length === 0) return `<p class="empty">Chưa có task nào trong docs/tasks/.</p>`;

  const columns = new Map();
  for (const task of tasks) {
    if (!columns.has(task.level)) columns.set(task.level, []);
    columns.get(task.level).push(task);
  }
  const levels = [...columns.keys()].sort((a, b) => a - b);
  const maxRows = Math.max(...[...columns.values()].map((c) => c.length));

  const position = new Map();
  levels.forEach((lvl, colIndex) => {
    columns.get(lvl).forEach((task, rowIndex) => {
      position.set(task.nn, { x: PAD + colIndex * (BOX_W + COL_GAP), y: PAD + rowIndex * (BOX_H + ROW_GAP) });
    });
  });

  const width = Math.max(760, PAD * 2 + levels.length * BOX_W + (levels.length - 1) * COL_GAP);
  const boxesBottom = PAD + maxRows * BOX_H + (maxRows - 1) * ROW_GAP;
  const legendKeys = Object.keys(STATUS);
  const perRow = Math.max(1, Math.floor((width - PAD * 2) / LEGEND_ITEM_W));
  const legendTop = boxesBottom + 36;
  const height = legendTop + 20 + Math.ceil(legendKeys.length / perRow) * LEGEND_ROW_H + PAD;

  // Arrows first so they render behind the boxes.
  const arrows = [];
  for (const task of tasks) {
    const to = position.get(task.nn);
    for (const dep of task.deps) {
      const from = position.get(dep);
      const x1 = from.x + BOX_W;
      const y1 = from.y + BOX_H / 2;
      const x2 = to.x - 2;
      const y2 = to.y + BOX_H / 2;
      const bend = Math.max(40, (x2 - x1) / 2);
      arrows.push(
        `<path d="M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arrowhead)"><title>${escapeHtml(`${dep} → ${task.nn}`)}</title></path>`,
      );
    }
  }

  const boxes = tasks.map((task) => {
    const { x, y } = position.get(task.nn);
    const s = STATUS[task.status];
    const barW = BOX_W - 24;
    const doneW = task.stepsTotal ? Math.round((barW * task.stepsDone) / task.stepsTotal) : 0;
    const stepsLabel = task.progress ? `${task.stepsDone}/${task.stepsTotal} bước` : "chưa có tiến độ";
    const dash = s.dashed ? ` stroke-dasharray="4,4"` : "";
    return `
        <g>
          <title>${escapeHtml(`${task.nn} — ${task.name}${task.title ? `: ${plain(task.title)}` : ""} (${s.label})`)}</title>
          <rect x="${x}" y="${y}" width="${BOX_W}" height="${BOX_H}" rx="6" fill="#0f172a"/>
          <rect x="${x}" y="${y}" width="${BOX_W}" height="${BOX_H}" rx="6" fill="${s.fill}" stroke="${s.stroke}" stroke-width="1.5"${dash}/>
          <text x="${x + 12}" y="${y + 20}" fill="${s.stroke}" font-size="10" font-weight="700">${escapeHtml(task.nn)}</text>
          <text x="${x + BOX_W - 12}" y="${y + 21}" font-size="12" text-anchor="end">${s.symbol}</text>
          <text x="${x + 36}" y="${y + 20}" fill="white" font-size="12" font-weight="600">${escapeHtml(truncate(task.name, 22))}</text>
          <text x="${x + 12}" y="${y + 40}" fill="#94a3b8" font-size="9">${escapeHtml(truncate(task.title ?? task.slug ?? "", 36))}</text>
          <text x="${x + 12}" y="${y + 62}" fill="#cbd5e1" font-size="9">${escapeHtml(stepsLabel)}</text>
          <text x="${x + BOX_W - 12}" y="${y + 62}" fill="#94a3b8" font-size="9" text-anchor="end">${task.progress ? `${percent(task.stepsDone, task.stepsTotal)}%` : ""}</text>
          <rect x="${x + 12}" y="${y + 72}" width="${barW}" height="5" rx="2.5" fill="#1e293b"/>
          <rect x="${x + 12}" y="${y + 72}" width="${doneW}" height="5" rx="2.5" fill="${STATUS.done.stroke}"/>
        </g>`;
  });

  const legend = legendKeys.map((key, i) => {
    const s = STATUS[key];
    const lx = PAD + (i % perRow) * LEGEND_ITEM_W;
    const ly = legendTop + 20 + Math.floor(i / perRow) * LEGEND_ROW_H;
    const dash = s.dashed ? ` stroke-dasharray="3,3"` : "";
    return `<rect x="${lx}" y="${ly - 9}" width="16" height="10" rx="2" fill="${s.fill}" stroke="${s.stroke}" stroke-width="1"${dash}/><text x="${lx + 22}" y="${ly}" fill="#94a3b8" font-size="9">${s.symbol} ${escapeHtml(s.label)}</text>`;
  });

  return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Sơ đồ phụ thuộc giữa các task">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
          </marker>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" stroke-width="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        ${arrows.join("\n        ")}
        ${boxes.join("")}
        <text x="${PAD}" y="${legendTop}" fill="white" font-size="10" font-weight="600">Chú thích</text>
        <line x1="${PAD + 80}" y1="${legendTop - 4}" x2="${PAD + 110}" y2="${legendTop - 4}" stroke="#64748b" stroke-width="1.5" marker-end="url(#arrowhead)"/>
        <text x="${PAD + 118}" y="${legendTop}" fill="#94a3b8" font-size="9">phụ thuộc (A → B: B cần A xong trước)</text>
        ${legend.join("\n        ")}
      </svg>`;
}

// ---------------------------------------------------------------------------
// Task cards
// ---------------------------------------------------------------------------

function renderCard(task) {
  const s = STATUS[task.status];
  const links = task.hasFolder
    ? `<a href="${escapeHtml(`${task.slug}/task.md`)}">task.md</a> · <a href="${escapeHtml(`${task.slug}/progress.md`)}">progress.md</a>`
    : `<span class="muted">chưa có thư mục</span>`;

  let body;
  if (!task.progress) {
    body = `<p class="muted">chưa có tiến độ</p>`;
  } else if (task.progress.steps.length === 0) {
    body = `<p class="muted">${task.progress.hasTable ? "chưa có bước nào" : "progress.md chưa có bảng bước"}</p>`;
  } else {
    body = `<ul class="steps">${task.progress.steps
      .map((step) => {
        const st = STATUS[step.status];
        const tag = step.numbered ? `Bước ${escapeHtml(step.step)}` : `<span class="aux">mục phụ</span>`;
        const note = step.note ? `<div class="note">${inlineMarkdown(step.note)}</div>` : "";
        return `<li><span class="sym" style="color:${st.stroke}" title="${escapeHtml(st.label)}">${st.symbol}</span><div><div class="step-name">${tag} · ${inlineMarkdown(step.name)}</div>${note}</div></li>`;
      })
      .join("")}</ul>`;
  }

  const pct = percent(task.stepsDone, task.stepsTotal);
  const progressLine = task.progress
    ? `<div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div><div class="bar-label">${task.stepsDone}/${task.stepsTotal} bước · ${pct}%</div>`
    : "";

  return `
      <div class="card task-card">
        <div class="card-header">
          <div class="card-dot" style="background:${s.stroke}"></div>
          <h3>${escapeHtml(task.nn)} — ${escapeHtml(task.name)}</h3>
          <span class="badge" style="color:${s.stroke};border-color:${s.stroke}">${s.symbol} ${escapeHtml(s.label)}</span>
        </div>
        ${task.title ? `<p class="task-title">${inlineMarkdown(task.title)}</p>` : ""}
        <p class="meta">Nhánh: ${task.branch ? `<code>${escapeHtml(task.branch)}</code>` : "—"}${task.progress?.updated ? ` · Cập nhật: ${escapeHtml(task.progress.updated)}` : ""}${task.deps.length ? ` · Phụ thuộc: ${task.deps.map(escapeHtml).join(", ")}` : ""}</p>
        ${progressLine}
        ${body}
        <p class="links">${links}</p>
      </div>`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function renderPage(tasks, generatedAt) {
  const count = (key) => tasks.filter((t) => t.status === key).length;
  const done = count("done");
  const doing = count("doing");
  const todo = count("todo");
  const other = tasks.length - done - doing - todo;
  const stepsDone = tasks.reduce((sum, t) => sum + t.stepsDone, 0);
  const stepsTotal = tasks.reduce((sum, t) => sum + t.stepsTotal, 0);

  const legendHtml = Object.values(STATUS)
    .map(
      (s) =>
        `<li><span class="legend-box" style="background:${s.fill};border-color:${s.stroke}${s.dashed ? ";border-style:dashed" : ""}"></span>${s.symbol} ${escapeHtml(s.label)}</li>`,
    )
    .join("");

  const warningsHtml = warnings.length
    ? `<div class="card warnings"><div class="card-header"><div class="card-dot" style="background:#fbbf24"></div><h3>Cảnh báo (${warnings.length})</h3></div><ul>${warnings.map((w) => `<li>• ${escapeHtml(w)}</li>`).join("")}</ul></div>`
    : "";

  // Parsed data, for inspection/reuse; the page itself is already rendered and does not read it.
  const data = JSON.stringify({ generatedAt, warnings, tasks }, null, 2).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<!-- GENERATED by scripts/tasks-dashboard.mjs from docs/tasks/README.md and docs/tasks/*/progress.md. Do not edit by hand: run \`npm run tasks:dashboard\`. -->
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Covet — Tiến độ task</title>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js" integrity="sha384-ZZ1pncU3bQe8y31yfZdMFdSpttDoPmOZg2wguVK9almUodir1PghgT0eY7Mrty8H" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js" integrity="sha384-en/ztfPSRkGfME4KIm05joYXynqzUgbsG5nMrj/xEFAHXkeZfO3yMK8QQ+mP7p1/" crossorigin="anonymous"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'JetBrains Mono', monospace; background: #020617; min-height: 100vh; padding: 2rem; color: white; }
    a { color: #22d3ee; text-decoration: none; }
    a:hover { text-decoration: underline; }
    code { font-family: inherit; background: rgba(30, 41, 59, 0.8); border: 1px solid #334155; border-radius: 0.25rem; padding: 0 0.25rem; font-size: 0.95em; }
    .container { max-width: 1200px; margin: 0 auto; overflow-wrap: anywhere; }
    .stat, .card, .diagram-container { min-width: 0; }
    .header { margin-bottom: 1.5rem; }
    .header-row { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
    .pulse-dot { width: 12px; height: 12px; background: #22d3ee; border-radius: 50%; animation: pulse 2s infinite; flex-shrink: 0; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    h1 { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.025em; }
    .subtitle { color: #94a3b8; font-size: 0.875rem; margin-left: 1.75rem; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin: 1.5rem 0 2rem; }
    .stat { background: rgba(15, 23, 42, 0.5); border: 1px solid #1e293b; border-radius: 0.75rem; padding: 1rem 1.25rem; }
    .stat-value { font-size: 1.5rem; font-weight: 700; }
    .stat-label { color: #94a3b8; font-size: 0.75rem; margin-top: 0.25rem; }
    .section-title { font-size: 0.875rem; font-weight: 600; color: #94a3b8; margin: 2rem 0 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .diagram-container { background: rgba(15, 23, 42, 0.5); border-radius: 1rem; border: 1px solid #1e293b; padding: 1.5rem; overflow-x: auto; }
    svg { display: block; max-width: none; }
    .empty { color: #94a3b8; font-size: 0.875rem; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap: 1rem; }
    .card { background: rgba(15, 23, 42, 0.5); border-radius: 0.75rem; border: 1px solid #1e293b; padding: 1.25rem; }
    .card-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
    .card-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .card h3 { font-size: 0.875rem; font-weight: 600; }
    .badge { margin-left: auto; font-size: 0.6875rem; border: 1px solid; border-radius: 999px; padding: 0.125rem 0.5rem; white-space: nowrap; }
    .task-title { color: #cbd5e1; font-size: 0.8125rem; margin-bottom: 0.5rem; }
    .meta { color: #94a3b8; font-size: 0.75rem; margin-bottom: 0.75rem; line-height: 1.6; }
    .bar { height: 6px; background: #1e293b; border-radius: 3px; overflow: hidden; }
    .bar-fill { height: 100%; background: #34d399; }
    .bar-label { color: #94a3b8; font-size: 0.6875rem; margin: 0.375rem 0 0.75rem; }
    .steps { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }
    .steps li { display: flex; gap: 0.5rem; align-items: flex-start; font-size: 0.75rem; }
    .sym { width: 1.25rem; flex-shrink: 0; text-align: center; }
    .step-name { color: #e2e8f0; }
    .note { color: #94a3b8; font-size: 0.6875rem; margin-top: 0.125rem; line-height: 1.5; }
    .aux { color: #fbbf24; }
    .links { margin-top: 1rem; font-size: 0.75rem; }
    .muted { color: #64748b; font-size: 0.75rem; }
    .legend { list-style: none; display: flex; flex-wrap: wrap; gap: 0.5rem 1.25rem; font-size: 0.75rem; color: #94a3b8; }
    .legend li { display: flex; align-items: center; gap: 0.5rem; }
    .legend-box { width: 16px; height: 10px; border: 1px solid; border-radius: 2px; display: inline-block; }
    .warnings { border-color: rgba(251, 191, 36, 0.5); margin-bottom: 1.5rem; }
    .warnings ul { list-style: none; color: #fbbf24; font-size: 0.75rem; display: flex; flex-direction: column; gap: 0.375rem; }
    .footer { text-align: center; margin-top: 1.5rem; color: #475569; font-size: 0.75rem; }

    .toolbar { display: flex; gap: 0.5rem; margin-left: auto; flex-shrink: 0; align-items: center; }
    .toolbar-toggle { background: transparent; border: none; color: #475569; cursor: pointer; font-size: 1.25rem; line-height: 1; padding: 0.25rem 0.5rem; border-radius: 0.375rem; transition: color 0.2s, background 0.2s; }
    .toolbar-toggle:hover { color: #94a3b8; background: rgba(30, 41, 59, 0.5); }
    .toolbar-actions { display: none; gap: 0.5rem; flex-wrap: wrap; }
    .toolbar.expanded .toolbar-actions { display: flex; }
    .toolbar-actions button { background: rgba(30, 41, 59, 0.8); border: 1px solid #334155; color: #94a3b8; padding: 0.375rem 0.75rem; border-radius: 0.375rem; font-family: inherit; font-size: 0.75rem; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
    .toolbar-actions button:hover { background: rgba(51, 65, 85, 0.8); color: white; border-color: #475569; }

    @media (max-width: 640px) {
      body { padding: 1rem; }
      .stats { grid-template-columns: repeat(2, 1fr); }
      .subtitle { margin-left: 0; }
      .diagram-container { padding: 0.75rem; }
    }
    @media print {
      body { background: #020617; padding: 1rem; }
      .toolbar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="container" id="report-container">
    <div class="header">
      <div class="header-row">
        <div class="pulse-dot"></div>
        <h1>Covet — Tiến độ task</h1>
        <div class="toolbar">
          <div class="toolbar-actions">
            <button onclick="copyAsImage(this)">📋 Copy</button>
            <button onclick="downloadPNG(this)">🖼️ PNG</button>
            <button onclick="downloadPDF(this)">📄 PDF</button>
          </div>
          <button class="toolbar-toggle" onclick="this.parentElement.classList.toggle('expanded')" title="Export options" aria-label="Export options">⋯</button>
        </div>
      </div>
      <p class="subtitle">Sinh lúc ${escapeHtml(generatedAt)} từ docs/tasks/README.md và docs/tasks/*/progress.md</p>
    </div>

    <div class="stats">
      <div class="stat"><div class="stat-value">${tasks.length}</div><div class="stat-label">tổng số task</div></div>
      <div class="stat"><div class="stat-value" style="color:${STATUS.done.stroke}">${done}</div><div class="stat-label">✅ xong</div></div>
      <div class="stat"><div class="stat-value"><span style="color:${STATUS.doing.stroke}">${doing}</span> / <span style="color:${STATUS.todo.stroke}">${todo}</span></div><div class="stat-label">🔄 đang làm / ⬜ chưa làm${other ? ` · ${other} khác` : ""}</div></div>
      <div class="stat"><div class="stat-value">${stepsTotal ? `${percent(stepsDone, stepsTotal)}%` : "—"}</div><div class="stat-label">bước đã xong (${stepsDone}/${stepsTotal})</div></div>
    </div>

    ${warningsHtml}

    <h2 class="section-title">Sơ đồ phụ thuộc</h2>
    <div class="diagram-container">
      ${renderDiagram(tasks)}
    </div>

    <h2 class="section-title">Chi tiết task</h2>
    <div class="cards">${tasks.length ? tasks.map(renderCard).join("") : `<p class="empty">Chưa có task nào.</p>`}
    </div>

    <h2 class="section-title">Chú thích</h2>
    <div class="card"><ul class="legend">${legendHtml}</ul></div>

    <p class="footer">Covet • File sinh tự động bởi npm run tasks:dashboard — không sửa tay</p>
  </div>

  <script type="application/json" id="tasks-data">${data}</script>
  <script>
    async function copyAsImage(btn) {
      const orig = btn.textContent;
      try {
        const el = document.getElementById('report-container');
        const r = el.getBoundingClientRect();
        const pad = 32;
        const canvas = await html2canvas(document.body, { backgroundColor: '#020617', scale: 2, useCORS: true, ignoreElements: (e) => e.classList && e.classList.contains('toolbar'), x: r.left + window.scrollX - pad, y: r.top + window.scrollY - pad, width: r.width + pad * 2, height: r.height + pad * 2 });
        const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        btn.textContent = '✓ Copied!';
      } catch (e) {
        btn.textContent = '✗ Failed';
      }
      setTimeout(() => btn.textContent = orig, 2000);
    }

    async function downloadPNG(btn) {
      const orig = btn.textContent;
      btn.textContent = '⏳ ...';
      try {
        const el = document.getElementById('report-container');
        const r = el.getBoundingClientRect();
        const pad = 32;
        const canvas = await html2canvas(document.body, { backgroundColor: '#020617', scale: 2, useCORS: true, ignoreElements: (e) => e.classList && e.classList.contains('toolbar'), x: r.left + window.scrollX - pad, y: r.top + window.scrollY - pad, width: r.width + pad * 2, height: r.height + pad * 2 });
        const link = document.createElement('a');
        link.download = 'covet-tasks-dashboard.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        btn.textContent = '✓ Done!';
      } catch (e) {
        btn.textContent = '✗ Failed';
      }
      setTimeout(() => btn.textContent = orig, 2000);
    }

    async function downloadPDF(btn) {
      const orig = btn.textContent;
      btn.textContent = '⏳ ...';
      try {
        const el = document.getElementById('report-container');
        const r = el.getBoundingClientRect();
        const pad = 32;
        const canvas = await html2canvas(document.body, { backgroundColor: '#020617', scale: 2, useCORS: true, ignoreElements: (e) => e.classList && e.classList.contains('toolbar'), x: r.left + window.scrollX - pad, y: r.top + window.scrollY - pad, width: r.width + pad * 2, height: r.height + pad * 2 });
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const orientation = canvas.width > canvas.height ? 'landscape' : 'portrait';
        const pdf = new jsPDF({ orientation, unit: 'px', format: [canvas.width, canvas.height], hotfixes: ['px_scaling'] });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save('covet-tasks-dashboard.pdf');
        btn.textContent = '✓ Done!';
      } catch (e) {
        btn.textContent = '✗ Failed';
      }
      setTimeout(() => btn.textContent = orig, 2000);
    }
  </script>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

let tasks = [];
try {
  tasks = collectTasks();
  assignLevels(tasks);
} catch (error) {
  warn(`Lỗi không mong đợi khi đọc task: ${error.message}`);
  tasks = [];
}

const generatedAt = localTimestamp(new Date());
try {
  writeFileSync(OUT_FILE, renderPage(tasks, generatedAt), "utf8");
} catch (error) {
  console.error(`Không ghi được ${OUT_FILE}: ${error.message}`);
  process.exit(1);
}

console.log(`Tasks dashboard -> ${relative(ROOT, OUT_FILE).replace(/\\/g, "/")} (${generatedAt})`);
console.log(`Task đọc được: ${tasks.length}`);
for (const task of tasks) {
  const aux = task.progress ? task.progress.steps.filter((s) => !s.numbered).length : 0;
  const steps = task.progress ? `${task.stepsDone}/${task.stepsTotal} bước ✅${aux ? ` (+${aux} mục phụ)` : ""}` : "chưa có tiến độ";
  console.log(`  ${task.nn} ${task.slug ?? "(chưa có thư mục)"}: ${steps} · README ${STATUS[task.status].symbol}`);
}
console.log(`Cảnh báo: ${warnings.length}`);
