import { CaseStatus, Role } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

function splitDisplayName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return {
      firstName: "ผู้ใช้",
      lastName: "ใหม่",
    };
  }

  if (parts.length === 1) {
    return {
      firstName: parts[0],
      lastName: "ผู้ใช้งาน",
    };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export async function ensureElderlyProfileForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      elderlyProfile: true,
    },
  });

  if (!user || user.role !== Role.ELDERLY) {
    throw new Error("FORBIDDEN");
  }

  if (user.elderlyProfile) {
    return user.elderlyProfile;
  }

  const names = splitDisplayName(user.name);

  return prisma.elderlyProfile.create({
    data: {
      elderlyUserId: user.id,
      firstName: names.firstName,
      lastName: names.lastName,
      caseStatus: CaseStatus.SELF_SERVICE,
      notes: "สร้างแฟ้มอัตโนมัติจากการสมัครใช้งานครั้งแรก",
    },
  });
}
