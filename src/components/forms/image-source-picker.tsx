"use client";

import { Button } from "@/components/ui/button";
import { ChangeEvent, useId, useRef } from "react";

type ImageSourcePickerProps = {
  label: string;
  description?: string;
  selectedFileName?: string | null;
  onSelect: (file: File) => void;
  onClear?: () => void;
  cameraLabel?: string;
  libraryLabel?: string;
};

function resetInput(input: HTMLInputElement | null) {
  if (input) {
    input.value = "";
  }
}

export function ImageSourcePicker({
  label,
  description,
  selectedFileName,
  onSelect,
  onClear,
  cameraLabel = "ถ่ายรูปทันที",
  libraryLabel = "เลือกรูปจากคลัง",
}: ImageSourcePickerProps) {
  const cameraInputId = useId();
  const libraryInputId = useId();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const libraryInputRef = useRef<HTMLInputElement | null>(null);

  function handleChange(
    event: ChangeEvent<HTMLInputElement>,
    target: HTMLInputElement | null,
  ) {
    const file = event.target.files?.[0];

    if (file) {
      onSelect(file);
    }

    resetInput(target);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-bold text-slate-700">{label}</p>
        {description ? (
          <p className="text-sm leading-6 text-slate-500">{description}</p>
        ) : null}
      </div>

      <div className="rounded-[1.6rem] border border-slate-200 bg-white/95 p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.45)]">
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="secondary"
            className="min-h-[3.35rem]"
            onClick={() => cameraInputRef.current?.click()}
          >
            {cameraLabel}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-[3.35rem] border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
            onClick={() => libraryInputRef.current?.click()}
          >
            {libraryLabel}
          </Button>
        </div>

        <input
          id={cameraInputId}
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => handleChange(event, cameraInputRef.current)}
        />

        <input
          id={libraryInputId}
          ref={libraryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleChange(event, libraryInputRef.current)}
        />

        <div className="mt-4 rounded-[1.3rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-4">
          {selectedFileName ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  ไฟล์ที่เลือก
                </p>
                <p className="break-all text-sm font-semibold text-slate-900">
                  {selectedFileName}
                </p>
              </div>

              {onClear ? (
                <Button type="button" variant="ghost" onClick={onClear}>
                  ล้างไฟล์
                </Button>
              ) : null}
            </div>
          ) : (
            <p className="text-sm leading-6 text-slate-500">
              ยังไม่ได้เลือกรูป สามารถถ่ายจากกล้องหรือเลือกรูปเดิมจากคลังได้
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
