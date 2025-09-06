// Lightweight persistent (localStorage) override store for parking slot occupancy
// - Per parkingIdx, stores final desired occupancy for each space id
// - Emits updates to subscribers and a window event 'parking-override'

const STORAGE_KEY = 'parking_overrides_v1';

let listeners = new Set();
// lots: { [parkingIdx: string]: { overrides: { [spaceId: string]: boolean } } }
let lots = Object.create(null);

function load() {
  try {
    const raw = (typeof localStorage !== 'undefined') ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.lots && typeof parsed.lots === 'object') {
      lots = parsed.lots;
    }
  } catch (_) {
    // ignore corrupted storage
  }
}

function save() {
  try {
    if (typeof localStorage === 'undefined') return;
    const data = { lots };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (_) {
    // ignore quota or serialization errors
  }
}

function emit(idx) {
  const payload = { parkingIdx: idx, overrides: getOverridesFor(idx) };
  listeners.forEach((fn) => {
    try { fn(payload); } catch (_) {}
  });
  try { window.dispatchEvent(new CustomEvent('parking-override', { detail: payload })); } catch (_) {}
}

function ensureLot(idx) {
  const key = String(idx);
  if (!lots[key]) lots[key] = { overrides: {} };
  return lots[key];
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function getOverridesFor(parkingIdx) {
  const key = String(parkingIdx);
  const lot = lots[key];
  return lot ? { ...(lot.overrides || {}) } : {};
}

export function getOverride(parkingIdx, spaceId) {
  const key = String(parkingIdx);
  const lot = lots[key];
  if (!lot) return undefined;
  const v = lot.overrides && Object.prototype.hasOwnProperty.call(lot.overrides, String(spaceId))
    ? lot.overrides[String(spaceId)]
    : undefined;
  return typeof v === 'boolean' ? v : undefined;
}

// Toggle final effective value: expects current effective value to decide next
export function toggle({ parkingIdx, id, currentEffective }) {
  const key = String(parkingIdx);
  const lot = ensureLot(key);
  const next = !Boolean(currentEffective);
  lot.overrides[String(id)] = next;
  save();
  emit(key);
}

export function setOverride({ parkingIdx, id, value }) {
  const key = String(parkingIdx);
  const lot = ensureLot(key);
  lot.overrides[String(id)] = !!value;
  save();
  emit(key);
}

export function clearFor(parkingIdx) {
  const key = String(parkingIdx);
  if (lots[key]) {
    lots[key] = { overrides: {} };
    save();
    emit(key);
  }
}

export function clearAll() {
  lots = Object.create(null);
  save();
  emit(undefined);
}

// Initialize from storage on module load
load();

