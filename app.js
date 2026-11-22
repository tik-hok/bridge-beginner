// 共用：學習步驟、進度、互動小練習
const STEPS = [
  { file: "step1.html", title: "認識桌子和牌", sub: "4 個人、2 隊、52 張牌" },
  { file: "step2.html", title: "打牌：跟牌和「墩」", sub: "像比大小一樣簡單" },
  { file: "step3.html", title: "王牌和將吃", sub: "小黑桃也能打敗 A" },
  { file: "step4.html", title: "叫牌：喊價決定合約", sub: "數字 + 花色" },
  { file: "step5.html", title: "夢家：一人指揮兩手牌", sub: "橋牌最特別的地方" },
  { file: "step6.html", title: "數點力：牌有多強？", sub: "A=4、K=3、Q=2、J=1" },
  { file: "step7.html", title: "下一步怎麼練", sub: "迷你橋牌與練習平台" },
];

const RANK_ORDER = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
const SUIT_COLOR = { "♠": "black", "♥": "red", "♦": "red", "♣": "black" };
const SEAT_NAME = { N: "北", E: "東", S: "南（你）", W: "西" };

function store(get, val) {
  try {
    const key = "bridge-beginner-done";
    const done = JSON.parse(localStorage.getItem(key) || "[]");
    if (get) return done;
    if (!done.includes(val)) { done.push(val); localStorage.setItem(key, JSON.stringify(done)); }
  } catch (e) { return []; }
}

function cardHTML(c) {
  const suit = c[0], rank = c.slice(1);
  return `<span class="pc ${SUIT_COLOR[suit]}">${suit}${rank}</span>`;
}

// 頁首進度與上一步 / 下一步
function setupStepPage() {
  const n = Number(document.body.dataset.step || 0);
  if (!n) return;
  store(false, n);
  const bar = document.querySelector(".bar > span");
  if (bar) bar.style.width = (n / STEPS.length * 100) + "%";
  const count = document.querySelector(".top .count");
  if (count) count.textContent = `第 ${n} 步 / 共 ${STEPS.length} 步`;
  const nav = document.querySelector(".stepnav");
  if (!nav) return;
  const prev = n > 1 ? STEPS[n - 2] : null;
  const next = n < STEPS.length ? STEPS[n] : null;
  nav.innerHTML =
    (prev ? `<a href="${prev.file}">← 上一步<small>${prev.title}</small></a>`
          : `<a href="index.html">← 回首頁<small>學習地圖</small></a>`) +
    (next ? `<a class="next" href="${next.file}">下一步 →<small>${next.title}</small></a>`
          : `<a class="next" href="index.html">完成！回首頁 🎉<small>看看你的學習地圖</small></a>`);
}

// 首頁學習地圖
function setupMap() {
  const map = document.querySelector(".map");
  if (!map) return;
  const done = store(true) || [];
  map.innerHTML = STEPS.map((s, i) =>
    `<li class="${done.includes(i + 1) ? "done" : ""}"><a href="${s.file}">
      <span class="num"><span>${i + 1}</span></span>
      <span><b>${s.title}</b><small>${s.sub}</small></span></a></li>`).join("");
  const start = document.querySelector("#start");
  if (start) {
    const nextIdx = STEPS.findIndex((_, i) => !done.includes(i + 1));
    if (done.length && nextIdx >= 0) { start.href = STEPS[nextIdx].file; start.textContent = `繼續第 ${nextIdx + 1} 步 →`; }
    else if (nextIdx < 0) { start.textContent = "全部完成！再複習一次 →"; }
  }
}

// 選擇題：<div class="quiz" data-answer="b"> 內含 button[data-v] 與 .feedback
function setupQuizzes() {
  document.querySelectorAll(".quiz").forEach(q => {
    const fb = q.querySelector(".feedback");
    q.querySelectorAll(".options button").forEach(b => {
      b.addEventListener("click", () => {
        if (b.dataset.v === q.dataset.answer) {
          b.classList.add("right");
          fb.className = "feedback ok";
          fb.textContent = "答對了！" + (q.dataset.explain || "");
        } else {
          b.classList.add("wrong");
          fb.className = "feedback no";
          fb.textContent = "再想想看～" + (b.dataset.hint || "");
        }
      });
    });
  });
}

// 誰贏這墩：<div class="trick" data-lead="N" data-trump="♠" data-cards="N:♥5,E:♥K,S:♥2,W:♣A">
function trickWinner(cards, leadSeat, trump) {
  const leadSuit = cards[leadSeat][0];
  let best = null;
  for (const [seat, c] of Object.entries(cards)) {
    const s = c[0], r = RANK_ORDER.indexOf(c.slice(1));
    const score = (trump && s === trump) ? 100 + r : (s === leadSuit ? r : -1);
    if (!best || score > best.score) best = { seat, score };
  }
  return best.seat;
}

