import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Link from "next/link";

type ElderlyRow = {
  id: string;
  fullName: string;
  doctorNames: string[];
  latestBloodPressure?: string;
  latestAiStatus?: string;
  updatedAt: Date;
};

type ElderlyTableProps = {
  title: string;
  rows: ElderlyRow[];
  variant?: "doctor" | "elderly";
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function ElderlyTable({
  title,
  rows,
  variant = "elderly",
}: ElderlyTableProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>

      {rows.length === 0 ? (
        <div className="px-6 py-10 text-sm text-slate-500">
          ยังไม่มีข้อมูลผู้สูงอายุในมุมมองของบัญชีนี้
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          {rows.map((row) => (
            <div
              key={row.id}
              className={`grid gap-4 px-6 py-5 ${
                variant === "doctor"
                  ? "lg:grid-cols-[1.2fr_0.75fr_0.75fr_0.9fr_140px]"
                  : "lg:grid-cols-[1.2fr_0.75fr_0.75fr_0.9fr_140px]"
              }`}
            >
              <div className="space-y-2">
                <Link
                  href={`/elderly/${row.id}`}
                  className="text-base font-semibold text-slate-900 transition hover:text-emerald-700"
                >
                  {row.fullName}
                </Link>
                <div className="flex flex-wrap gap-2">
                  {row.doctorNames.length ? (
                    <Badge tone="emerald">หมอ: {row.doctorNames.join(", ")}</Badge>
                  ) : null}
                </div>
              </div>

              <div className="text-sm leading-6 text-slate-600">
                <p className="font-medium text-slate-800">ความดันล่าสุด</p>
                <p>{row.latestBloodPressure ?? "ยังไม่มีข้อมูล"}</p>
              </div>

              <div className="text-sm leading-6 text-slate-600">
                <p className="font-medium text-slate-800">AI ล่าสุด</p>
                <p>{row.latestAiStatus ?? "ยังไม่สแกน"}</p>
              </div>

              <div className="text-sm leading-6 text-slate-600">
                <p className="font-medium text-slate-800">อัปเดตล่าสุด</p>
                <p>{formatDate(row.updatedAt)}</p>
              </div>

              <div className="flex items-start lg:justify-end">
                <Link
                  href={`/elderly/${row.id}`}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  เปิดเคส
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
