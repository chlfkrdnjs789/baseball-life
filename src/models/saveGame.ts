export const SAVE_VERSION = 3;
export const SAVE_SLOT_COUNT = 3;

export type SaveSlotNumber = 1 | 2 | 3;

export interface SaveMetadata {
  slot: SaveSlotNumber;
  savedAt: string;
  playerName: string;
  team: string;
  position: string;
  date: string;
  ovr: string;
}

export interface SaveEnvelope<T> {
  saveVersion: number;
  metadata: SaveMetadata;
  game: T;
}
