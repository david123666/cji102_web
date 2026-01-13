var liffID = '2008825433-EiKVRQPf';

window.onload = function (e) {
    // 初始化 LIFF
    liff.init({ liffId: liffID }).then(function () {
        
        // 檢查是否已登入
        if (!liff.isLoggedIn()) {
            // 未登入，導向登入頁面
            liff.login({
                redirectUri: window.location.href // 登入後回到當前頁面
            });
        } else {
            // 已登入，取得使用者 Profile
            liff.getProfile().then(function (prof) {
                var userId = prof.userId;
                
                console.log("取得 User ID: " + userId);
                // formData.append('line_user_id', userId); // 👈 關鍵：把 ID 傳給 PHP
                fetch('api/analyze.php', { method: 'POST', body: userId });
                // 在此處處理您的邏輯，例如顯示在畫面上
                document.body.innerHTML = "<h1>您的 LINE ID: " + userId + "</h1>";
            }).catch(function (error) {
                console.error("取得 Profile 失敗:", error);
            });
        }
        
    }).catch(function (err) {
        console.error("LIFF 初始化失敗:", err);
    });
};
// assets/app.js
const AUTH_KEY = "skinapp_auth";
const RESULT_KEY = "skinapp_result";
const DEV_FORCE_MOCK = false; // 需要時可改 true，強制用 mock

export function toast(msg) {
  const el = document.getElementById("toast");
  if (!el) return alert(msg);
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2400);
}

// ---- Safe fetch helpers (不讓頁面因為 JSON 解析失敗而爆炸) ----
async function safeText(res) {
  try { return await res.text(); } catch { return ""; }
}

export async function safeJsonFetch(url, options = {}, fallback = null) {
  try {
    const res = await fetch(url, { cache: "no-store", ...options });
    const text = await safeText(res);

    // PHP 沒跑 or 回 HTML 時，通常會是 "<" 開頭
    if (text.trim().startsWith("<")) {
      return { ok: false, status: res.status, isHtml: true, data: fallback, raw: text };
    }

    const data = text ? JSON.parse(text) : fallback;
    return { ok: res.ok, status: res.status, data, raw: text };
  } catch (err) {
    return { ok: false, status: 0, error: err, data: fallback, raw: "" };
  }
}

// ---- Backend availability detection ----
async function backendAvailable() {
  if (DEV_FORCE_MOCK) return false;

  // 用 me.php 探測（正式後端應回 JSON；沒跑 PHP 會回 "<?php" or HTML）
  const r = await safeJsonFetch("./api/me.php", {}, null);
  if (r.ok && r.data && typeof r.data === "object") return true;

  // 若是 isHtml 幾乎肯定是靜態伺服器沒跑 PHP
  if (r.isHtml) return false;

  // 其他狀況也視為不可用（例如 404）
  return false;
}

// ---- Auth (前端版；正式可換成後端 session) ----
export function isLoggedIn() {
  return localStorage.getItem(AUTH_KEY) === "1";
}
export function setLoggedIn(v) {
  localStorage.setItem(AUTH_KEY, v ? "1" : "0");
}

export async function requireLogin({ silent = false } = {}) {
  // 若前端已登入，直接放行
  if (isLoggedIn()) return true;

  // 若後端可用，問後端是否已登入（session）
  if (await backendAvailable()) {
    const me = await safeJsonFetch("./api/me.php", {}, { ok: false });
    if (me.ok && me.data?.ok) {
      setLoggedIn(true);
      return true;
    }
  }

  if (!silent) location.href = "login.html";
  return false;
}

export async function doLogin(username, password) {
  // 後端可用 → 打真 API
  if (await backendAvailable()) {
    const body = new FormData();
    body.append("username", username);
    body.append("password", password);

    const r = await safeJsonFetch("./api/login.php", { method: "POST", body }, { ok: false });
    if (r.ok && r.data?.ok) {
      setLoggedIn(true);
      return { ok: true };
    }
    return { ok: false, message: r.data?.message || "登入失敗" };
  }

  // 後端不可用 → mock 登入（開發用）
  if (username.trim() && password.trim()) {
    setLoggedIn(true);
    return { ok: true, mock: true };
  }
  return { ok: false, message: "請輸入帳號密碼" };
}

export function logout() {
  setLoggedIn(false);
  localStorage.removeItem(RESULT_KEY);
  location.href = "index.html";
}

