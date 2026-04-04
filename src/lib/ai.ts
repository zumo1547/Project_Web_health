import { AiScanType, CaseStatus } from "@/generated/prisma";
import { getBloodPressureAssessment } from "@/lib/health-presenters";
import path from "path";
import sharp from "sharp";

type AnalyzeImageInput = {
  scanType: AiScanType;
  fileName: string;
  imageUrl: string;
  hintText?: string;
  imageBuffer?: Buffer;
};

type AnalyzeImageResult = {
  summary: string;
  confidence: number;
  extractedText?: string;
  rawResult: Record<string, unknown>;
};

type AiHealthContext = {
  firstName: string;
  chronicDiseases?: string | null;
  allergies?: string | null;
  latestBloodPressure?: {
    systolic: number;
    diastolic: number;
    pulse?: number | null;
    measuredAt: Date;
  } | null;
  latestMedicineLabel?: string | null;
  latestAiSummary?: string | null;
  doctorNames?: string[];
  caseStatus: CaseStatus;
};

type AiHealthReply = {
  role: "ASSISTANT";
  content: string;
};

type KnownMedicine = {
  keywords: string[];
  name: string;
  usage: string;
};

const KNOWN_MEDICINES: KnownMedicine[] = [
  {
    keywords: ["paracetamol", "acetaminophen", "tylenol"],
    name: "Paracetamol",
    usage: "ใช้บรรเทาไข้และอาการปวดทั่วไป",
  },
  {
    keywords: ["amlodipine", "amlo"],
    name: "Amlodipine",
    usage: "มักใช้ควบคุมความดันโลหิตสูง",
  },
  {
    keywords: ["losartan", "cozaar"],
    name: "Losartan",
    usage: "มักใช้ควบคุมความดันโลหิตสูงและช่วยดูแลผู้ป่วยบางรายที่มีโรคไต",
  },
  {
    keywords: ["enalapril"],
    name: "Enalapril",
    usage: "มักใช้ควบคุมความดันโลหิตสูงและภาวะหัวใจทำงานไม่เต็มที่",
  },
  {
    keywords: ["bisoprolol"],
    name: "Bisoprolol",
    usage: "มักใช้ควบคุมความดันโลหิต ชีพจร หรือดูแลโรคหัวใจบางชนิด",
  },
  {
    keywords: ["atenolol", "prenolol", "prenolol 25", "prenolol25"],
    name: "Atenolol",
    usage: "มักใช้ควบคุมความดันโลหิตและอัตราการเต้นของหัวใจ",
  },
  {
    keywords: ["metformin", "glucophage"],
    name: "Metformin",
    usage: "มักใช้ควบคุมระดับน้ำตาลในเลือด",
  },
  {
    keywords: ["aspirin"],
    name: "Aspirin",
    usage: "อาจใช้ลดปวด ลดไข้ หรือใช้ตามแผนการรักษาโรคหัวใจบางกรณี",
  },
  {
    keywords: ["clopidogrel", "plavix"],
    name: "Clopidogrel",
    usage: "มักใช้ช่วยลดการเกาะตัวของเกล็ดเลือดตามคำสั่งแพทย์",
  },
  {
    keywords: ["simvastatin"],
    name: "Simvastatin",
    usage: "มักใช้ช่วยควบคุมระดับไขมันในเลือด",
  },
  {
    keywords: ["atorvastatin"],
    name: "Atorvastatin",
    usage: "มักใช้ช่วยควบคุมระดับไขมันในเลือด",
  },
  {
    keywords: ["omeprazole"],
    name: "Omeprazole",
    usage: "มักใช้ลดกรดในกระเพาะอาหาร",
  },
  {
    keywords: ["furosemide", "lasix"],
    name: "Furosemide",
    usage: "มักใช้ช่วยขับปัสสาวะและลดอาการบวมตามคำสั่งแพทย์",
  },
  {
    keywords: ["amoxicillin"],
    name: "Amoxicillin",
    usage: "เป็นยาปฏิชีวนะที่มักใช้รักษาการติดเชื้อบางชนิด",
  },
  {
    keywords: ["cetirizine"],
    name: "Cetirizine",
    usage: "มักใช้บรรเทาอาการแพ้และคัน",
  },
];

function normalizeText(input: string) {
  return input.toLowerCase().replace(/\s+/g, " ").trim();
}

