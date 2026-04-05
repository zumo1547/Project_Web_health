"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { fetchWithTimeout, readApiResponse } from "@/lib/client-image";
import {
  buildHospitalSearchUrl,
  formatHospitalDistance,
  type NearbyHospital,
  type NearbyHospitalLocation,
} from "@/lib/hospital-map";
import { formatSystemDateTime } from "@/lib/date-time";
import { useEffect, useMemo, useState } from "react";

type NearbyHospitalsResponse = {
  location: NearbyHospitalLocation;
  hospitals: NearbyHospital[];
  mapSearchUrl: string;
  warning?: string;
};

type NearbyHospitalsPanelProps = {
  elderlyId: string;
  profileName: string;
  savedLocation:
    | {
        latitude: number | null;
        longitude: number | null;
        label: string | null;
        updatedAt: string | null;
      }
    | null;
};

function getLocationLabel() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return "ตำแหน่งปัจจุบันจากมือถือหรือคอมพิวเตอร์";
}

export function NearbyHospitalsPanel({
  elderlyId,
  profileName,
  savedLocation,
}: NearbyHospitalsPanelProps) {
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [data, setData] = useState<NearbyHospitalsResponse | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const hasSavedLocation = useMemo(
    () =>
      Boolean(
        savedLocation &&
          savedLocation.latitude !== null &&
          savedLocation.longitude !== null,
      ),
    [savedLocation],
  );

  useEffect(() => {
    if (!hasSavedLocation) {
      return;
    }

    let cancelled = false;

    async function loadSavedLocation() {
      try {
        const response = await fetchWithTimeout(
          `/api/elderly/${elderlyId}/nearby-hospitals`,
          {
            method: "GET",
            cache: "no-store",
          },
          20000,
        );
        const result = (await readApiResponse(response)) as NearbyHospitalsResponse & {
          error?: string;
        };

        if (!response.ok) {
          if (!cancelled) {
            setError(result.error ?? "ยังไม่สามารถโหลดโรงพยาบาลใกล้ฉันได้");
          }
          return;
        }

        if (!cancelled) {
          setData(result);
          setWarning(result.warning ?? "");
        }
      } catch (loadError) {
        console.error("NEARBY_HOSPITALS_LOAD_ERROR", loadError);
        if (!cancelled) {
          setError("ยังไม่สามารถโหลดโรงพยาบาลใกล้ฉันได้");
        }
      }
    }

    void loadSavedLocation();

    return () => {
      cancelled = true;
    };
  }, [elderlyId, hasSavedLocation]);

  function requestCurrentLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("อุปกรณ์นี้ยังไม่รองรับการแชร์ตำแหน่งปัจจุบัน");
      return;
    }

    setError("");
    setWarning("");
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetchWithTimeout(
            `/api/elderly/${elderlyId}/nearby-hospitals`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                label: getLocationLabel(),
                persist: true,
              }),
            },
            20000,
          );
          const result = (await readApiResponse(response)) as NearbyHospitalsResponse & {
            error?: string;
          };

          if (!response.ok) {
            setError(result.error ?? "ยังไม่สามารถค้นหาโรงพยาบาลใกล้ฉันได้");
            return;
          }

          setData(result);
          setWarning(result.warning ?? "");
        } catch (locationError) {
          console.error("NEARBY_HOSPITALS_POST_ERROR", locationError);
          setError("ยังไม่สามารถค้นหาโรงพยาบาลใกล้ฉันได้");
        } finally {
          setIsLocating(false);
        }
      },
      (geolocationError) => {
        console.error("GEOLOCATION_ERROR", geolocationError);
        setError("กรุณาอนุญาตตำแหน่งก่อน แล้วลองใหม่อีกครั้ง");
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60_000,
      },
    );
  }

  const fallbackMapUrl =
    data?.mapSearchUrl ??
    (savedLocation?.latitude !== null &&
    savedLocation?.latitude !== undefined &&
    savedLocation?.longitude !== null &&
    savedLocation?.longitude !== undefined
      ? buildHospitalSearchUrl(savedLocation.latitude, savedLocation.longitude)
      : null);

  return (
    <Card className="border-sky-100 bg-[linear-gradient(135deg,rgba(239,246,255,0.98)_0%,rgba(255,255,255,0.96)_100%)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-cyan-700">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
            Map Support
          </div>
          <CardTitle>โรงพยาบาลใกล้ฉัน</CardTitle>
          <CardDescription>
            ใช้ตำแหน่งล่าสุดของ {profileName} เพื่อดูโรงพยาบาลใกล้ตัวและเปิดเส้นทางไปยังโรงพยาบาลได้ทันที
          </CardDescription>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={requestCurrentLocation}
            disabled={isLocating}
            className="border border-slate-200 bg-white/85"
          >
            {isLocating ? "กำลังอ่านตำแหน่ง..." : "ใช้ตำแหน่งปัจจุบัน"}
          </Button>
          {fallbackMapUrl ? (
            <a
              href={fallbackMapUrl}
              target="_blank"
              rel="noreferrer"
              className="motion-button inline-flex min-h-[3.25rem] items-center justify-center rounded-[1.35rem] border border-cyan-200 bg-cyan-50 px-5 py-3 text-base font-bold text-cyan-900 transition hover:border-cyan-300 hover:bg-cyan-100"
            >
              เปิดแผนที่ใกล้ฉัน
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[1.6rem] border border-cyan-100 bg-white/88 p-4">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
            ตำแหน่งล่าสุด
          </p>
          <p className="mt-3 text-base font-bold text-slate-950">
            {data?.location.label ??
              savedLocation?.label ??
              "ยังไม่มีตำแหน่งล่าสุดในระบบ"}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {data?.location.updatedAt
              ? `อัปเดตเมื่อ ${formatSystemDateTime(data.location.updatedAt, true)}`
              : savedLocation?.updatedAt
                ? `อัปเดตเมื่อ ${formatSystemDateTime(savedLocation.updatedAt, true)}`
                : "กดปุ่มใช้ตำแหน่งปัจจุบันเพื่อค้นหาโรงพยาบาลรอบตัวคุณ"}
          </p>
          <div className="mt-4 rounded-[1.25rem] bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
            ใช้เมื่อเริ่มไม่สบาย เวียนหัว ความดันสูง หรืออยากรู้ว่าถ้าต้องไปโรงพยาบาลตอนนี้ควรไปที่ไหนใกล้ที่สุด
          </div>
        </div>

        <div className="space-y-3">
          {error ? (
            <p className="rounded-[1.4rem] bg-rose-50 px-4 py-4 text-sm leading-7 text-rose-700">
              {error}
            </p>
          ) : null}

          {warning ? (
            <p className="rounded-[1.4rem] bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-800">
              {warning}
            </p>
          ) : null}

          {!data?.hospitals.length ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/82 px-4 py-5 text-sm leading-7 text-slate-500">
              {hasSavedLocation
                ? "ระบบยังไม่พบรายชื่อโรงพยาบาลอัตโนมัติจากตำแหน่งล่าสุด ลองกดใช้ตำแหน่งปัจจุบันอีกครั้งหรือเปิดแผนที่ใกล้ฉัน"
                : "ยังไม่มีรายชื่อโรงพยาบาลใกล้ฉันในระบบ กดใช้ตำแหน่งปัจจุบันก่อนหนึ่งครั้ง"}
            </div>
          ) : null}

          {data?.hospitals.map((hospital) => (
            <div
              key={hospital.id}
              className="rounded-[1.5rem] border border-white/80 bg-white/90 px-4 py-4 shadow-[0_16px_35px_-28px_rgba(15,23,42,0.22)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-base font-bold text-slate-950">{hospital.name}</p>
                  <p className="text-sm leading-6 text-slate-600">{hospital.address}</p>
                </div>
                <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  {formatHospitalDistance(hospital.distanceKm)}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={hospital.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="motion-button inline-flex min-h-[2.9rem] items-center justify-center rounded-[1.2rem] border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-900"
                >
                  เปิดแผนที่
                </a>
                <a
                  href={hospital.directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="motion-button inline-flex min-h-[2.9rem] items-center justify-center rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100"
                >
                  เปิดเส้นทาง
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