// ---- Result storage ----
export function saveResult(payload) {
  localStorage.setItem(RESULT_KEY, JSON.stringify(payload));
}
export function loadResult() {
  try {
    const raw = localStorage.getItem(RESULT_KEY) || localStorage.getItem("result");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ---- Analyze API (真後端或 mock) ----
function mockAnalyzePayload() {
  // 你可以之後用真的 AI 分析替換
  return {
    ok: true,
    overall: 82,
    photo_url: null,
    metrics: {
      hydration: 76,
      oil: 42,
      redness: 28,
      pores: 55,
      pigmentation: 36,
      texture: 61
    },
    tips: [
      "保濕：晚間加強保濕精華，白天使用含玻尿酸乳液。",
      "泛紅：避免過熱水洗臉，降低刺激性保養。",
      "毛孔：每週 1–2 次溫和去角質，注意防曬。"
    ]
  };
}

export async function analyzePhoto(blob) {
  // 後端可用 → 真上傳
  if (await backendAvailable()) {
    const form = new FormData();
    form.append("photo", blob, "capture.jpg");

    const res = await fetch("./api/analyze.php", { method: "POST", body: form });
    const text = await safeText(res);

    if (text.trim().startsWith("<")) {
      return { ok: false, message: "後端回傳非 JSON（請確認 PHP/路由）" };
    }
    const data = text ? JSON.parse(text) : null;
    return data || { ok: false, message: "後端無資料" };
  }

  // 後端不可用 → mock
  await new Promise(r => setTimeout(r, 650)); // 假裝分析時間
  return mockAnalyzePayload();
}

// ---- Simple charts ----
export function drawBarChart(canvas, valuesObj) {
  const ctx = canvas.getContext("2d");
  const entries = Object.entries(valuesObj);
  const w = canvas.width, h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const padding = 18;
  const barGap = 10;
  const barH = Math.floor((h - padding * 2 - barGap * (entries.length - 1)) / entries.length);
  const max = 100;

  // axis bg
  ctx.globalAlpha = 0.16;
  ctx.fillRect(padding, padding, w - padding * 2, h - padding * 2);
  ctx.globalAlpha = 1;

  ctx.font = "12px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif";
  ctx.textBaseline = "middle";

  entries.forEach(([k, v], i) => {
    const y = padding + i * (barH + barGap);
    const x0 = padding + 110;
    const trackW = w - padding - x0;

    // label
    ctx.fillStyle = "rgba(255,255,255,.78)";
    ctx.fillText(k, padding + 6, y + barH / 2);

    // track
    ctx.fillStyle = "rgba(0,0,0,.22)";
    ctx.fillRect(x0, y, trackW, barH);

    // bar
    const bw = Math.max(0, Math.min(trackW, (v / max) * trackW));
    ctx.fillStyle = "rgba(242, 216, 140, .92)"; // 香檳金
    ctx.fillRect(x0, y, bw, barH);

    // value
    ctx.fillStyle = "rgba(255,255,255,.9)";
    ctx.fillText(String(v), x0 + trackW + 8, y + barH / 2);
  });
}

export function drawRadar(canvas, valuesObj) {
  const ctx = canvas.getContext("2d");
  const keys = Object.keys(valuesObj);
  const vals = keys.map(k => valuesObj[k]);

  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h / 2;
  const r = Math.min(w, h) * 0.34;

  ctx.clearRect(0, 0, w, h);
  ctx.translate(0.5, 0.5);

  const levels = 5;

  // grid
  for (let lv = 1; lv <= levels; lv++) {
    const rr = (r * lv) / levels;
    ctx.beginPath();
    keys.forEach((_, i) => {
      const ang = (Math.PI * 2 * i) / keys.length - Math.PI / 2;
      const x = cx + Math.cos(ang) * rr;
      const y = cy + Math.sin(ang) * rr;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.strokeStyle = "rgba(255,255,255,.18)";
    ctx.stroke();
  }

  // axis + labels
  ctx.font = "12px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif";
  ctx.fillStyle = "rgba(255,255,255,.75)";
  keys.forEach((k, i) => {
    const ang = (Math.PI * 2 * i) / keys.length - Math.PI / 2;
    const x = cx + Math.cos(ang) * (r + 18);
    const y = cy + Math.sin(ang) * (r + 18);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
    ctx.strokeStyle = "rgba(255,255,255,.14)";
    ctx.stroke();
    ctx.fillText(k, x - 18, y);
  });

  // polygon
  ctx.beginPath();
  vals.forEach((v, i) => {
    const ratio = Math.max(0, Math.min(1, v / 100));
    const ang = (Math.PI * 2 * i) / keys.length - Math.PI / 2;
    const x = cx + Math.cos(ang) * (r * ratio);
    const y = cy + Math.sin(ang) * (r * ratio);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = "rgba(255, 182, 193, .25)"; // 柔粉填色
  ctx.strokeStyle = "rgba(242, 216, 140, .9)"; // 金色線
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();

  ctx.setTransform(1,0,0,1,0,0);
}

export function renderMetricBars(container, metrics, config = {}) {
  const items = config.items || Object.keys(metrics);
  const labels = config.labels || {}; // 可把 glow -> 光澤 等等映射
  const max = config.max ?? 100;

  container.innerHTML = "";

  items.forEach((key) => {
    const value = Number(metrics[key] ?? 0);
    const label = labels[key] ?? key;

    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "140px 1fr 56px";
    row.style.alignItems = "center";
    row.style.gap = "10px";

    const name = document.createElement("div");
    name.textContent = label;
    name.style.fontSize = "13px";
    name.style.color = "rgba(22,22,26,.78)";
    name.style.fontWeight = "700";

    const track = document.createElement("div");
    track.style.height = "14px";
    track.style.borderRadius = "999px";
    track.style.background = "rgba(0,0,0,.08)";
    track.style.overflow = "hidden";
    track.style.border = "1px solid rgba(0,0,0,.06)";

    const fill = document.createElement("div");
    fill.style.height = "100%";
    fill.style.width = `${Math.max(0, Math.min(100, (value / max) * 100))}%`;
    fill.style.borderRadius = "999px";
    fill.style.background = "linear-gradient(90deg, rgba(255,157,184,.95), rgba(242,216,140,.92))";

    track.appendChild(fill);

    const score = document.createElement("div");
    score.textContent = isFinite(value) ? String(Math.round(value)) : "--";
    score.style.textAlign = "right";
    score.style.fontWeight = "900";
    score.style.color = "rgba(22,22,26,.86)";

    row.appendChild(name);
    row.appendChild(track);
    row.appendChild(score);

    container.appendChild(row);
  });
}
