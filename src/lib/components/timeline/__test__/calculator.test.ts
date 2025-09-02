import { describe, expect, test } from 'vitest';
import { CoordinateCalculator, DEFAULT_TIMELINE_CONFIG } from '../timeline';
import { DateTime } from 'effect';

describe('CoordinateCalculator', () => {
	test('roundtrip: Y coordinate to UTC time and back', () => {
		// Setup
		const viewportTop = 100;
		const viewportHeight = 400;
		const referenceDate = DateTime.unsafeFromDate(new Date('2024-01-15T00:00:00Z'));
		const calculator = new CoordinateCalculator(
			viewportTop,
			viewportHeight,
			referenceDate,
			DEFAULT_TIMELINE_CONFIG
		);

		// Test various Y positions
		const testYValues = [
			90, // Near top (accounting for offset)
			200, // Upper quarter
			300, // Middle
			400, // Lower quarter
			490 // Near bottom
		];

		testYValues.forEach((originalY) => {
			// Convert Y to UTC time
			const utcTime = calculator.calculateYToUtc(originalY);

			// Convert back to Y
			const resultY = calculator.calculateUtcToY(utcTime);

			// Should be close to original (within quantization tolerance)
			const tolerance = 10; // Small tolerance for rounding
			expect(Math.abs(resultY - originalY)).toBeLessThanOrEqual(tolerance);
		});
	});

	test('roundtrip: UTC time to Y coordinate and back', () => {
		// Setup
		const viewportTop = 100;
		const viewportHeight = 400;
		const referenceDate = DateTime.unsafeFromDate(new Date('2024-01-15T00:00:00Z'));
		const calculator = new CoordinateCalculator(
			viewportTop,
			viewportHeight,
			referenceDate,
			DEFAULT_TIMELINE_CONFIG
		);

		// Create test times throughout the day
		// Note: The reference date is already at KST midnight (UTC 15:00 previous day)
		const kstMidnight = DateTime.unsafeFromDate(new Date('2024-01-14T15:00:00Z'));
		const testTimes = [
			DateTime.add(kstMidnight, { hours: 7 }), // 7:00 KST
			DateTime.add(kstMidnight, { hours: 10 }), // 10:00 KST
			DateTime.add(kstMidnight, { hours: 15 }), // 15:00 KST
			DateTime.add(kstMidnight, { hours: 19 }), // 19:00 KST
			DateTime.add(kstMidnight, { hours: 22 }) // 22:00 KST
		];

		testTimes.forEach((originalTime) => {
			// Convert UTC time to Y
			const y = calculator.calculateUtcToY(originalTime);

			// Convert back to UTC time
			const resultTime = calculator.calculateYToUtc(y);

			// Times should be equal after quantization (15-minute intervals)
			const diffMinutes = Math.abs(DateTime.distance(originalTime, resultTime) / (1000 * 60));
			expect(diffMinutes).toBeLessThanOrEqual(15);
		});
	});

	test('quantization to 15-minute intervals', () => {
		// Setup
		const viewportTop = 100;
		const viewportHeight = 400;
		const referenceDate = DateTime.unsafeFromDate(new Date('2024-01-15T00:00:00Z'));
		const calculator = new CoordinateCalculator(
			viewportTop,
			viewportHeight,
			referenceDate,
			DEFAULT_TIMELINE_CONFIG
		);

		// Test with unaligned time (10:07 KST)
		const kstMidnight = DateTime.unsafeFromDate(new Date('2024-01-14T15:00:00Z'));
		const unalignedTime = DateTime.add(kstMidnight, { hours: 10, minutes: 7 });

		// Convert to Y and back
		const y = calculator.calculateUtcToY(unalignedTime);
		const quantizedTime = calculator.calculateYToUtc(y);

		// Check minutes are quantized to 0, 15, 30, or 45
		const minutes = new Date(quantizedTime.epochMillis).getUTCMinutes();
		expect(minutes % 15).toBe(0);
	});

	test('boundary times', () => {
		// Setup
		const viewportTop = 100;
		const viewportHeight = 400;
		const referenceDate = DateTime.unsafeFromDate(new Date('2024-01-15T00:00:00Z'));
		const calculator = new CoordinateCalculator(
			viewportTop,
			viewportHeight,
			referenceDate,
			DEFAULT_TIMELINE_CONFIG
		);

		// Calculate Y for start and end times
		const kstMidnight = DateTime.unsafeFromDate(new Date('2024-01-14T15:00:00Z'));
		const startTime = DateTime.add(kstMidnight, { hours: 7 }); // 7:00 KST
		const endTime = DateTime.add(kstMidnight, { hours: 22 }); // 22:00 KST

		const startY = calculator.calculateUtcToY(startTime);
		const endY = calculator.calculateUtcToY(endTime);

		// Start should be near top, end near bottom
		// The calculator's #top() returns viewportTop - singleLineHeightInPx / 2 = 90
		// The calculator's #height() returns viewportHeight - singleLineHeightInPx = 380
		// Start time (7:00) should be at #top() = 90
		// End time (22:00) should be at #top() + #height() = 90 + 380 = 470
		expect(startY).toBeCloseTo(viewportTop - DEFAULT_TIMELINE_CONFIG.singleLineHeightInPx / 2, 1);
		expect(endY).toBeCloseTo(
			viewportTop -
				DEFAULT_TIMELINE_CONFIG.singleLineHeightInPx / 2 +
				(viewportHeight - DEFAULT_TIMELINE_CONFIG.singleLineHeightInPx),
			1
		);
	});

	test('custom configuration', () => {
		// Setup with custom config
		const viewportTop = 100;
		const viewportHeight = 400;
		const referenceDate = DateTime.unsafeFromDate(new Date('2024-01-15T00:00:00Z'));
		const customConfig = {
			singleLineHeightInPx: 30,
			slotGranularityInMinutes: 30,
			startHour: 9,
			endHour: 18
		};
		const calculator = new CoordinateCalculator(
			viewportTop,
			viewportHeight,
			referenceDate,
			customConfig
		);

		// Test middle position
		const midY = viewportTop + viewportHeight / 2;
		const midTime = calculator.calculateYToUtc(midY);
		const resultY = calculator.calculateUtcToY(midTime);

		// Should roundtrip within tolerance
		expect(Math.abs(resultY - midY)).toBeLessThanOrEqual(customConfig.singleLineHeightInPx);

		// Check 30-minute quantization
		const minutes = new Date(midTime.epochMillis).getUTCMinutes();
		expect(minutes % 30).toBe(0);
	});
});