function titleCaseWord(input: string) {
  if (!input) return input;
  return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
}

function uniqueTextLines(input: string) {
  const seen = new Set<string>();

  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      const normalized = normalizeText(line);
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    })
    .join("\n");
}

async function buildOcrCandidates(imageBuffer: Buffer) {
  const base = sharp(imageBuffer).rotate();
  const metadata = await base.metadata();
  const originalWidth = metadata.width ?? 1200;
  const targetWidth = originalWidth < 1800 ? 1800 : originalWidth;

  const resized = base.resize({
    width: targetWidth,
    withoutEnlargement: originalWidth >= targetWidth,
  });

  const enhanced = await resized
    .clone()
    .grayscale()
    .normalise()
    .sharpen()
    .png()
    .toBuffer();

  const thresholded = await resized
    .clone()
    .grayscale()
    .normalise()
    .threshold(160)
    .png()
    .toBuffer();

  return [enhanced, thresholded];
}

async function recognizeTextFromImage(imageBuffer?: Buffer) {
  if (!imageBuffer) {
    return "";
  }

  try {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng", 1, {
      workerPath: path.join(
        process.cwd(),
        "node_modules",
        "tesseract.js",
        "src",
        "worker-script",
        "node",
        "index.js",
      ),
      cachePath: path.join(process.cwd(), ".cache", "tesseract"),
    });

    try {
      const candidateBuffers = await buildOcrCandidates(imageBuffer);
      const texts: string[] = [];

      for (const candidate of candidateBuffers) {
        const result = await worker.recognize(candidate);
        const text = result.data.text?.trim();
        if (text) {
          texts.push(text);
        }
      }

      return uniqueTextLines(texts.join("\n"));
    } finally {
      await worker.terminate();
    }
  } catch (error) {
    console.error("OCR_ERROR", error);
    return "";
  }
}

function matchKnownMedicine(sourceText: string) {
  return KNOWN_MEDICINES.find((medicine) =>
    medicine.keywords.some((keyword) => sourceText.includes(keyword)),
  );
}

function extractMedicineCandidate(sourceText: string) {
  const directMatch = sourceText.match(
    /\b([a-z][a-z0-9-]{3,24})\s*(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml)\b/i,
  );

  if (directMatch) {
    return `${titleCaseWord(directMatch[1])} ${directMatch[2]} ${directMatch[3]}`;
  }

  const wordMatch = sourceText.match(/\b([a-z][a-z0-9-]{5,24})\b/i);
  if (wordMatch) {
    return titleCaseWord(wordMatch[1]);
  }

  return null;
}

function buildSourceText(input: AnalyzeImageInput, extractedText: string) {
  return normalizeText(
    [input.fileName, input.hintText ?? "", extractedText].filter(Boolean).join(" "),
  );
}

async function analyzeMedicineImage(
  input: AnalyzeImageInput,
): Promise<AnalyzeImageResult> {
  const extractedText = await recognizeTextFromImage(input.imageBuffer);
  const sourceText = buildSourceText(input, extractedText);
  const matched = matchKnownMedicine(sourceText);

  if (matched) {
    return {
      summary: `ระบบคาดว่ายาในภาพคือ ${matched.name} ซึ่ง${matched.usage} กรุณาตรวจชื่อยาและขนาดยาบนฉลากอีกครั้งก่อนใช้จริง`,
      confidence: extractedText ? 0.88 : 0.72,
      extractedText: extractedText || input.hintText,
      rawResult: {
        mode: extractedText ? "ocr" : "fallback",
        imageUrl: input.imageUrl,
        medicineName: matched.name,
        usage: matched.usage,
        extractedText: extractedText || null,
      },
    };
  }

  const candidateName = extractMedicineCandidate(sourceText);
  if (candidateName) {
    return {
      summary: `ระบบอ่านได้บางส่วนว่าอาจเป็นยา "${candidateName}" แต่ยังไม่มั่นใจพอที่จะยืนยันชนิดยาแน่ชัด ควรถ่ายรูปฉลากให้ชัดขึ้นหรือให้คุณหมอตรวจสอบก่อนใช้`,
      confidence: extractedText ? 0.56 : 0.42,
      extractedText: extractedText || input.hintText,
      rawResult: {
        mode: extractedText ? "ocr" : "fallback",
        imageUrl: input.imageUrl,
        medicineName: candidateName,
        usage: null,
        extractedText: extractedText || null,
      },
    };
  }

  return {
    summary:
      "ระบบยังอ่านชื่อยาจากรูปนี้ได้ไม่ชัดพอ ลองถ่ายให้เห็นชื่อยา ขนาดยา และหน้ากล่องตรง ๆ หรือพิมพ์ชื่อยาช่วยเพิ่มในช่องด้านบน",
    confidence: extractedText ? 0.24 : 0.18,
    extractedText: extractedText || input.hintText,
    rawResult: {
      mode: extractedText ? "ocr" : "fallback",
      imageUrl: input.imageUrl,
      medicineName: null,
      usage: null,
      extractedText: extractedText || null,
    },
  };
}

