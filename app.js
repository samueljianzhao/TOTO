const MAX_NUMBER = 49;
const STORAGE_KEY = 'toto_pick_history_v1';

const entryConfig = {
  ordinary: { count: 6, label: 'Ordinary Entry' },
  system7: { count: 7, label: 'System 7' },
  system8: { count: 8, label: 'System 8' },
};

const els = {
  entryType: document.getElementById('entryType'),
  poolCount: document.getElementById('poolCount'),
  luckyNumbers: document.getElementById('luckyNumbers'),
  generateBtn: document.getElementById('generateBtn'),
  saveBtn: document.getElementById('saveBtn'),
  clearBtn: document.getElementById('clearBtn'),
  results: document.getElementById('results'),
  insights: document.getElementById('insights'),
  history: document.getElementById('history'),
};

let currentPicks = [];

function toSortedUniqueNumbers(raw) {
  return [...new Set(raw)]
    .map((item) => Number.parseInt(item, 10))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= MAX_NUMBER)
    .sort((a, b) => a - b);
}

function generateSinglePick(numberCount, luckySet) {
  const selected = new Set(luckySet);

  while (selected.size < numberCount) {
    selected.add(Math.floor(Math.random() * MAX_NUMBER) + 1);
  }

  return [...selected].sort((a, b) => a - b);
}

function getFrequencyMap(picks) {
  const map = new Map();
  for (const ticket of picks) {
    for (const num of ticket.numbers) {
      map.set(num, (map.get(num) || 0) + 1);
    }
  }
  return map;
}

function summarizeInsights(picks) {
  if (!picks.length) return [];

  const frequency = getFrequencyMap(picks);
  const sorted = [...frequency.entries()].sort((a, b) => b[1] - a[1]);

  const hot = sorted.slice(0, 3).map(([n]) => n);
  const cold = [...Array(MAX_NUMBER).keys()]
    .map((n) => n + 1)
    .filter((n) => !frequency.has(n))
    .slice(0, 5);

  const oddEven = picks.map(({ numbers }) => {
    const odd = numbers.filter((n) => n % 2 === 1).length;
    return `${odd}奇/${numbers.length - odd}偶`;
  });

  return [
    `本轮热号（出现频次高）: ${hot.join(', ') || '暂无'}`,
    `本轮冷号（本轮未出现）: ${cold.join(', ') || '无'}`,
    `奇偶分布参考: ${oddEven.join(' | ')}`,
    '建议：避免所有注数完全重复同一区间，可适当混合高低位号码。',
  ];
}

function renderTickets(container, picks, emptyText = '暂无数据。') {
  if (!picks.length) {
    container.classList.add('empty');
    container.textContent = emptyText;
    return;
  }

  container.classList.remove('empty');
  container.innerHTML = picks
    .map(
      (ticket) => `
      <article class="ticket">
        <div><strong>${ticket.label}</strong> · ${ticket.time || ''}</div>
        <div class="numbers">
          ${ticket.numbers
            .map((n) => `<span class="ball ${ticket.luckySet?.has(n) ? 'lucky' : ''}">${n}</span>`)
            .join('')}
        </div>
      </article>`
    )
    .join('');
}

function loadHistory() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const list = JSON.parse(raw);
    return list.map((item) => ({
      ...item,
      numbers: toSortedUniqueNumbers(item.numbers),
      luckySet: new Set(item.luckyNumbers || []),
    }));
  } catch {
    return [];
  }
}

function saveHistory(picks) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      picks.map((item) => ({
        ...item,
        luckySet: undefined,
      }))
    )
  );
}

function renderInsights(lines) {
  els.insights.innerHTML = lines.map((line) => `<li>${line}</li>`).join('');
}

function buildPicks() {
  const config = entryConfig[els.entryType.value];
  const count = Math.min(Math.max(Number.parseInt(els.poolCount.value, 10) || 1, 1), 10);
  const luckyNumbers = toSortedUniqueNumbers(els.luckyNumbers.value.split(','));
  const luckySet = new Set(luckyNumbers.slice(0, config.count));

  const picks = [];
  for (let i = 0; i < count; i += 1) {
    picks.push({
      label: `${config.label} #${i + 1}`,
      numbers: generateSinglePick(config.count, luckySet),
      luckyNumbers,
      luckySet,
      time: new Date().toLocaleString('zh-CN', { hour12: false }),
    });
  }

  return picks;
}

function handleGenerate() {
  currentPicks = buildPicks();
  renderTickets(els.results, currentPicks, '点击“生成号码”开始。');
  renderInsights(summarizeInsights(currentPicks));
}

function handleSave() {
  if (!currentPicks.length) return;
  const history = loadHistory();
  const merged = [...currentPicks, ...history].slice(0, 30);
  saveHistory(merged);
  renderTickets(els.history, merged, '暂无保存记录。');
}

function handleClear() {
  localStorage.removeItem(STORAGE_KEY);
  renderTickets(els.history, [], '暂无保存记录。');
}

els.generateBtn.addEventListener('click', handleGenerate);
els.saveBtn.addEventListener('click', handleSave);
els.clearBtn.addEventListener('click', handleClear);

renderTickets(els.history, loadHistory(), '暂无保存记录。');
renderInsights(['点击“生成号码”后展示本轮统计信息。']);
