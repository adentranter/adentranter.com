/** Due date is a calendar day in Australia; countdown uses Brisbane midnight. */
export const DUE_DATE_ISO = "2027-04-18T00:00:00+10:00"

/** Standard gestational length used to draw the pregnancy timeline. */
export const PREGNANCY_LENGTH_DAYS = 280

export const DUE_DATE_LABEL = "18 April 2027"

/** Sister's baby — a boy. Same Brisbane midnight convention as the clone. */
export const COUSIN_DUE_DATE_ISO = "2027-01-11T00:00:00+10:00"

export const COUSIN_DUE_DATE_LABEL = "11 January 2027"

export function getPregnancyStartMs(dueMs: number): number {
  return dueMs - PREGNANCY_LENGTH_DAYS * 24 * 60 * 60 * 1000
}
