import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../public/data');
const CSV_FILE = path.join(DATA_DIR, 'wind_farm_data.csv');

const TOTAL_TURBINES = 30;
const RATED_CAPACITY_PER_TURBINE = 2.5;
const LINES = ['L1', 'L2', 'L3', 'L4', 'L5'];

const turbineInfo = [];
for (let i = 1; i <= TOTAL_TURBINES; i++) {
  const turbineId = `WT-${String(i).padStart(3, '0')}`;
  const line = LINES[Math.floor((i - 1) / 6)];
  turbineInfo.push({ turbineId, line });
}

const maintenanceStatus = {};
turbineInfo.forEach(t => {
  maintenanceStatus[t.turbineId] = {
    inMaintenance: false,
    maintenanceEndTime: null
  };
});

const dailyGeneration = {};
turbineInfo.forEach(t => {
  dailyGeneration[t.turbineId] = 0;
});

let lastPower = {};
turbineInfo.forEach(t => {
  lastPower[t.turbineId] = RATED_CAPACITY_PER_TURBINE * 0.6;
});

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getWindSpeed() {
  return 3 + Math.random() * 12;
}

function getPowerFromWindSpeed(windSpeed) {
  const minPower = RATED_CAPACITY_PER_TURBINE * 0.3;
  const maxPower = RATED_CAPACITY_PER_TURBINE * 0.95;
  const normalizedWind = (windSpeed - 3) / 12;
  const basePower = minPower + normalizedWind * (maxPower - minPower);
  const noise = (Math.random() - 0.5) * 0.2 * RATED_CAPACITY_PER_TURBINE;
  return Math.max(minPower, Math.min(maxPower, basePower + noise));
}

function updateMaintenanceStatus(currentTime) {
  turbineInfo.forEach(t => {
    const status = maintenanceStatus[t.turbineId];
    if (status.inMaintenance) {
      if (currentTime >= status.maintenanceEndTime) {
        status.inMaintenance = false;
        status.maintenanceEndTime = null;
        console.log(`${t.turbineId} 检修完成，恢复运行`);
      }
    } else {
      if (Math.random() < 0.002) {
        status.inMaintenance = true;
        const duration = 30 * 60 * 1000 + Math.random() * 90 * 60 * 1000;
        status.maintenanceEndTime = currentTime + duration;
        console.log(`${t.turbineId} 开始检修，预计 ${Math.round(duration / 60000)} 分钟后恢复`);
      }
    }
  });
}

function generateRow(timestamp) {
  const currentTime = timestamp.getTime();
  updateMaintenanceStatus(currentTime);

  const rows = [];
  const timeStr = timestamp.toISOString();

  turbineInfo.forEach(t => {
    const status = maintenanceStatus[t.turbineId];
    let power, windSpeed, state;

    if (status.inMaintenance) {
      power = 0;
      windSpeed = getWindSpeed();
      state = '停机';
    } else {
      windSpeed = getWindSpeed();
      const basePower = getPowerFromWindSpeed(windSpeed);
      const smoothFactor = 0.7;
      power = smoothFactor * lastPower[t.turbineId] + (1 - smoothFactor) * basePower;
      power = Math.round(power * 100) / 100;
      state = power > 0.1 ? '运行' : '停机';
    }

    lastPower[t.turbineId] = power > 0 ? power : lastPower[t.turbineId];

    const generationInterval = power * (30 / 3600);
    dailyGeneration[t.turbineId] += generationInterval;

    if (power < 0.1 && !status.inMaintenance && Math.random() < 0.01) {
      state = '故障';
    }

    rows.push({
      timestamp: timeStr,
      turbineId: t.turbineId,
      line: t.line,
      power: power.toFixed(2),
      windSpeed: windSpeed.toFixed(2),
      dailyGeneration: dailyGeneration[t.turbineId].toFixed(4),
      state: state
    });
  });

  return rows;
}

function initCSV() {
  ensureDataDir();
  const header = 'timestamp,turbineId,line,power,windSpeed,dailyGeneration,state\n';
  fs.writeFileSync(CSV_FILE, header);
  console.log('CSV 文件已初始化');
}

function appendRows(rows) {
  const csvLines = rows.map(r => 
    `${r.timestamp},${r.turbineId},${r.line},${r.power},${r.windSpeed},${r.dailyGeneration},${r.state}`
  ).join('\n') + '\n';
  fs.appendFileSync(CSV_FILE, csvLines);
}

function generateHistoricalData() {
  console.log('开始生成过去24小时的历史数据...');
  const now = new Date();
  
  for (let hour = 24; hour >= 1; hour--) {
    const historicalTime = new Date(now.getTime() - hour * 60 * 60 * 1000);
    const rows = generateRow(historicalTime);
    appendRows(rows);
    process.stdout.write(`\r已生成 ${25 - hour}/24 小时数据`);
  }
  
  const currentRows = generateRow(now);
  appendRows(currentRows);
  console.log('\n历史数据生成完成！');
}

function startRealTimeGeneration() {
  console.log('开始实时数据生成（每3秒写入一条，代表实际30秒）...');
  let count = 0;
  
  setInterval(() => {
    const now = new Date();
    const rows = generateRow(now);
    appendRows(rows);
    count++;
    if (count % 10 === 0) {
      console.log(`已写入 ${count} 条实时数据，当前时间: ${now.toLocaleTimeString()}`);
    }
  }, 3000);
}

function main() {
  initCSV();
  generateHistoricalData();
  startRealTimeGeneration();
}

main();
