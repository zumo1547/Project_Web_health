export type SimpleCaseStatus =
  | "SELF_SERVICE"
  | "WAITING_DOCTOR"
  | "IN_REVIEW"
  | "COMPLETED";

export type BloodPressureAssessment = {
  label: string;
  shortLabel: string;
  tone: "emerald" | "amber" | "rose" | "slate";
  guidance: string;
};

export function getBloodPressureAssessment(
  systolic?: number | null,
  diastolic?: number | null,
): BloodPressureAssessment {
  if (!systolic || !diastolic) {
    return {
      label: "ยังไม่มีข้อมูลความดันล่าสุด",
      shortLabel: "ยังไม่มีข้อมูล",
      tone: "slate",
      guidance: "กรอกค่าความดันหรืออัปโหลดรูปจากเครื่องวัด เพื่อให้ระบบช่วยประเมินได้",
    };
  }

  if (systolic >= 180 || diastolic >= 120) {
    return {
      label: "อยู่ในระดับอันตราย ควรติดต่อแพทย์หรือหน่วยฉุกเฉินทันที",
      shortLabel: "อันตราย",
      tone: "rose",
      guidance: "พักทันที นั่งนิ่ง ๆ และขอความช่วยเหลือจากแพทย์หรือหน่วยฉุกเฉินโดยเร็ว",
    };
  }

  if (systolic >= 140 || diastolic >= 90) {
    return {
      label: "ความดันค่อนข้างสูง ควรติดตามอย่างใกล้ชิด",
      shortLabel: "ค่อนข้างสูง",
      tone: "rose",
      guidance: "ลองวัดซ้ำหลังพัก และแจ้งคุณหมอหากมีอาการเวียนหัว ปวดศีรษะ หรือแน่นหน้าอก",
    };
  }

  if (systolic < 90 || diastolic < 60) {
    return {
      label: "ความดันค่อนข้างต่ำ",
      shortLabel: "ค่อนข้างต่ำ",
      tone: "amber",
      guidance: "หากมีอาการหน้ามืด อ่อนแรง หรือเวียนหัว ควรนั่งพัก ดื่มน้ำ และแจ้งคุณหมอ",
    };
  }

  if (systolic >= 120 || diastolic >= 80) {
    return {
      label: "เริ่มสูงกว่าปกติเล็กน้อย",
      shortLabel: "เริ่มสูง",
      tone: "amber",
      guidance: "วัดติดตามต่อเนื่อง ลดอาหารเค็ม และบันทึกค่าไว้เพื่อให้คุณหมอดูย้อนหลังได้",
    };
  }

  return {
    label: "อยู่ในเกณฑ์ปกติ",
    shortLabel: "ปกติ",
    tone: "emerald",
    guidance: "ค่าดูค่อนข้างดีในรอบนี้ ควรวัดต่อเนื่องตามเวลาปกติ",
  };
}

export function getCaseStatusContent(status: SimpleCaseStatus) {
  switch (status) {
    case "WAITING_DOCTOR":
      return {
        label: "กำลังรอคุณหมอรับเคส",
        tone: "amber" as const,
        description:
          "ข้อความล่าสุดของคุณถูกส่งเข้าคิวแล้ว เมื่อมีคุณหมอรับเคสจะเริ่มพูดคุยต่อได้ทันที",
      };
    case "IN_REVIEW":
      return {
        label: "มีคุณหมอดูแลอยู่",
        tone: "emerald" as const,
        description:
          "สามารถส่งข้อความ เพิ่มรูปยา หรือบันทึกความดันต่อได้ในเคสเดียวกัน",
      };
    case "COMPLETED":
      return {
        label: "เคสนี้เสร็จสิ้นแล้ว",
        tone: "slate" as const,
        description:
          "หากต้องการปรึกษาอีกครั้ง สามารถเริ่มทักใหม่หรือขอให้คุณหมอรับเคสใหม่ได้",
      };
    default:
      return {
        label: "ใช้งานด้วยตัวเอง",
        tone: "slate" as const,
        description:
          "ยังไม่ได้ขอให้คุณหมอรับเคส แต่สามารถอัปโหลดข้อมูลสุขภาพและดูแฟ้มของตนเองได้ตามปกติ",
      };
  }
}
