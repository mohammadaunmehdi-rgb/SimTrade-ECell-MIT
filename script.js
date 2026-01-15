// script.js
let time = 60;
const MAX_POINTS = 60;
let TOTAL_TIME = 60; // FIXED absolute timeline

const timeEl = document.getElementById("time");
const grid = document.getElementById("grid");
const results = document.getElementById("results");
const resultTable = document.getElementById("resultTable");
const netPL = document.getElementById("netPL");
const durationInput = document.getElementById("durationInput");

durationInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const val = parseInt(durationInput.value);
    if (!isNaN(val) && val > 0) {
      TOTAL_TIME = val;
      time = val;
      timeEl.innerText = time; // update top-right clock instantly
    }
  }
});

const stocks = [
  { name: "GOOG", price: 100, history: [], trades: [], owned: 0, invested: 0, realizedPL: 0 },
  { name: "AMD", price: 120, history: [], trades: [], owned: 0, invested: 0, realizedPL: 0 },
  { name: "MSFT", price: 80, history: [], trades: [], owned: 0, invested: 0, realizedPL: 0 },
  { name: "AAPL", price: 150, history: [], trades: [], owned: 0, invested: 0, realizedPL: 0 },
  { name: "NVDA", price: 60, history: [], trades: [], owned: 0, invested: 0, realizedPL: 0 }
];

stocks.forEach((s, i) => {
  s.history.push(s.price);
  grid.innerHTML += `
    <div class="stockCard">
      <h3>
        ${s.name}
        <span id="pl${i}" style="margin-left:10px; font-size:18px;">$0</span>
      </h3>
      <canvas id="c${i}" width="380" height="200"></canvas>
      <div>Owned: <span id="own${i}">0</span></div>
      <button class="buy" onclick="buy(${i})">BUY</button>
      <button class="sell" onclick="sell(${i})">SELL</button>
    </div>
  `;
});

function tick() {
  time--;
  timeEl.innerText = time;

  stocks.forEach((s, i) => {
    s.price = Math.max(5, s.price + Math.floor(Math.random() * 11) - 5);
    s.history.push(s.price);
    drawChart(i);
    updatePL(i);
  });

  if (time <= 0) endGame();
}

function buy(i) {
  const s = stocks[i];
  s.owned++;
  s.invested += s.price;
  s.trades.push(s.price);
  document.getElementById(`own${i}`).innerText = s.owned;
  updatePL(i);
}

function sell(i) {
  const s = stocks[i];

  if (s.owned > 0) {
    const avgCost = s.invested / s.owned;
    const profitFromSale = s.price - avgCost;
    s.realizedPL += profitFromSale;

    s.trades.pop();
    s.invested -= avgCost;
    s.owned--;

    document.getElementById(`own${i}`).innerText = s.owned;
    updatePL(i);
  }
}

function drawChart(i) {
  const s = stocks[i];
  const canvas = document.getElementById(`c${i}`);
  const ctx = canvas.getContext("2d");
  const data = s.history;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (data.length < 2) return;

  const max = Math.max(...data);
  const min = Math.min(...data);

  // Y-axis labels (live prices)
  ctx.fillStyle = "#94a3b8";
  ctx.font = "12px Arial";

  const steps = 4;
  for (let j = 0; j <= steps; j++) {
  const price = min + (j / steps) * (max - min || 1);
  const y = 180 - (j / steps) * 160;

  ctx.fillText(`$${price.toFixed(0)}`, 2, y + 4);
  }  

  ctx.strokeStyle = "#64748b";
  ctx.beginPath();
  ctx.moveTo(30, 10);
  ctx.lineTo(30, 180);
  ctx.lineTo(370, 180);
  ctx.stroke();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();

  const currentTime = data.length - 1 || 1;

  data.forEach((p, idx) => {
    const x = 30 + (idx / currentTime) * 340;
    const y = 180 - ((p - min) / (max - min || 1)) * 160;
    idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });

  ctx.stroke();

  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = "#facc15";
  s.trades.forEach(price => {
    const y = 180 - ((price - min) / (max - min || 1)) * 160;
    ctx.beginPath();
    ctx.moveTo(30, y);
    ctx.lineTo(370, y);
    ctx.stroke();
  });
  ctx.setLineDash([]);
}

function updatePL(i) {
  const s = stocks[i];
  const plEl = document.getElementById(`pl${i}`);
  if (!plEl) return;

  const unrealizedPL = s.owned === 0 ? 0 : (s.owned * s.price - s.invested);
  const totalPL = s.realizedPL + unrealizedPL;

  if (totalPL === 0) {
    plEl.innerText = "$0";
    plEl.style.color = "#e5e7eb";
  } else if (totalPL > 0) {
    plEl.innerText = `+$${totalPL.toFixed(0)}`;
    plEl.style.color = "#22c55e";
  } else {
    plEl.innerText = `-$${Math.abs(totalPL).toFixed(0)}`;
    plEl.style.color = "#ef4444";
  }
}

function endGame() {
  clearInterval(timer);
  results.classList.remove("hidden");

  let totalPL = 0;
  resultTable.innerHTML =
    `<tr><th>Stock</th><th>Owned</th><th>Invested</th><th>Current Value</th><th>P/L</th></tr>`;

  stocks.forEach(s => {
    const value = s.owned * s.price;
    const unrealizedPL = value - s.invested;
    const pl = s.realizedPL + unrealizedPL;
    totalPL += pl;

    resultTable.innerHTML += `
      <tr>
        <td>${s.name}</td>
        <td>${s.owned}</td>
        <td>$${s.invested.toFixed(0)}</td>
        <td>$${value.toFixed(0)}</td>
        <td style="color:${pl >= 0 ? '#22c55e' : '#ef4444'}">
          $${pl.toFixed(0)}
        </td>
      </tr>
    `;
  });

  if (totalPL === 0) {
  netPL.innerText = "Net Earning: $0";
  netPL.style.color = "#e5e7eb";
  } else if (totalPL > 0) {
  netPL.innerText = `Net Earning: +$${totalPL.toFixed(0)}`;
  netPL.style.color = "#22c55e";
  } else {
  netPL.innerText = `Net Earning: -$${Math.abs(totalPL).toFixed(0)}`;
  netPL.style.color = "#ef4444";

  // Scroll to absolute bottom when game ends
  setTimeout(() => {
  window.scrollTo({ 
    top: document.body.scrollHeight,
    behavior: "smooth"
  });
  }, 500);  
  }
}

const startBtn = document.getElementById("startBtn");
const countdown = document.getElementById("countdown");
const countNum = document.getElementById("countNum");

let timer;

countdown.style.display = "none";
countdown.style.pointerEvents = "none";

startBtn.onclick = () => {
  startBtn.disabled = true;

  TOTAL_TIME = parseInt(durationInput.value);
  time = TOTAL_TIME;
  timeEl.innerText = time;

  countdown.style.display = "flex";
  countdown.style.pointerEvents = "auto";

  let count = 3;
  countNum.innerText = count;

  const cd = setInterval(() => {
    count--;
    countNum.innerText = count;

    if (count === 0) {
      clearInterval(cd);
      countdown.style.display = "none";
      countdown.style.pointerEvents = "none";
      timer = setInterval(tick, 1000);
    }
  }, 1000);
};

stocks.forEach((_, i) => drawChart(i));

function restartGame() {
  window.scrollTo(0, 0);   // force scroll to top
  location.reload();
}

