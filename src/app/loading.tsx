import Image from "next/image";

export default function Loading() {
  return (
    <div className="loading-screen">
      <div className="loading-card loading-shimmer">
        <div className="flex flex-col items-center text-center">
          <div className="loading-icon-wrap">
            <span className="loading-ring" />
            <span className="loading-orb" data-orb="1" />
            <span className="loading-orb" data-orb="2" />
            <Image
              src="/icon.png"
              alt="Senior Health Check"
              width={42}
              height={42}
              className="relative z-10 h-10 w-10 object-contain"
              priority
            />
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
            Senior Health Check
          </p>
          <h2 className="mt-2 text-[1.7rem] font-black tracking-tight text-slate-950">
            กำลังเตรียมหน้าจอให้พร้อมใช้งาน
          </h2>
          <p className="mt-3 max-w-sm text-base leading-7 text-slate-600">
            ระบบกำลังโหลดข้อมูลสุขภาพล่าสุดและจัดวางเครื่องมือให้ใช้งานได้ต่อเนื่อง
          </p>

          <div className="mt-6 grid w-full gap-3">
            <div className="loading-shimmer h-4 rounded-full bg-slate-100" />
            <div className="loading-shimmer h-4 w-[82%] justify-self-center rounded-full bg-slate-100" />
            <div className="loading-shimmer h-16 rounded-[1.3rem] bg-emerald-50" />
          </div>
        </div>
      </div>
    </div>
  );
}
