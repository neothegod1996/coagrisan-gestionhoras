import { Injectable } from '@nestjs/common';
import { QueryReportDto } from './dto/query-report.dto';
import { PrismaService } from 'src/prisma.service';
import * as dayjs from 'dayjs';
import {
  Report,
  ReportStatistics,
  EmployeeReport,
  WeekReport,
  MonthReport,
  DayReport,
  SessionReport,
} from './entities/report.entity';
import {
  getISOWeek,
  formatWeekRange,
  doesIncidenceAffectDay,
  getIncidenceHoursForDay,
  calculateHoursBetween,
  getWeekRange,
} from './helpers/date.helper';
import {
  calculateNormalAndExtraHours,
  calculateWorkedHours,
  roundHours,
  applyRoundingToClocks,
} from './helpers/hours.helper';
import {
  isWorkingDay,
  getAllDatesInRange,
  checkAgreementHoliday,
  AgreementInfo,
} from './helpers/schedule.helper';

interface ShiftData {
  id: string;
  date: Date;
  employee_id: string;
  schedule_session_id: string | null;
  shift_clock: Array<{
    id: string;
    time: Date;
    terminal_id: string;
  }>;
  schedule_session: {
    id: string;
    start_time: Date;
    end_time: Date;
    has_break: boolean;
    break_start_time: Date | null;
    break_end_time: Date | null;
    shift_type: string;
  } | null;
  employee: {
    id: string;
    first_name: string;
    last_name: string | null;
    is_responsible: boolean;
    schedule: {
      id: string;
      name: string;
      sessions: Array<{
        id: string;
        start_time: Date;
        end_time: Date;
        has_break: boolean;
        break_start_time: Date | null;
        break_end_time: Date | null;
        shift_type: string;
      }>;
      days: Array<{
        id: string;
        day: string;
      }>;
    } | null;
  };
}

interface IncidenceData {
  id: string;
  start_date: Date;
  end_date: Date;
  type: string;
  paid: boolean;
  all_day: boolean;
  is_global: boolean;
  employees: Array<{ id: string }>;
  profiles: Array<{ id: string }>;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(query: QueryReportDto, partner_id?: string): Promise<Report> {
    const {
      employee_id,
      profile_id,
      location_id,
      agreement_id,
      employee_from,
      employee_to,
      start_date,
      end_date,
      limit_to_8_hours,
      rounding = 'none',
    } = query;

    const whereEmployee: any = {
      partner_id,
      status: 'active',
    };

    if (employee_id) {
      // Specific employee selected — ignore profile/location/agreement/range filters
      whereEmployee.id = employee_id;
    } else {
      if (profile_id) whereEmployee.profile_id = profile_id;
      if (location_id) whereEmployee.location_id = location_id;
      if (agreement_id) {
        whereEmployee.agreements = { some: { agreement_id } };
      }
      if (employee_from || employee_to) {
        whereEmployee.card_id = {};
        if (employee_from) whereEmployee.card_id.gte = employee_from;
        if (employee_to) whereEmployee.card_id.lte = employee_to;
      }
    }

    let finalStartDate: Date;
    let finalEndDate: Date;

    if (start_date && end_date) {
      finalStartDate = dayjs(start_date).startOf('day').toDate();
      finalEndDate = dayjs(end_date).endOf('day').toDate();
    } else if (start_date) {
      finalStartDate = dayjs(start_date).startOf('day').toDate();
      finalEndDate = dayjs(start_date).endOf('month').toDate();
    } else if (end_date) {
      finalStartDate = dayjs(end_date).startOf('month').toDate();
      finalEndDate = dayjs(end_date).endOf('day').toDate();
    } else {
      finalStartDate = dayjs().startOf('month').toDate();
      finalEndDate = dayjs().endOf('month').toDate();
    }

    const employees = await this.prisma.employee.findMany({
      where: whereEmployee,
      orderBy: [{ card_id: 'asc' }, { first_name: 'asc' }],
      include: {
        schedule: {
          include: {
            sessions: true,
            days: true,
          },
        },
        agreements: {
          include: {
            agreement: {
              include: {
                holidays: {
                  where: {
                    date: {
                      gte: finalStartDate,
                      lte: finalEndDate,
                    },
                  },
                },
              },
            },
          },
        },
        employee_shift: {
          where: {
            date: {
              gte: finalStartDate,
              lte: finalEndDate,
            },
          },
          include: {
            shift_clock: {
              orderBy: {
                time: 'asc',
              },
            },
            schedule_session: true,
          },
          orderBy: {
            date: 'asc',
          },
        },
        task_tracker: {
          where: {
            start_time: {
              gte: finalStartDate,
              lte: finalEndDate,
            },
            end_time: { not: null },
          },
          select: {
            id: true,
            start_time: true,
            end_time: true,
            duration: true,
            created_at: true,
          },
          orderBy: { start_time: 'asc' },
        },
      },
    });

    const incidences = await this.getRelevantIncidences(
      partner_id,
      profile_id,
      finalStartDate,
      finalEndDate,
      employees.map(e => e.id)
    );

    const report = this.processEmployeesData(
      employees,
      incidences,
      limit_to_8_hours || false,
      finalStartDate,
      finalEndDate,
      rounding,
    );

    return report;
  }

