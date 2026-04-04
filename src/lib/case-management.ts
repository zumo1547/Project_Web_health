import { CaseStatus, DoctorCaseStatus } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

export async function syncElderlyCaseStatus(
  elderlyId: string,
  fallbackStatus: CaseStatus,
) {
  const activeDoctorCount = await prisma.doctorPatient.count({
    where: {
      elderlyId,
      status: DoctorCaseStatus.ACTIVE,
    },
  });

  return prisma.elderlyProfile.update({
    where: {
      id: elderlyId,
    },
    data: {
      caseStatus:
        activeDoctorCount > 0 ? CaseStatus.IN_REVIEW : fallbackStatus,
    },
    include: {
      doctors: {
        where: {
          status: DoctorCaseStatus.ACTIVE,
        },
        select: {
          doctor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });
}