function parseBloodPressureFromText(sourceText: string) {
  const pairMatch = sourceText.match(/(\d{2,3})\D{0,8}(\d{2,3})/);
  const pulseMatch = sourceText.match(
    /(?:pulse|pul|hr|bpm)\D{0,8}(\d{2,3})/i,
  );

  if (pairMatch) {
    const systolic = Number(pairMatch[1]);
    const diastolic = Number(pairMatch[2]);

    if (
      Number.isFinite(systolic) &&
      Number.isFinite(diastolic) &&
      systolic >= 60 &&
      systolic <= 260 &&
      diastolic >= 40 &&
      diastolic <= 180
    ) {
      return {
        systolic,
        diastolic,
        pulse: pulseMatch ? Number(pulseMatch[1]) : null,
      };
    }
  }

  const numberMatches = sourceText.match(/\d{2,3}/g) ?? [];
  if (numberMatches.length >= 2) {
    const numbers = numberMatches.map((value) => Number(value));

    for (let index = 0; index < numbers.length - 1; index += 1) {
      const systolic = numbers[index];
      const diastolic = numbers[index + 1];

      if (
        systolic >= 60 &&
        systolic <= 260 &&
        diastolic >= 40 &&
        diastolic <= 180
      ) {
        const pulseCandidate = numbers[index + 2];
        return {
          systolic,
          diastolic,
          pulse:
            typeof pulseCandidate === "number" &&
            pulseCandidate >= 30 &&
            pulseCandidate <= 220
              ? pulseCandidate
              : null,
        };
      }
    }
  }

  return null;
}

async function analyzeBloodPressureImage(
  input: AnalyzeImageInput,
): Promise<AnalyzeImageResult> {
  const extractedText = await recognizeTextFromImage(input.imageBuffer);
  const sourceText = [input.fileName, input.hintText ?? "", extractedText]
    .filter(Boolean)
    .join(" ");
  const values = parseBloodPressureFromText(sourceText);

  if (!values) {
    return {
      summary:
        "ระบบยังอ่านค่าความดันจากรูปนี้ไม่ได้ ลองถ่ายให้เห็นตัวเลขบนหน้าจอชัดขึ้น หรือกรอกค่าด้วยตัวเองแทน",
      confidence: extractedText ? 0.3 : 0.18,
      extractedText: extractedText || input.hintText,
      rawResult: {
        mode: extractedText ? "ocr" : "fallback",
        imageUrl: input.imageUrl,
        systolic: null,
        diastolic: null,
        pulse: null,
        extractedText: extractedText || null,
      },
    };
  }

  const assessment = getBloodPressureAssessment(
    values.systolic,
    values.diastolic,
  );

  return {
    summary: `ระบบอ่านค่าได้ ${values.systolic}/${values.diastolic} mmHg${values.pulse ? ` ชีพจร ${values.pulse} bpm` : ""} อยู่ในระดับ "${assessment.shortLabel}" ${assessment.guidance}`,
    confidence: extractedText ? 0.9 : 0.76,
    extractedText: extractedText || input.hintText,
    rawResult: {
      mode: extractedText ? "ocr" : "fallback",
      imageUrl: input.imageUrl,
      systolic: values.systolic,
      diastolic: values.diastolic,
      pulse: values.pulse,
      category: assessment.shortLabel,
      guidance: assessment.guidance,
      extractedText: extractedText || null,
    },
  };
}

export async function analyzeImage(input: AnalyzeImageInput) {
  if (input.scanType === AiScanType.MEDICINE_IMAGE) {
    return analyzeMedicineImage(input);
  }

  return analyzeBloodPressureImage(input);
}