  private async getRelevantIncidences(
    partner_id: string | undefined,
    profile_id: string | undefined,
    start_date: Date,
    end_date: Date,
    employee_ids: string[]
  ): Promise<IncidenceData[]> {
    const where: any = {
      AND: [
        { start_date: { lte: end_date } },
        { end_date: { gte: start_date } },
      ],
    };
    if (partner_id) where.partner_id = partner_id;

    const incidences = await this.prisma.incidence.findMany({
      where,
      include: {
        employees: { select: { id: true } },
        profiles: { select: { id: true } },
      },
    });

    return incidences.filter((inc) => {
      if (inc.is_global) return true;
      const hasEmployee = inc.employees.some((emp) => employee_ids.includes(emp.id));
      if (hasEmployee) return true;
      if (profile_id) {
        const hasProfile = inc.profiles.some((prof) => prof.id === profile_id);
        if (hasProfile) return true;
      }
      return false;
    }) as IncidenceData[];
  }

  private processEmployeesData(
    employees: any[],
    incidences: IncidenceData[],
    limitTo8Hours: boolean,
    startDate: Date,
    endDate: Date,
    rounding: 'none' | '15' | '30' | '60' = 'none',
  ): Report {
    const employeeReports: EmployeeReport[] = [];

    for (const employee of employees) {
      const employeeIncidences = this.getEmployeeIncidences(employee.id, incidences);

      const employeeInfo = {
        id: employee.id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        is_responsible: employee.is_responsible,
        schedule: employee.schedule,
      };

      const shifts: ShiftData[] = employee.employee_shift.map((shift: any) => ({
        ...shift,
        employee: employeeInfo,
      }));

      // Add task_tracker sessions as synthetic shifts (for app/web tracking)
      for (const tracker of (employee.task_tracker || [])) {
        if (!tracker.start_time || !tracker.end_time) continue;
        shifts.push({
          id: tracker.id,
          date: dayjs(tracker.start_time).startOf('day').toDate(),
          employee_id: employee.id,
          schedule_session_id: null,
          shift_clock: [
            { id: `${tracker.id}-in`, time: new Date(tracker.start_time), terminal_id: 'app' },
            { id: `${tracker.id}-out`, time: new Date(tracker.end_time), terminal_id: 'app' },
          ],
          schedule_session: null,
          employee: employeeInfo,
        });
      }

      const employeeReport = this.processEmployeeData(
        {
          id: employee.id,
          card_id: employee.card_id,
          first_name: employee.first_name,
          last_name: employee.last_name,
          is_responsible: employee.is_responsible,
          schedule: employee.schedule,
        },
        shifts,
        employeeIncidences,
        limitTo8Hours,
        startDate,
        endDate,
        (employee.agreements || []) as AgreementInfo[],
        rounding,
      );

      employeeReports.push(employeeReport);
    }

    const statistics = this.calculateStatistics(employeeReports);

    return {
      statistics,
      employees: employeeReports,
    };
  }

