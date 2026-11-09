/**
 * Central Registration & Event Configuration
 * Islamic University Bangladesh — 5th Convocation 2027
 * Single Source of Truth for Dates, Deadlines, and Status Logic across the application.
 */

export interface EventConfig {
  eventName: string;
  banglaName: string;
  institution: string;
  location: string;
  ceremonyDatetime: string;
  ceremonyDateFormatted: string;
  ceremonyTimeFormatted: string;
  ceremonyVenue: string;
  registrationStart: string;
  registrationEnd: string;
  registrationStartFormatted: string;
  registrationDeadlineFormatted: string;
  registrationPeriodFormatted: string;
  timezone: string;
}

export const EVENT_CONFIG: EventConfig = {
  eventName: '5th Convocation 2027',
  banglaName: '৫ম সমাবর্তন ২০২৭',
  institution: 'Islamic University Bangladesh',
  location: 'Kushtia, Bangladesh',
  ceremonyDatetime: '2027-02-02T09:00:00+06:00',
  ceremonyDateFormatted: 'Tuesday, 02 February 2027',
  ceremonyTimeFormatted: '09:00 AM BST',
  ceremonyVenue: 'Central Playground, Islamic University Campus, Kushtia',
  registrationStart: '2026-11-10T00:00:00+06:00',
  registrationEnd: '2026-11-25T23:59:59+06:00',
  registrationStartFormatted: '10 November 2026',
  registrationDeadlineFormatted: '25 November 2026',
  registrationPeriodFormatted: '10 Nov – 25 Nov 2026',
  timezone: 'Asia/Dhaka',
};

export interface RegistrationStatusInfo {
  status: 'REGISTRATION STARTED' | 'REGISTRATION CLOSED';
  isOpen: boolean;
  statusBadgeText: string;
  deadlineText: string;
  periodText: string;
  ceremonyText: string;
}

/**
 * Calculates current registration status:
 * - Registration started: 10 Nov 2026 through 25 Nov 2026 23:59:59 BST => "REGISTRATION STARTED"
 * - After 25 Nov 2026 => "REGISTRATION CLOSED"
 *
 * Evaluates against Bangladesh local time (Asia/Dhaka, UTC+6).
 */
export function getRegistrationStatus(overrideNow?: Date): RegistrationStatusInfo {
  const now = overrideNow || new Date();
  const deadline = new Date(EVENT_CONFIG.registrationEnd).getTime();
  const current = now.getTime();

  if (current > deadline) {
    return {
      status: 'REGISTRATION CLOSED',
      isOpen: false,
      statusBadgeText: 'REGISTRATION CLOSED',
      deadlineText: EVENT_CONFIG.registrationDeadlineFormatted,
      periodText: EVENT_CONFIG.registrationPeriodFormatted,
      ceremonyText: `${EVENT_CONFIG.ceremonyDateFormatted}, ${EVENT_CONFIG.ceremonyTimeFormatted}`,
    };
  }

  return {
    status: 'REGISTRATION STARTED',
    isOpen: true,
    statusBadgeText: 'REGISTRATION STARTED',
    deadlineText: EVENT_CONFIG.registrationDeadlineFormatted,
    periodText: EVENT_CONFIG.registrationPeriodFormatted,
    ceremonyText: `${EVENT_CONFIG.ceremonyDateFormatted}, ${EVENT_CONFIG.ceremonyTimeFormatted}`,
  };
}
