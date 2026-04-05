"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { fetchWithTimeout, readApiResponse } from "@/lib/client-image";
import {
  buildHospitalShareMessage,
  formatHospitalDistance,
  type NearbyHospital,
  type NearbyHospitalLocation,
} from "@/lib/hospital-map";
import { formatSystemDateTime } from "@/lib/date-time";
import { useCallback, useEffect, useMemo, useState } from "react";

type NearbyHospitalsResponse = {
  patientName: string;
  location: NearbyHospitalLocation;
  hospitals: NearbyHospital[];
  mapSearchUrl: string;
  warning?: string;
};

type DoctorHospitalSharePanelProps = {
  elderlyId: string;
  patientName: string;
  savedLocation:
    | {
        latitude: number | null;
        longitude: number | null;
        label: string | null;
        updatedAt: string | null;
      }
    | null;
};

export function DoctorHospitalSharePanel({
  elderlyId,
  patientName,
  savedLocation,
}: DoctorHospitalSharePanelProps) {
  const [data, setData] = useState<NearbyHospitalsResponse | null>(null);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const hasSavedLocation = useMemo(
    () =>
      Boolean(
        savedLocation &&
          savedLocation.latitude !== null &&
          savedLocation.longitude !== null,
      ),
    [savedLocation],
  );

  const loadHospitals = useCallback(async () => {
    setError("");
    setWarning("");
    setIsLoading(true);

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
        setError(result.error ?? "ยังไม่สามารถโหลดโรงพยาบาลใกล้เคียงได้");
        return;
      }

      setData(result);
      setWarning(result.warning ?? "");
    } catch (loadError) {
      console.error("DOCTOR_HOSPITAL_LOAD_ERROR", loadError);
      setError("ยังไม่สามารถโหลดโรงพยาบาลใกล้เคียงได้");
    } finally {
      setIsLoading(false);
    }
  }, [elderlyId]);

  useEffect(() => {
    if (!hasSavedLocation) {
      return;
    }

    void loadHospitals();
  }, [hasSavedLocation, loadHospitals]);

  async function sendHospitalsToChat(hospitals: NearbyHospital[], targetId = "bulk") {
    setSendingId(targetId);
    setError("");

    try {
      const response = await fetch(`/api/elderly/${elderlyId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: buildHospitalShareMessage(
            patientName,
            hospitals,
            data?.location.label ?? savedLocation?.label,
          ),
        }),
      });

      const result = await readApiResponse(response);

      if (!response.ok) {
        setError(
          result && typeof result === "object" && "error" in result && typeof result.error === "string"
            ? result.error
            : "ยังไม่สามารถส่งโรงพยาบาลเข้าแชทได้",
        );
        return;
      }
    } catch (sendError) {
      console.error("DOCTOR_HOSPITAL_CHAT_ERROR", sendError);
      setError("ยังไม่สามารถส่งโรงพยาบาลเข้าแชทได้");
    } finally {
      setSendingId(null);
    }
  }

  return (
    <Card className="border-rose-100 bg-[linear-gradient(135deg,rgba(255,241,242,0.98)_0%,rgba(255,255,255,0.96)_100%)]">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-rose-700">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          Hospital Assist
        </div>
        <CardTitle>ส่งโรงพยาบาลใกล้ตัวให้คนไข้</CardTitle>
        <CardDescription>
          ใช้เมื่อต้องการแนะนำโรงพยาบาลใกล้ตำแหน่งล่าสุดของผู้สูงอายุ แล้วส่งรายชื่อเข้าแชทเคสทันที
        </CardDescription>
      </div>

      <div className="mt-5 rounded-[1.6rem] border border-white/80 bg-white/88 p-4">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
          ตำแหน่งล่าสุดของคนไข้
        </p>
        <p className="mt-3 text-base font-bold text-slate-950">
          {savedLocation?.label ?? "ยังไม่มีตำแหน่งล่าสุดของคนไข้"}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {savedLocation?.updatedAt
            ? `อัปเดตเมื่อ ${formatSystemDateTime(savedLocation.updatedAt, true)}`
            : "ให้ผู้สูงอายุเปิดโรงพยาบาลใกล้ฉันจากหน้าหลักสัก 1 ครั้งก่อน"}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={loadHospitals}
          disabled={!hasSavedLocation || isLoading}
        >
          {isLoading ? "กำลังโหลด..." : "โหลดโรงพยาบาลใกล้คนไข้"}
        </Button>
        {data?.hospitals.length ? (
          <Button
            type="button"
            onClick={() => sendHospitalsToChat(data.hospitals.slice(0, 3), "bulk")}
            disabled={Boolean(sendingId)}
          >
            {sendingId === "bulk" ? "กำลังส่ง..." : "ส่ง 3 โรงพยาบาลเข้าแชท"}
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="mt-4 rounded-[1.4rem] bg-rose-50 px-4 py-4 text-sm leading-7 text-rose-700">
          {error}
        </p>
      ) : null}

      {warning ? (
        <p className="mt-4 rounded-[1.4rem] bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-800">
          {warning}
        </p>
      ) : null}

      <div className="mt-5 space-y-3">
        {!data?.hospitals.length ? (
          <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm leading-7 text-slate-500">
            {hasSavedLocation
              ? "เมื่อโหลดสำเร็จ รายชื่อโรงพยาบาลใกล้คนไข้จะขึ้นตรงนี้และสามารถส่งเข้าแชทได้ทันที"
              : "ยังไม่มีตำแหน่งของคนไข้อยู่ในระบบ จึงยังไม่สามารถหาโรงพยาบาลใกล้ตัวแทนได้"}
          </div>
        ) : null}

        {data?.hospitals.map((hospital) => (
          <div
            key={hospital.id}
            className="rounded-[1.5rem] border border-white/80 bg-white/92 px-4 py-4 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.22)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <p className="text-base font-bold text-slate-950">{hospital.name}</p>
                <p className="text-sm leading-6 text-slate-600">{hospital.address}</p>
              </div>
              <div className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
                {formatHospitalDistance(hospital.distanceKm)}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={hospital.mapUrl}
                target="_blank"
                rel="noreferrer"
                className="motion-button inline-flex min-h-[2.9rem] items-center justify-center rounded-[1.2rem] border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-900"
              >
                เปิดแผนที่
              </a>
              <Button
                type="button"
                variant="ghost"
                className="border border-slate-200 bg-white"
                disabled={Boolean(sendingId)}
                onClick={() => sendHospitalsToChat([hospital], hospital.id)}
              >
                {sendingId === hospital.id ? "กำลังส่ง..." : "ส่งเข้าแชท"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
