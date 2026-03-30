import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Convert UTC datetime string to client local time
 * @param utcString - UTC datetime in ISO format
 * @param format - Optional dayjs format string
 * @returns Formatted string if format provided, else Dayjs object
 */
export function toLocalTime(
    utcString: string,
    format?: string
): string | Dayjs {
    const localTime = dayjs.utc(utcString).local();
    return format ? localTime.format(format) : localTime;
}