function setupTricks() {
  document.querySelectorAll(".trick").forEach(t => {
    const cards = Object.fromEntries(t.dataset.cards.split(",").map(x => x.split(":")));
    const lead = t.dataset.lead, trump = t.dataset.trump || "";
    const winner = trickWinner(cards, lead, trump);
    const felt = document.createElement("div");
    felt.className = "felt";
    felt.innerHTML = ["N", "W", "E", "S"].map(s =>
      `<div class="seat ${s.toLowerCase()}">${SEAT_NAME[s]} ${s === lead ? '<span class="lead-tag">先出</span>' : ""}
        <button type="button" data-seat="${s}" aria-label="${SEAT_NAME[s]} 出 ${cards[s]}">${cardHTML(cards[s])}</button></div>`).join("")
      + `<div class="center">${trump ? "王牌：" + trump : "無王"}<br>點你覺得贏的牌</div>`;
    t.appendChild(felt);
    const fb = document.createElement("div");
    fb.className = "feedback";
    t.appendChild(fb);
    felt.querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
      felt.querySelectorAll(".seat").forEach(x => x.classList.remove("win"));
      if (b.dataset.seat === winner) {
        b.parentElement.classList.add("win");
        fb.className = "feedback ok";
        fb.textContent = "答對了！" + (t.dataset.explain || "");
      } else {
        fb.className = "feedback no";
        fb.textContent = "不是這張喔。" + (t.dataset.hint || "提示：先看有沒有人出王牌，再看先出的花色。");
      }
    }));
  });
}

// 叫品換算器
function setupBidCalc() {
  const box = document.querySelector("#bidcalc");
  if (!box) return;
  const lv = box.querySelector("#lv"), st = box.querySelector("#st"), out = box.querySelector(".result-big");
  const update = () => {
    const l = Number(lv.value), s = st.value;
    const trumpText = s === "NT" ? "沒有王牌（無王）" : `${s} 當王牌`;
    let note = "";
    const game = { "NT": 3, "♠": 4, "♥": 4, "♦": 5, "♣": 5 }[s];
    if (l === 7) note = "（這是大滿貫，13 墩全拿！）";
    else if (l === 6) note = "（這是小滿貫！）";
    else if (l >= game) note = "（這是「成局」合約，分數比較高）";
    out.innerHTML = `${l}${s}：${trumpText}，要贏 6 + ${l} = <span style="color:var(--felt)">${6 + l} 墩</span> ${note}`;
  };
  lv.addEventListener("change", update); st.addEventListener("change", update); update();
}

// 點力練習：隨機發 13 張
function setupPoints() {
  const box = document.querySelector("#points");
  if (!box) return;
  const handEl = box.querySelector(".hand"), input = box.querySelector("input"), fb = box.querySelector(".feedback");
  let answer = 0;
  const deal = () => {
    const deck = [];
    for (const s of ["♠", "♥", "♦", "♣"]) for (const r of RANK_ORDER) deck.push(s + r);
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    const hand = deck.slice(0, 13).sort((a, b) =>
      "♠♥♣♦".indexOf(a[0]) - "♠♥♣♦".indexOf(b[0]) || RANK_ORDER.indexOf(b.slice(1)) - RANK_ORDER.indexOf(a.slice(1)));
    answer = hand.reduce((t, c) => t + ({ A: 4, K: 3, Q: 2, J: 1 }[c.slice(1)] || 0), 0);
    handEl.innerHTML = hand.map(cardHTML).join("");
    input.value = ""; fb.textContent = ""; fb.className = "feedback";
  };
  box.querySelector("#check").addEventListener("click", () => {
    const v = Number(input.value);
    if (input.value === "") { fb.className = "feedback no"; fb.textContent = "先輸入你算出來的點數喔！"; return; }
    if (v === answer) {
      fb.className = "feedback ok";
      fb.textContent = `答對了！共 ${answer} 點。` + (answer >= 12 ? "12 點以上，可以考慮主動開叫！" : "還不到 12 點，通常先 Pass 聽聽看別人怎麼叫。");
    } else {
      fb.className = "feedback no";
      fb.textContent = v > answer ? "多算了一點點，再數一次 A、K、Q、J。" : "少算了，再找找看有沒有漏掉的大牌。";
    }
  });
  box.querySelector("#redeal").addEventListener("click", deal);
  deal();
}

document.addEventListener("DOMContentLoaded", () => {
  setupStepPage(); setupMap(); setupQuizzes(); setupTricks(); setupBidCalc(); setupPoints();
});