  private getEmployeeIncidences(employeeId: string, incidences: IncidenceData[]): IncidenceData[] {
    return incidences.filter((inc) => {
      if (inc.is_global) return true;
      return inc.employees.some((emp) => emp.id === employeeId);
    });
  }

  private processEmployeeData(
    employee: ShiftData['employee'] & { card_id?: string | null },
    shifts: ShiftData[],
    incidences: IncidenceData[],
    limitTo8Hours: boolean,
    startDate: Date,
    endDate: Date,
    agreements: AgreementInfo[] = [],
    rounding: 'none' | '15' | '30' | '60' = 'none',
  ): EmployeeReport {
    const allWeeks = this.getAllWeeksInRange(startDate, endDate);

    const weekShiftsMap = new Map<string, ShiftData[]>();

    for (const shift of shifts) {
      const { week, year } = getISOWeek(shift.date);
      const weekKey = `${year}-W${String(week).padStart(2, '0')}`;
      if (!weekShiftsMap.has(weekKey)) weekShiftsMap.set(weekKey, []);
      weekShiftsMap.get(weekKey)!.push(shift);
    }

    const weekReports: WeekReport[] = [];
    let totalHours = 0;
    let totalNormalHours = 0;
    let totalExtraHours = 0;

    for (const { week, year } of allWeeks) {
      const weekKey = `${year}-W${String(week).padStart(2, '0')}`;
      const weekShifts = weekShiftsMap.get(weekKey) || [];

      const weekReport = this.processWeekData(
        weekShifts,
        incidences,
        week,
        year,
        employee.schedule,
        employee.is_responsible,
        limitTo8Hours,
        startDate,
        endDate,
        agreements,
        rounding,
      );

      weekReports.push(weekReport);
      totalHours += weekReport.total_hours;
      totalNormalHours += weekReport.normal_hours;
      totalExtraHours += weekReport.extra_hours;
    }

    const months = this.buildMonthReportsFromWeeks(weekReports);

    return {
      id: employee.id,
      card_id: employee.card_id ?? null,
      first_name: employee.first_name,
      last_name: employee.last_name,
      full_name: `${employee.first_name}${employee.last_name ? ' ' + employee.last_name : ''}`,
      total_hours: roundHours(totalHours),
      normal_hours: roundHours(totalNormalHours),
      extra_hours: roundHours(totalExtraHours),
      weeks: weekReports,
      months,
    };
  }

