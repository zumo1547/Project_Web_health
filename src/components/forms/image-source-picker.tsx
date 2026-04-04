"use client";

import { Button } from "@/components/ui/button";
import { ChangeEvent, useId, useRef, useSyncExternalStore } from "react";

type ImageSourcePickerProps = {
  label: string;
  description?: string;
  selectedFileName?: string | null;
  onSelect: (file: File) => void;
  onClear?: () => void;
  cameraLabel?: string;
  libraryLabel?: string;
};

const MOBILE_MEDIA_QUERY =
  "(pointer: coarse), (hover: none), (max-width: 767px)";

function isMobileLikeDevice() {
  if (typeof window === "undefined") {
    return false;
  }

  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const noHover = window.matchMedia("(hover: none)").matches;
  const narrowViewport = window.matchMedia("(max-width: 767px)").matches;
  const mobileUserAgent =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent);

  return coarsePointer || noHover || narrowViewport || mobileUserAgent;
}

function subscribeToDeviceType(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);

  const listener = () => {
    onStoreChange();
  };

  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }

  mediaQuery.addListener(listener);
  return () => mediaQuery.removeListener(listener);
}

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
  const isMobile = useSyncExternalStore(
    subscribeToDeviceType,
    isMobileLikeDevice,
    () => false,
  );

  const cameraInputId = useId();
  const libraryInputId = useId();
  const desktopInputId = useId();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const libraryInputRef = useRef<HTMLInputElement | null>(null);
  const desktopInputRef = useRef<HTMLInputElement | null>(null);

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
        {isMobile ? (
          <div className="space-y-3">
            <label
              htmlFor={cameraInputId}
              className="inline-flex min-h-[3.35rem] w-full cursor-pointer items-center justify-center rounded-[1.35rem] bg-amber-100 px-5 py-3 text-base font-bold leading-none tracking-tight text-amber-950 shadow-[0_16px_32px_-24px_rgba(217,119,6,0.5)] transition hover:bg-amber-200"
            >
              {cameraLabel}
            </label>

            <label
              htmlFor={libraryInputId}
              className="inline-flex min-h-[3.35rem] w-full cursor-pointer items-center justify-center rounded-[1.35rem] border border-slate-200 bg-white px-5 py-3 text-base font-bold leading-none tracking-tight text-slate-800 transition hover:bg-slate-50"
            >
              {libraryLabel}
            </label>

            <input
              id={cameraInputId}
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(event) => handleChange(event, cameraInputRef.current)}
            />

            <input
              id={libraryInputId}
              ref={libraryInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => handleChange(event, libraryInputRef.current)}
            />
          </div>
        ) : (
          <input
            id={desktopInputId}
            ref={desktopInputRef}
            type="file"
            accept="image/*"
            className="block w-full rounded-[1.35rem] border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-slate-800"
            onChange={(event) => handleChange(event, desktopInputRef.current)}
          />
        )}

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
              {isMobile
                ? "บนมือถือสามารถเลือกได้ทั้งถ่ายรูปทันทีหรือเลือกรูปจากคลัง"
                : "บนคอมสามารถเลือกรูปจากเครื่องได้ทันที"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
