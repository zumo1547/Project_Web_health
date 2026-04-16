"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { RecordDeleteButton } from "@/components/forms/record-delete-button";
import { formatSystemDateTime } from "@/lib/date-time";
import { getBloodPressureAssessment } from "@/lib/health-presenters";

type Tab = "blood-pressure" | "medicines" | "ai-scans";

interface BloodPressure {
  id: string;
  systolic: number;
  diastolic: number;
  pulse?: number | null;
  measuredAt: Date;
  note?: string | null;
}

interface MedicineImage {
  id: string;
  label?: string | null;
  imageUrl: string;
  uploadedAt: Date;
}

interface AiScan {
  id: string;
  scanType: "MEDICINE_IMAGE" | "BLOOD_PRESSURE_IMAGE";
  summary?: string | null;
  confidence?: number | null;
  imageUrl: string;
  createdAt: Date;
}

interface HealthRecordsTabsProps {
  elderlyId: string;
  bloodPressures: BloodPressure[];
  medicineImages: MedicineImage[];
  aiScans: AiScan[];
  canDeleteUploads: boolean;
}

export function HealthRecordsTabs({
  elderlyId,
  bloodPressures,
  medicineImages,
  aiScans,
  canDeleteUploads,
}: HealthRecordsTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("blood-pressure");

  const tabs: Tab[] = ["blood-pressure", "medicines", "ai-scans"];
  const tabLabels: Record<Tab, string> = {
    "blood-pressure": `ประวัติความดัน (${bloodPressures.length})`,
    medicines: `รูปยา (${medicineImages.length})`,
    "ai-scans": `ผล AI (${aiScans.length})`,
  };

  return (
    <div className="space-y-4">
      {/* Tab Buttons */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition ${
              activeTab === tab
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        {/* Blood Pressure Tab */}
        {activeTab === "blood-pressure" && (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {bloodPressures.length > 0 ? (
              bloodPressures.map((record) => {
                const assessment = getBloodPressureAssessment(
                  record.systolic,
                  record.diastolic,
                );

                return (
                  <div
                    key={record.id}
                    className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4 hover:shadow-sm transition"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-base font-bold text-slate-900">
                          {record.systolic}/{record.diastolic} mmHg
                          {record.pulse ? ` • ♡${record.pulse}` : ""}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          {formatSystemDateTime(record.measuredAt, true)}
                        </p>
                      </div>
                      <Badge tone={assessment.tone} className="whitespace-nowrap">
                        {assessment.shortLabel}
                      </Badge>
                    </div>
                    {record.note && (
                      <p className="text-xs text-slate-600 mt-2 italic">
                        หมายเหตุ: {record.note}
                      </p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm text-slate-500">ยังไม่มีประวัติความดัน</p>
              </div>
            )}
          </div>
        )}

        {/* Medicines Tab */}
        {activeTab === "medicines" && (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {medicineImages.length > 0 ? (
              medicineImages.map((image) => (
                <div
                  key={image.id}
                  className="rounded-xl border border-slate-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-4 hover:shadow-sm transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">
                        {image.label || "รูปยาที่ยังไม่มีชื่อ"}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        อัปโหลด {formatSystemDateTime(image.uploadedAt, true)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <a
                      href={image.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex text-xs px-3 py-1.5 rounded-lg bg-amber-200 text-amber-900 hover:bg-amber-300 transition font-semibold"
                    >
                      เปิดรูป
                    </a>
                    {canDeleteUploads && (
                      <RecordDeleteButton
                        endpoint={`/api/elderly/${elderlyId}/medicine-upload/${image.id}`}
                        confirmMessage="ต้องการลบรูปยานี้ใช่หรือไม่?"
                        label="ลบ"
                      />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm text-slate-500">ยังไม่มีรูปยาที่อัปโหลด</p>
              </div>
            )}
          </div>
        )}

        {/* AI Scans Tab */}
        {activeTab === "ai-scans" && (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {aiScans.length > 0 ? (
              aiScans.map((scan) => (
                <div
                  key={scan.id}
                  className="rounded-xl border border-slate-200 bg-gradient-to-br from-purple-50 to-pink-50 p-4 hover:shadow-sm transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900">
                          {scan.scanType === "MEDICINE_IMAGE"
                            ? "📋 สแกนรูปยา"
                            : "❤️ สแกนความดัน"}
                        </p>
                        {scan.confidence && (
                          <Badge tone="amber" className="text-xs">
                            {Math.round(scan.confidence * 100)}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-2">
                        {scan.summary || "ยังไม่มีสรุปผล"}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        สแกนเมื่อ {formatSystemDateTime(scan.createdAt, true)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <a
                      href={scan.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex text-xs px-3 py-1.5 rounded-lg bg-purple-200 text-purple-900 hover:bg-purple-300 transition font-semibold"
                    >
                      เปิดรูป
                    </a>
                    {canDeleteUploads && (
                      <RecordDeleteButton
                        endpoint={`/api/elderly/${elderlyId}/ai-scan/${scan.id}`}
                        confirmMessage="ต้องการลบผลสแกนนี้ใช่หรือไม่?"
                        label="ลบ"
                      />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm text-slate-500">ยังไม่มีผลสแกนจาก AI</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
