"use strict";

// EGOV_DATA / NTA_DATA は data.js で定義済み
let egovEntries = [];
let ntaEntries = [];

// ---- 検索 ----

function searchEgov(keyword) {
  const kw = keyword.toLowerCase();
  return egovEntries.filter((e) => {
    return [e.category, e.subcategory, e.detail, e.table]
      .join(" ")
      .toLowerCase()
      .includes(kw);
  });
}

function searchNta(keyword) {
  const kw = keyword.toLowerCase();
  return ntaEntries.filter((e) => {
    return [e.asset_name, e.category, e.subcategory, e.detail]
      .join(" ")
      .toLowerCase()
      .includes(kw);
  });
}

// ---- 描画 ----

function renderNtaCard(entry) {
  const refs = (entry.law_references || [])
    .filter((r) => r.trim())
    .map((r) => `<div class="ref-item">${escHtml(r)}</div>`)
    .join("");

  const tags = [entry.category, entry.subcategory, entry.detail]
    .filter(Boolean)
    .map((t) => `<span class="tag">${escHtml(t)}</span>`)
    .join("");

  const source = entry.source_url
    ? `<a href="${escHtml(entry.source_url)}" target="_blank">${escHtml(entry.source_title)}</a>`
    : escHtml(entry.source_title);

  return `
    <div class="card card-nta">
      <div class="card-title">${escHtml(entry.asset_name || "")}</div>
      <div class="card-meta">${tags}</div>
      <div class="card-years">⏱ ${entry.useful_life_years}<span>年</span></div>
      ${refs ? `<div class="card-refs">${refs}</div>` : ""}
      <div class="card-source">出典: ${source}</div>
    </div>`;
}

function renderEgovCard(entry) {
  const tags = [entry.category, entry.subcategory, entry.detail]
    .filter(Boolean)
    .map((t) => `<span class="tag">${escHtml(t)}</span>`)
    .join("");

  const meta = [entry.law_name, entry.law_num].filter(Boolean);
  const lawInfo = meta.length
    ? `<div class="card-source">📋 ${escHtml(meta.join(" / "))}</div>`
    : "";

  return `
    <div class="card card-egov">
      <div class="card-title">${escHtml(entry.detail || entry.subcategory || entry.category)}</div>
      <div class="card-meta">${tags}</div>
      <div class="card-years">⏱ ${entry.useful_life_years}<span>年</span></div>
      <div class="card-source">別表: ${escHtml(entry.table || "")}</div>
      ${lawInfo}
    </div>`;
}

function render(keyword) {
  const resultsEl = document.getElementById("results");
  const summaryEl = document.getElementById("summary");
  const emptyEl = document.getElementById("empty");
  const initialEl = document.getElementById("initial");

  const kw = keyword.trim();

  if (!kw) {
    resultsEl.innerHTML = "";
    summaryEl.classList.add("hidden");
    emptyEl.classList.add("hidden");
    initialEl.classList.remove("hidden");
    return;
  }

  initialEl.classList.add("hidden");

  const ntaMatched = searchNta(kw);
  const egovMatched = searchEgov(kw);
  const total = ntaMatched.length + egovMatched.length;

  if (total === 0) {
    resultsEl.innerHTML = "";
    summaryEl.classList.add("hidden");
    emptyEl.classList.remove("hidden");
    document.getElementById("emptyKeyword").textContent = kw;
    return;
  }

  emptyEl.classList.add("hidden");
  summaryEl.classList.remove("hidden");
  summaryEl.innerHTML = `「<span>${escHtml(kw)}</span>」の検索結果: 計 <span>${total}</span> 件`;

  let html = "";

  if (ntaMatched.length > 0) {
    html += `
      <div class="section">
        <div class="section-header">
          <h2>国税庁 質疑応答・通達</h2>
          <span class="section-badge badge-nta">${ntaMatched.length} 件</span>
        </div>
        ${ntaMatched.map(renderNtaCard).join("")}
      </div>`;
  }

  if (egovMatched.length > 0) {
    html += `
      <div class="section">
        <div class="section-header">
          <h2>e-Gov 法令（減価償却資産の耐用年数等に関する省令）</h2>
          <span class="section-badge badge-egov">${egovMatched.length} 件</span>
        </div>
        ${egovMatched.map(renderEgovCard).join("")}
      </div>`;
  }

  resultsEl.innerHTML = html;
}

// ---- ユーティリティ ----

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// ---- 初期化 ----

(() => {
  if (typeof EGOV_DATA === "undefined" || typeof NTA_DATA === "undefined") {
    document.getElementById("initial").innerHTML =
      '<p style="color:#dc2626">データが見つかりません。<br>build_web.py を実行してから開いてください。</p>';
    return;
  }

  egovEntries = EGOV_DATA;
  ntaEntries = NTA_DATA;

  const input = document.getElementById("searchInput");
  const onInput = debounce((e) => render(e.target.value), 200);
  input.addEventListener("input", onInput);
  input.focus();
})();
