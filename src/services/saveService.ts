import {
  SAVE_SLOT_COUNT,
  SAVE_VERSION,
  type SaveEnvelope,
  type SaveMetadata,
  type SaveSlotNumber,
} from '../models/saveGame';

const SLOT_PREFIX = 'baseball_life_save_v3_slot_';
const LEGACY_KEY = 'baseball_save_v2';

const slotKey = (slot: SaveSlotNumber) => `${SLOT_PREFIX}${slot}`;

export function listSaveSlots(): Array<SaveMetadata | null> {
  return Array.from({ length: SAVE_SLOT_COUNT }, (_, index) => {
    const slot = (index + 1) as SaveSlotNumber;
    const raw = localStorage.getItem(slotKey(slot));
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as SaveEnvelope<unknown>;
      return parsed.metadata ?? null;
    } catch {
      return null;
    }
  });
}

export function saveToSlot<T>(slot: SaveSlotNumber, game: T, metadata: Omit<SaveMetadata, 'slot' | 'savedAt'>): SaveMetadata {
  const fullMetadata: SaveMetadata = {
    ...metadata,
    slot,
    savedAt: new Date().toISOString(),
  };

  const envelope: SaveEnvelope<T> = {
    saveVersion: SAVE_VERSION,
    metadata: fullMetadata,
    game,
  };

  localStorage.setItem(slotKey(slot), JSON.stringify(envelope));
  return fullMetadata;
}

export function loadFromSlot<T>(slot: SaveSlotNumber): SaveEnvelope<T> | null {
  const raw = localStorage.getItem(slotKey(slot));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as SaveEnvelope<T>;
    if (!parsed.game || !parsed.metadata) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function deleteSlot(slot: SaveSlotNumber): void {
  localStorage.removeItem(slotKey(slot));
}

/** 기존 단일 세이브(baseball_save_v2)를 슬롯 1로 한 번만 옮긴다. */
export function migrateLegacySave<T>(metadataFactory: (legacyGame: T) => Omit<SaveMetadata, 'slot' | 'savedAt'>): boolean {
  if (localStorage.getItem(slotKey(1))) return false;

  const legacyRaw = localStorage.getItem(LEGACY_KEY);
  if (!legacyRaw) return false;

  try {
    const legacyGame = JSON.parse(legacyRaw) as T;
    saveToSlot(1, legacyGame, metadataFactory(legacyGame));
    localStorage.removeItem(LEGACY_KEY);
    return true;
  } catch {
    return false;
  }
}