export async function generateAiHealthReply(
  message: string,
  context: AiHealthContext,
): Promise<AiHealthReply> {
  const normalizedMessage = normalizeText(message);
  const bloodPressure = context.latestBloodPressure;
  const bloodPressureAssessment = getBloodPressureAssessment(
    bloodPressure?.systolic,
    bloodPressure?.diastolic,
  );

  const fragments: string[] = [];

  if (
    normalizedMessage.includes("ความดัน") ||
    normalizedMessage.includes("bp") ||
    normalizedMessage.includes("เวียนหัว")
  ) {
    if (bloodPressure) {
      fragments.push(
        `ค่าความดันล่าสุดคือ ${bloodPressure.systolic}/${bloodPressure.diastolic} mmHg ซึ่งระบบประเมินว่า "${bloodPressureAssessment.shortLabel}"`,
      );
      fragments.push(bloodPressureAssessment.guidance);
    } else {
      fragments.push(
        "ตอนนี้ยังไม่มีค่าความดันล่าสุดในระบบ ลองกรอกค่าหรืออัปโหลดรูปจากเครื่องวัดก่อน",
      );
    }
  }

  if (
    normalizedMessage.includes("ยา") ||
    normalizedMessage.includes("เม็ด") ||
    normalizedMessage.includes("กิน")
  ) {
    if (context.latestAiSummary) {
      fragments.push(`จากข้อมูลยาล่าสุดในระบบ: ${context.latestAiSummary}`);
    } else if (context.latestMedicineLabel) {
      fragments.push(
        `ตอนนี้มีรูปยาที่บันทึกล่าสุดคือ "${context.latestMedicineLabel}" แต่ยังไม่มีผลวิเคราะห์เพิ่มเติม`,
      );
    } else {
      fragments.push(
        "ตอนนี้ยังไม่มีรูปยาล่าสุดในระบบ หากต้องการให้ช่วยดูเบื้องต้น ลองอัปโหลดรูปยาเพิ่มได้",
      );
    }
  }

  if (
    normalizedMessage.includes("หมอ") ||
    normalizedMessage.includes("เคส") ||
    normalizedMessage.includes("รับเคส")
  ) {
    if (context.caseStatus === CaseStatus.WAITING_DOCTOR) {
      fragments.push("ตอนนี้เคสของคุณอยู่ในคิวรอคุณหมอรับเคสแล้ว");
    } else if (context.caseStatus === CaseStatus.IN_REVIEW) {
      fragments.push(
        context.doctorNames?.length
          ? `ตอนนี้มีคุณหมอดูแลอยู่: ${context.doctorNames.join(", ")}`
          : "ตอนนี้มีคุณหมอกำลังดูแลเคสนี้อยู่",
      );
    } else if (context.caseStatus === CaseStatus.COMPLETED) {
      fragments.push(
        "เคสนี้ปิดแล้ว หากต้องการให้คุณหมอดูอีกครั้ง สามารถเปิดคำขอรับเคสใหม่ได้",
      );
    } else {
      fragments.push(
        "ตอนนี้ยังไม่ได้เปิดขอให้คุณหมอรับเคส หากต้องการสามารถกดปุ่มขอรับเคสในหน้าผู้สูงอายุได้",
      );
    }
  }

  if (fragments.length === 0) {
    fragments.push(
      "ฉันช่วยสรุปข้อมูลสุขภาพเบื้องต้นจากข้อมูลในระบบได้ เช่น เรื่องยา ความดัน และสถานะการดูแลของเคส",
    );

    if (bloodPressure) {
      fragments.push(
        `ตอนนี้ค่าความดันล่าสุดของคุณคือ ${bloodPressure.systolic}/${bloodPressure.diastolic} mmHg อยู่ในระดับ "${bloodPressureAssessment.shortLabel}"`,
      );
    }

    if (context.chronicDiseases) {
      fragments.push(`โรคประจำตัวที่บันทึกไว้: ${context.chronicDiseases}`);
    }
  }

  fragments.push(
    "คำตอบนี้เป็นการช่วยสรุปเบื้องต้นจากข้อมูลในระบบ ไม่ใช่คำวินิจฉัยทางการแพทย์ หากอาการหนักหรือกังวล ควรติดต่อคุณหมอโดยตรง",
  );

  return {
    role: "ASSISTANT",
    content: `คุณ${context.firstName} ${fragments.join(" ")}`,
  };
}
