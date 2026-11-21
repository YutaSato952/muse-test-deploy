'use strict';
/* 便利ツールボックス - 全ての処理はブラウザ内で完結します */
const $ = (id) => document.getElementById(id);

/* ---------- ナビゲーション ---------- */
const navBtns = document.querySelectorAll('#toolNav button');
navBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    navBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
    $('tool-' + btn.dataset.tool).classList.add('active');
  });
});

/* ---------- 文字数カウント ---------- */
const countInput = $('countInput');
function updateCount() {
  const t = countInput.value;
  const noSpace = t.replace(/[\s　]/g, '');
  const lines = t === '' ? 0 : t.split('\n').length;
  const words = t.trim() === '' ? 0 : t.trim().split(/\s+/).length;
  $('stChars').textContent = t.length.toLocaleString();
  $('stNoSpace').textContent = noSpace.length.toLocaleString();
  $('stLines').textContent = lines.toLocaleString();
  $('stWords').textContent = words.toLocaleString();
  $('stGenko').textContent = Math.ceil(noSpace.length / 400).toLocaleString();
  const min = noSpace.length / 500;
  $('stRead').textContent = min < 1 ? '1分未満' : '約' + Math.round(min) + '分';
}
countInput.addEventListener('input', updateCount);
$('countClear').addEventListener('click', () => { countInput.value = ''; updateCount(); });
updateCount();

