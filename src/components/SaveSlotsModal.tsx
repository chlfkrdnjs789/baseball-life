import React from 'react';
import { Save, Upload, Trash2, X } from 'lucide-react';
import type { SaveMetadata, SaveSlotNumber } from '../models/saveGame';

interface SaveSlotsModalProps {
  mode: 'save' | 'load';
  slots: Array<SaveMetadata | null>;
  onSelect: (slot: SaveSlotNumber) => void;
  onDelete: (slot: SaveSlotNumber) => void;
  onClose: () => void;
}

const formatSavedAt = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString('ko-KR');
};

export default function SaveSlotsModal({ mode, slots, onSelect, onDelete, onClose }: SaveSlotsModalProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-white">{mode === 'save' ? '게임 저장' : '게임 불러오기'}</h2>
            <p className="text-xs text-slate-400 mt-1">자동저장은 사용하지 않습니다. 원하는 슬롯을 직접 선택하세요.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800" aria-label="닫기">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {slots.map((metadata, index) => {
            const slot = (index + 1) as SaveSlotNumber;
            const disabled = mode === 'load' && !metadata;
            return (
              <div key={slot} className="flex gap-3 rounded-xl border border-slate-700 bg-slate-800/70 p-4">
                <button
                  disabled={disabled}
                  onClick={() => onSelect(slot)}
                  className="flex-1 text-left disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-2 text-sm font-bold text-green-400">
                    {mode === 'save' ? <Save size={16} /> : <Upload size={16} />}
                    저장 슬롯 {slot}
                  </div>
                  {metadata ? (
                    <div className="mt-2 text-sm text-slate-200">
                      <div className="font-bold">{metadata.playerName} · {metadata.team}</div>
                      <div className="text-xs text-slate-400 mt-1">{metadata.date} · {metadata.position} · 종합 {metadata.ovr}</div>
                      <div className="text-xs text-slate-500 mt-1">{formatSavedAt(metadata.savedAt)}</div>
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-slate-500">비어 있는 슬롯</div>
                  )}
                </button>
                {metadata && (
                  <button
                    onClick={() => onDelete(slot)}
                    className="self-center p-2 rounded-lg text-red-400 hover:bg-red-950/40"
                    title="슬롯 삭제"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
