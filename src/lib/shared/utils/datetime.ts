import { DateTime } from 'effect';

// ------------------------------------------------------------
// Helper functions about KST timezone handling
// ------------------------------------------------------------

export const KST_TIMEZONE = DateTime.zoneUnsafeMakeNamed('Asia/Seoul');

export function getKstZoned(utc: DateTime.Utc): DateTime.Zoned {
	return DateTime.unsafeMakeZoned(utc, { timeZone: KST_TIMEZONE });
}

export function getKstMidnightAsZoned(utc: DateTime.Utc): DateTime.Zoned {
	const kstZoned = getKstZoned(utc);
	return DateTime.startOf(kstZoned, 'day');
}

export function getKstMidnightAsUtc(utc: DateTime.Utc): DateTime.Utc {
	const kstZoned = getKstZoned(utc);
	return DateTime.toUtc(DateTime.startOf(kstZoned, 'day'));
}

/** Time formatting helper: HH:mm in KST */
export function formatTimeKstHHmm(time: DateTime.Utc): string {
	return DateTime.formatIntl(
		time,
		new Intl.DateTimeFormat('ko-KR', {
			timeZone: 'Asia/Seoul',
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		})
	);
}