/* ---------- パスワード生成 ---------- */
const PW_SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digit: '0123456789',
  symbol: '!@#$%^&*()-_=+[]{};:,.<>?'
};
const PW_AMBIGUOUS = /[0O1lI|`'"]/g;
function genPassword() {
  let pool = '';
  if ($('pwLower').checked) pool += PW_SETS.lower;
  if ($('pwUpper').checked) pool += PW_SETS.upper;
  if ($('pwDigit').checked) pool += PW_SETS.digit;
  if ($('pwSymbol').checked) pool += PW_SETS.symbol;
  if ($('pwNoAmb').checked) pool = pool.replace(PW_AMBIGUOUS, '');
  const len = parseInt($('pwLen').value, 10);
  $('pwLenVal').textContent = len;
  if (pool.length === 0) {
    $('pwOut').textContent = '';
    $('pwInfo').textContent = '文字の種類を1つ以上選んでください。';
    return;
  }
  const buf = new Uint32Array(len);
  crypto.getRandomValues(buf);
  let pw = '';
  for (let i = 0; i < len; i++) pw += pool[buf[i] % pool.length];
  $('pwOut').textContent = pw;
  const bits = Math.round(len * Math.log2(pool.length));
  $('pwInfo').textContent = '強度の目安：約 ' + bits + ' ビット（使用文字 ' + pool.length + ' 種類）';
}
['pwLen', 'pwLower', 'pwUpper', 'pwDigit', 'pwSymbol', 'pwNoAmb'].forEach((id) => {
  $(id).addEventListener('input', genPassword);
  $(id).addEventListener('change', genPassword);
});
$('pwGen').addEventListener('click', genPassword);
$('pwCopy').addEventListener('click', async () => {
  const pw = $('pwOut').textContent;
  if (!pw) return;
  try { await navigator.clipboard.writeText(pw); $('pwInfo').textContent = 'コピーしました。'; }
  catch (e) { $('pwInfo').textContent = 'コピーできませんでした。手動で選択してください。'; }
});
genPassword();

/* ---------- QRコード ---------- */
$('qrGen').addEventListener('click', () => {
  const text = $('qrText').value.trim();
  const box = $('qrBox');
  const msg = $('qrMsg');
  box.innerHTML = '';
  msg.textContent = '';
  if (!text) { msg.textContent = '内容を入力してください。'; return; }
  if (typeof QRCode === 'undefined') {
    msg.textContent = 'QRコード生成ライブラリを読み込めませんでした。通信環境をご確認のうえ、再読み込みしてください。';
    return;
  }
  const size = parseInt($('qrSize').value, 10);
  const levels = { L: QRCode.CorrectLevel.L, M: QRCode.CorrectLevel.M, Q: QRCode.CorrectLevel.Q, H: QRCode.CorrectLevel.H };
  try {
    new QRCode(box, { text: text, width: size, height: size, correctLevel: levels[$('qrLevel').value] });
  } catch (e) {
    msg.textContent = '生成できませんでした。内容が長すぎる可能性があります。';
  }
});

/* ---------- 単位変換 ---------- */
const UNITS = {
  length: {
    label: { mm: 'ミリメートル (mm)', cm: 'センチメートル (cm)', m: 'メートル (m)', km: 'キロメートル (km)', inch: 'インチ (in)', ft: 'フィート (ft)', yd: 'ヤード (yd)', mile: 'マイル (mi)' },
    factor: { mm: 0.001, cm: 0.01, m: 1, km: 1000, inch: 0.0254, ft: 0.3048, yd: 0.9144, mile: 1609.344 }
  },
  weight: {
    label: { g: 'グラム (g)', kg: 'キログラム (kg)', t: 'トン (t)', oz: 'オンス (oz)', lb: 'ポンド (lb)' },
    factor: { g: 0.001, kg: 1, t: 1000, oz: 0.028349523125, lb: 0.45359237 }
  },
  temp: {
    label: { c: '摂氏 (°C)', f: '華氏 (°F)', k: 'ケルビン (K)' },
    factor: null
  }
};
function fillUnits() {
  const cat = UNITS[$('unitCat').value];
  const from = $('unitFrom'), to = $('unitTo');
  from.innerHTML = ''; to.innerHTML = '';
  Object.keys(cat.label).forEach((k) => {
    from.add(new Option(cat.label[k], k));
    to.add(new Option(cat.label[k], k));
  });
  const keys = Object.keys(cat.label);
  from.value = keys[0];
  to.value = keys[Math.min(2, keys.length - 1)];
  convertUnit();
}
function toCelsius(v, u) { return u === 'c' ? v : u === 'f' ? (v - 32) * 5 / 9 : v - 273.15; }
function fromCelsius(v, u) { return u === 'c' ? v : u === 'f' ? v * 9 / 5 + 32 : v + 273.15; }
function fmtNum(n) {
  if (!isFinite(n)) return '―';
  if (n !== 0 && (Math.abs(n) >= 1e12 || Math.abs(n) < 1e-6)) return n.toExponential(6);
  return Number(n.toPrecision(10)).toLocaleString('ja-JP', { maximumFractionDigits: 8 });
}
function convertUnit() {
  const catKey = $('unitCat').value;
  const cat = UNITS[catKey];
  const v = parseFloat($('unitVal').value);
  const fu = $('unitFrom').value, tu = $('unitTo').value;
  if (isNaN(v)) { $('unitOut').textContent = '数値を入力してください。'; return; }
  let r;
  if (catKey === 'temp') r = fromCelsius(toCelsius(v, fu), tu);
  else r = v * cat.factor[fu] / cat.factor[tu];
  $('unitOut').textContent = fmtNum(v) + ' ' + cat.label[fu] + ' ＝ ' + fmtNum(r) + ' ' + cat.label[tu];
}
$('unitCat').addEventListener('change', fillUnits);
['unitVal', 'unitFrom', 'unitTo'].forEach((id) => {
  $(id).addEventListener('input', convertUnit);
  $(id).addEventListener('change', convertUnit);
});
$('unitSwap').addEventListener('click', () => {
  const a = $('unitFrom').value;
  $('unitFrom').value = $('unitTo').value;
  $('unitTo').value = a;
  convertUnit();
});
fillUnits();

/* ---------- お金計算 ---------- */
function yen(n) { return Math.round(n).toLocaleString('ja-JP') + ' 円'; }
function calcMoney() {
  const price = parseFloat($('moneyPrice').value);
  const tax = parseFloat($('moneyTax').value);
  const off = parseFloat($('moneyOff').value) || 0;
  const people = Math.max(1, parseInt($('moneyPeople').value, 10) || 1);
  if (isNaN(price) || price < 0) { $('moneyOut').textContent = '金額を入力してください。'; return; }
  const ex = $('moneyKind').value === 'ex' ? price : price / (1 + tax);
  const inc = ex * (1 + tax);
  const discounted = inc * (1 - off / 100);
  const per = discounted / people;
  const perCeil100 = Math.ceil(per / 100) * 100;
  $('moneyOut').innerHTML =
    '税抜： ' + yen(ex) + ' ／ 税込： ' + yen(inc) + '<br>' +
    '割引（' + off + '%）後の税込： <b>' + yen(discounted) + '</b><br>' +
    people + ' 人で割り勘： 1人あたり ' + yen(per) + '（100円単位で切り上げると ' + yen(perCeil100) + '）';
}
['moneyPrice', 'moneyKind', 'moneyTax', 'moneyOff', 'moneyPeople'].forEach((id) => {
  $(id).addEventListener('input', calcMoney);
  $(id).addEventListener('change', calcMoney);
});
calcMoney();

/* ---------- 日付計算 ---------- */
function todayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + m + '-' + day;
}
function parseDate(id) {
  const v = $(id).value;
  if (!v) return null;
  const p = v.split('-').map(Number);
  return new Date(p[0], p[1] - 1, p[2]);
}
function fmtDate(d) {
  const w = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
  return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日（' + w + '）';
}
function calcDate() {
  const a = parseDate('dateA'), b = parseDate('dateB');
  if (a && b) {
    const diff = Math.round((b - a) / 86400000);
    $('dateDiffOut').textContent = '差は ' + diff.toLocaleString() + ' 日です（終了日を含むと ' + (Math.abs(diff) + 1).toLocaleString() + ' 日間）。';
  } else {
    $('dateDiffOut').textContent = '';
  }
  const base = parseDate('dateBase');
  const n = parseInt($('dateN').value, 10);
  if (base && !isNaN(n)) {
    const r = new Date(base);
    r.setDate(r.getDate() + n * parseInt($('dateDir').value, 10));
    $('dateAddOut').textContent = fmtDate(base) + ' の ' + n + ' 日' + ($('dateDir').value === '1' ? '後' : '前') + ' は ' + fmtDate(r) + ' です。';
  } else {
    $('dateAddOut').textContent = '';
  }
}
$('dateA').value = todayStr();
$('dateB').value = todayStr();
$('dateBase').value = todayStr();
['dateA', 'dateB', 'dateBase', 'dateN', 'dateDir'].forEach((id) => {
  $(id).addEventListener('input', calcDate);
  $(id).addEventListener('change', calcDate);
});
calcDate();

/* ---------- JSON整形 ---------- */
function parseJsonInput() {
  const raw = $('jsonInput').value.trim();
  if (!raw) throw new Error('JSONを入力してください。');
  return JSON.parse(raw);
}
$('jsonFmt').addEventListener('click', () => {
  try {
    const obj = parseJsonInput();
    $('jsonInput').value = JSON.stringify(obj, null, 2);
    $('jsonMsg').textContent = '整形しました。正しいJSONです。';
    $('jsonMsg').className = 'msg ok';
  } catch (e) {
    $('jsonMsg').textContent = 'エラー： ' + e.message;
    $('jsonMsg').className = 'msg err';
  }
});
$('jsonMin').addEventListener('click', () => {
  try {
    const obj = parseJsonInput();
    $('jsonInput').value = JSON.stringify(obj);
    $('jsonMsg').textContent = '圧縮しました。正しいJSONです。';
    $('jsonMsg').className = 'msg ok';
  } catch (e) {
    $('jsonMsg').textContent = 'エラー： ' + e.message;
    $('jsonMsg').className = 'msg err';
  }
});
$('jsonCopy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('jsonInput').value); $('jsonMsg').textContent = 'コピーしました。'; $('jsonMsg').className = 'msg ok'; }
  catch (e) { $('jsonMsg').textContent = 'コピーできませんでした。'; $('jsonMsg').className = 'msg err'; }
});

/* ---------- エンコード変換 ---------- */
function b64EncodeUtf8(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin);
}
function b64DecodeUtf8(b64) {
  const bin = atob(b64.replace(/\s/g, ''));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
function encRun(fn) {
  const msg = $('encMsg');
  try {
    $('encOutput').value = fn($('encInput').value);
    msg.textContent = '';
  } catch (e) {
    $('encOutput').value = '';
    msg.textContent = '変換できませんでした。入力をご確認ください。';
    msg.className = 'msg err';
  }
}
$('encB64Enc').addEventListener('click', () => encRun(b64EncodeUtf8));
$('encB64Dec').addEventListener('click', () => encRun(b64DecodeUtf8));
$('encUrlEnc').addEventListener('click', () => encRun((s) => encodeURIComponent(s)));
$('encUrlDec').addEventListener('click', () => encRun((s) => decodeURIComponent(s)));

/* ---------- カラー変換 ---------- */
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}
function updateColor(fromHex) {
  let r, g, b;
  if (fromHex) {
    let hex = $('colorHex').value.trim().replace(/^#/, '');
    if (/^[0-9a-fA-F]{3}$/.test(hex)) hex = hex.split('').map((c) => c + c).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) return;
    r = parseInt(hex.slice(0, 2), 16); g = parseInt(hex.slice(2, 4), 16); b = parseInt(hex.slice(4, 6), 16);
    $('colorR').value = r; $('colorG').value = g; $('colorB').value = b;
  } else {
    r = parseInt($('colorR').value, 10); g = parseInt($('colorG').value, 10); b = parseInt($('colorB').value, 10);
  }
  const hexStr = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
  if (!fromHex) $('colorHex').value = hexStr;
  $('colorPick').value = hexStr;
  $('rVal').textContent = r; $('gVal').textContent = g; $('bVal').textContent = b;
  $('colorSwatch').style.background = hexStr;
  const hsl = rgbToHsl(r, g, b);
  $('colorOut').textContent = 'HEX: ' + hexStr + '　RGB: rgb(' + r + ', ' + g + ', ' + b + ')　HSL: hsl(' + hsl[0] + ', ' + hsl[1] + '%, ' + hsl[2] + '%)';
}
$('colorHex').addEventListener('input', () => updateColor(true));
$('colorPick').addEventListener('input', () => { $('colorHex').value = $('colorPick').value; updateColor(true); });
['colorR', 'colorG', 'colorB'].forEach((id) => $(id).addEventListener('input', () => updateColor(false)));
updateColor(true);

/* ---------- ポモドーロタイマー ---------- */
let timerTotal = 25 * 60, timerLeft = timerTotal, timerId = null;
function timerRender() {
  const m = Math.floor(timerLeft / 60), s = timerLeft % 60;
  $('timerFace').textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  $('timerBar').style.width = (timerTotal > 0 ? (1 - timerLeft / timerTotal) * 100 : 0) + '%';
}
function timerSet(minutes) {
  timerStop();
  timerTotal = minutes * 60;
  timerLeft = timerTotal;
  $('timerMsg').textContent = '';
  document.title = '便利ツールボックス | 無料オンラインツール集';
  timerRender();
}
function timerStop() {
  if (timerId !== null) { clearInterval(timerId); timerId = null; }
}
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.35, 0.7].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880;
      const t = ctx.currentTime + offset;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t); osc.stop(t + 0.32);
    });
  } catch (e) { /* 音が出ない環境では無視 */ }
}
document.querySelectorAll('[data-preset]').forEach((btn) => {
  btn.addEventListener('click', () => {
    $('timerCustom').value = btn.dataset.preset;
    timerSet(parseInt(btn.dataset.preset, 10));
  });
});
$('timerStart').addEventListener('click', () => {
  if (timerId !== null) return;
  if (timerLeft <= 0) timerSet(Math.max(1, parseInt($('timerCustom').value, 10) || 25));
  timerId = setInterval(() => {
    timerLeft--;
    timerRender();
    if (timerLeft <= 0) {
      timerStop();
      beep();
      $('timerMsg').textContent = '時間になりました。おつかれさまでした。';
      document.title = '⏰ 時間になりました | 便利ツールボックス';
    }
  }, 1000);
});
$('timerPause').addEventListener('click', timerStop);
$('timerReset').addEventListener('click', () => {
  timerSet(Math.max(1, parseInt($('timerCustom').value, 10) || 25));
});
$('timerCustom').addEventListener('change', () => {
  timerSet(Math.max(1, parseInt($('timerCustom').value, 10) || 25));
});
timerRender();
