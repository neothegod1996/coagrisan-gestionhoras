import { PrismaClient } from '@prisma/client';

export class DateUtils {
  static async isHoliday(
    prisma: PrismaClient,
    date: Date,
    agreementId?: string | null,
  ): Promise<boolean> {
    if (!agreementId) return false;

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const agreement = await prisma.agreement.findUnique({
      where: { id: agreementId },
      include: {
        holidays: {
          where: {
            date: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        },
      },
    });

    if (!agreement) return false;

    // Check specific holidays
    if (agreement.holidays.length > 0) return true;

    // Check weekends
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    if (dayOfWeek === 0 && agreement.sunday_is_holiday) return true;
    if (dayOfWeek === 6 && agreement.saturday_is_holiday) return true;

    return false;
  }
}