  private buildMonthReportsFromWeeks(weekReports: WeekReport[]): MonthReport[] {
    const monthMap = new Map<string, {
      label: string; year: number; month: number; days: DayReport[];
    }>();

    for (const week of weekReports) {
      for (const day of week.days) {
        const monthKey = dayjs(day.date).format('YYYY-MM');
        const monthLabel = dayjs(day.date).format('MMMM YYYY');
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, {
            label: monthLabel,
            year: dayjs(day.date).year(),
            month: dayjs(day.date).month() + 1,
            days: [],
          });
        }
        monthMap.get(monthKey)!.days.push(day);
      }
    }

    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, { label, year, month, days }]) => ({
        month_label: label,
        month_key: monthKey,
        year,
        month,
        total_hours: roundHours(days.reduce((s, d) => s + d.total_hours, 0)),
        normal_hours: roundHours(days.reduce((s, d) => s + d.normal_hours, 0)),
        extra_hours: roundHours(days.reduce((s, d) => s + d.extra_hours, 0)),
        days,
      }));
  }

  private processWeekData(
    shifts: ShiftData[],
    incidences: IncidenceData[],
    week: number,
    year: number,
    schedule: ShiftData['employee']['schedule'],
    isResponsible: boolean,
    limitTo8Hours: boolean,
    startDate: Date,
    endDate: Date,
    agreements: AgreementInfo[] = [],
    rounding: 'none' | '15' | '30' | '60' = 'none',
  ): WeekReport {
    const { start: weekStart, end: weekEnd } = getWeekRange(week, year);

    const effectiveStart = dayjs(weekStart).isAfter(startDate) ? weekStart : startDate;
    const effectiveEnd = dayjs(weekEnd).isBefore(endDate) ? weekEnd : endDate;

    const allDates = getAllDatesInRange(effectiveStart, effectiveEnd);

    const dayShiftsMap = new Map<string, ShiftData[]>();
    for (const shift of shifts) {
      const dayKey = dayjs(shift.date).format('YYYY-MM-DD');
      if (!dayShiftsMap.has(dayKey)) dayShiftsMap.set(dayKey, []);
      dayShiftsMap.get(dayKey)!.push(shift);
    }

    const dayReports: DayReport[] = [];
    let weekTotalHours = 0;
    let weekNormalHours = 0;
    let weekExtraHours = 0;

    for (const dayDate of allDates) {
      const dayKey = dayjs(dayDate).format('YYYY-MM-DD');
      const dayShifts = dayShiftsMap.get(dayKey) || [];

      const dayReport = this.processDayData(
        dayShifts,
        incidences,
        dayDate,
        schedule,
        isResponsible,
        limitTo8Hours,
        agreements,
        rounding,
      );

      dayReports.push(dayReport);
      weekTotalHours += dayReport.total_hours;
      weekNormalHours += dayReport.normal_hours;
      weekExtraHours += dayReport.extra_hours;
    }

    const effectiveWeekRange = allDates.length > 0
      ? `${dayjs(allDates[0]).format('DD/MM')} - ${dayjs(allDates[allDates.length - 1]).format('DD/MM')}`
      : formatWeekRange(week, year);

    return {
      week_range: effectiveWeekRange,
      week_number: week,
      year,
      total_hours: roundHours(weekTotalHours),
      normal_hours: roundHours(weekNormalHours),
      extra_hours: roundHours(weekExtraHours),
      days: dayReports,
    };
  }

  private processDayData(
    shifts: ShiftData[],
    incidences: IncidenceData[],
    date: Date,
    schedule: ShiftData['employee']['schedule'],
    isResponsible: boolean,
    limitTo8Hours: boolean,
    agreements: AgreementInfo[] = [],
    rounding: 'none' | '15' | '30' | '60' = 'none',
  ): DayReport {
    const dayIncidences = incidences.filter((inc) =>
      doesIncidenceAffectDay(inc.start_date, inc.end_date, date)
    );

    const hasIncidence = dayIncidences.length > 0;

    const { isHoliday: isAgreementHolidayDay, holidayName: agreementHolidayName } =
      checkAgreementHoliday(date, agreements);

    const isScheduledWorkDay = schedule ? isWorkingDay(date, schedule.days) : true;

    let incidenceName: string | undefined;
    let incidenceType: string | undefined;
    let incidencePaid: boolean | undefined;

    const typeNames: Record<string, string> = {
      holiday: 'Vacaciones',
      festive: 'Festivo',
      absence: 'Ausencia',
      medical_leave: 'Baja Médica',
      personal_leave: 'Permiso Personal',
      sindical_leave: 'Baja Sindical',
      medical_visit: 'Visita Médica',
      union_hours: 'Horas Sindicales',
      leave_of_absence: 'Excedencia',
      overtime_rest: 'Descanso Exceso Tiempo',
      other: 'Otra',
    };

    if (hasIncidence) {
      const mainIncidence = dayIncidences[0];
      incidenceType = mainIncidence.type;
      incidencePaid = mainIncidence.paid;
      const typeName = typeNames[mainIncidence.type] || mainIncidence.type;
      const paidStatus = mainIncidence.paid ? 'Pagada' : 'No pagada';
      incidenceName = `${typeName} (${paidStatus})`;
    } else if (isAgreementHolidayDay) {
      incidenceType = 'festive';
      incidencePaid = false;
      incidenceName = agreementHolidayName || 'Festivo (Convenio)';
    } else if (!isScheduledWorkDay && shifts.length === 0) {
      incidenceType = 'festive';
      incidencePaid = false;
      incidenceName = 'Festivo';
    }

    const sessionReports: SessionReport[] = [];
    let dayTotalHours = 0;

    for (const shift of shifts) {
      const sessionReport = this.processSessionData(shift, dayIncidences, isResponsible, rounding);
      sessionReports.push(sessionReport);
      dayTotalHours += sessionReport.hours;
    }

    if (shifts.length === 0 && hasIncidence) {
      const paidAllDayIncidences = dayIncidences.filter((inc) => inc.paid && inc.all_day);

      if (paidAllDayIncidences.length > 0 && schedule && schedule.sessions) {
        const scheduledHours = schedule.sessions.reduce((sum, session) => {
          return sum + calculateHoursBetween(session.start_time, session.end_time);
        }, 0);

        dayTotalHours = scheduledHours;

        for (const session of schedule.sessions) {
          const sessionHours = calculateHoursBetween(session.start_time, session.end_time);
          sessionReports.push({
            schedule_start: session.start_time,
            schedule_end: session.end_time,
            clock_in: null,
            clock_out: null,
            break_start: session.break_start_time,
            break_end: session.break_end_time,
            actual_break_start: null,
            actual_break_end: null,
            hours: roundHours(sessionHours),
            has_incidence: true,
            incidence_type: dayIncidences[0].type,
          });
        }
      }
    }

    if (isResponsible && dayTotalHours > 8) dayTotalHours = 8;

    let normal_hours: number;
    let extra_hours: number;
    if (isAgreementHolidayDay && !isResponsible) {
      normal_hours = 0;
      extra_hours = dayTotalHours;
    } else {
      ({ normal_hours, extra_hours } = calculateNormalAndExtraHours(dayTotalHours, limitTo8Hours || isResponsible));
    }

    let scheduleInfo = 'Sin horario';
    if (schedule) scheduleInfo = schedule.name;

    const hasSpecialDay = hasIncidence || isAgreementHolidayDay || (!isScheduledWorkDay && shifts.length === 0);
    if (hasSpecialDay && incidenceName) scheduleInfo = incidenceName;

    return {
      date: dayjs(date).format('YYYY-MM-DD'),
      schedule_info: scheduleInfo,
      total_hours: roundHours(dayTotalHours),
      normal_hours: roundHours(normal_hours),
      extra_hours: roundHours(extra_hours),
      has_incidence: hasSpecialDay,
      incidence_name: incidenceName,
      incidence_type: incidenceType,
      incidence_paid: incidencePaid,
      sessions: sessionReports,
    };
  }

  private processSessionData(
    shift: ShiftData,
    incidences: IncidenceData[],
    isResponsible: boolean,
    rounding: 'none' | '15' | '30' | '60' = 'none',
  ): SessionReport {
    const { shift_clock, schedule_session, date } = shift;

    const sessionIncidences = incidences.filter((inc) =>
      doesIncidenceAffectDay(inc.start_date, inc.end_date, date)
    );

    const hasIncidence = sessionIncidences.length > 0;
    const hasPaidIncidence = sessionIncidences.some((inc) => inc.paid);
    const hasUnpaidIncidence = sessionIncidences.some((inc) => !inc.paid);

    if (hasUnpaidIncidence) {
      return {
        schedule_start: schedule_session?.start_time || null,
        schedule_end: schedule_session?.end_time || null,
        clock_in: null,
        clock_out: null,
        break_start: schedule_session?.break_start_time || null,
        break_end: schedule_session?.break_end_time || null,
        actual_break_start: null,
        actual_break_end: null,
        hours: 0,
        has_incidence: true,
        incidence_type: sessionIncidences.find((inc) => !inc.paid)?.type,
      };
    }

    if (shift_clock && shift_clock.length > 0) {
      const rawTimes = shift_clock.map((clock) => clock.time);
      const clockTimes = applyRoundingToClocks(rawTimes, rounding);
      let { hours, clockIn, clockOut, breakStart, breakEnd } = calculateWorkedHours(clockTimes);

      if (isResponsible && hours > 8 && clockIn && clockOut) {
        const adjustedClockIn = dayjs(clockOut).subtract(8, 'hour').toDate();
        clockIn = adjustedClockIn;
        hours = 8;
      }

      return {
        schedule_start: schedule_session?.start_time || null,
        schedule_end: schedule_session?.end_time || null,
        clock_in: clockIn,
        clock_out: clockOut,
        break_start: schedule_session?.break_start_time || null,
        break_end: schedule_session?.break_end_time || null,
        actual_break_start: breakStart,
        actual_break_end: breakEnd,
        hours: roundHours(hours),
        has_incidence: hasIncidence,
        incidence_type: hasIncidence ? sessionIncidences[0].type : undefined,
      };
    }

    if (hasPaidIncidence && schedule_session) {
      const scheduledHours = calculateHoursBetween(
        schedule_session.start_time,
        schedule_session.end_time
      );

      return {
        schedule_start: schedule_session.start_time,
        schedule_end: schedule_session.end_time,
        clock_in: null,
        clock_out: null,
        break_start: schedule_session.break_start_time,
        break_end: schedule_session.break_end_time,
        actual_break_start: null,
        actual_break_end: null,
        hours: roundHours(scheduledHours),
        has_incidence: true,
        incidence_type: sessionIncidences[0].type,
      };
    }

    return {
      schedule_start: schedule_session?.start_time || null,
      schedule_end: schedule_session?.end_time || null,
      clock_in: null,
      clock_out: null,
      break_start: schedule_session?.break_start_time || null,
      break_end: schedule_session?.break_end_time || null,
      actual_break_start: null,
      actual_break_end: null,
      hours: 0,
      has_incidence: false,
    };
  }

  private getAllWeeksInRange(startDate: Date, endDate: Date): Array<{ week: number; year: number }> {
    const weeks: Array<{ week: number; year: number }> = [];
    const seenWeeks = new Set<string>();

    let currentDate = dayjs(startDate).startOf('day');
    const end = dayjs(endDate).startOf('day');

    while (currentDate.isBefore(end) || currentDate.isSame(end)) {
      const { week, year } = getISOWeek(currentDate.toDate());
      const weekKey = `${year}-W${week}`;
      if (!seenWeeks.has(weekKey)) {
        seenWeeks.add(weekKey);
        weeks.push({ week, year });
      }
      currentDate = currentDate.add(1, 'day');
    }

    return weeks.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.week - b.week;
    });
  }

  private calculateStatistics(employees: EmployeeReport[]): ReportStatistics {
    let totalHours = 0;
    let totalNormalHours = 0;
    let totalExtraHours = 0;

    for (const employee of employees) {
      totalHours += employee.total_hours;
      totalNormalHours += employee.normal_hours;
      totalExtraHours += employee.extra_hours;
    }

    const totalEmployees = employees.length;
    const averageHoursPerEmployee = totalEmployees > 0 ? totalHours / totalEmployees : 0;

    return {
      total_employees: totalEmployees,
      total_hours: roundHours(totalHours),
      normal_hours: roundHours(totalNormalHours),
      extra_hours: roundHours(totalExtraHours),
      average_hours_per_employee: roundHours(averageHoursPerEmployee),
    };
  }
}
