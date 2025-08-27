import { DateTime } from 'effect';

// ------------------------------------------------------------
// 한국 TZ 관련 헬퍼 함수
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
