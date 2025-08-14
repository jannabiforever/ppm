import { Schema, DateTime } from 'effect';

/**
 * DateTime schema that transforms between database string and DateTime.Utc.
 *
 * This schema handles the transformation between ISO string format (used in database)
 * and Effect's DateTime.Utc type for type-safe date/time operations.
 *
 * @example
 * ```typescript
 * // Schema definition
 * const TaskSchema = Schema.Struct({
 *   created_at: DateTimeUtcSchema,
 *   updated_at: DateTimeUtcSchema
 * });
 * ```
 */
export const DateTimeUtcSchema = Schema.transform(
	Schema.String.pipe(Schema.minLength(1)),
	Schema.DateTimeUtcFromSelf,
	{
		decode: (str) => DateTime.unsafeMake(str),
		encode: (dt) => DateTime.formatIso(dt)
	}
);

/**
 * Optional DateTime schema for nullable database fields.
 *
 * Used for fields that can be undefined or null in the database.
 * Automatically handles optional transformations while maintaining type safety.
 *
 * @example
 * ```typescript
 * // Schema definition
 * const TaskSchema = Schema.Struct({
 *   planned_for: OptionalDateTimeUtcSchema, // Can be undefined
 *   completed_at: OptionalDateTimeUtcSchema // Can be undefined
 * });
 * ```
 */
export const OptionalDateTimeUtcSchema = Schema.optional(DateTimeUtcSchema);

/**
 * Date-only schema that transforms between database date string and DateTime.Utc.
 *
 * For fields that represent dates without specific times (e.g., planned_for dates).
 * Still uses DateTime.Utc internally but semantically represents a date.
 *
 * @example
 * ```typescript
 * // For planned_for fields that only care about the date
 * const TaskSchema = Schema.Struct({
 *   planned_for: OptionalDateSchema // '2024-01-01'
 * });
 * ```
 */
export const DateSchema = Schema.transform(
	Schema.String.pipe(
		Schema.pattern(/^\d{4}-\d{2}-\d{2}$/, {
			message: () => 'Date must be in YYYY-MM-DD format'
		})
	),
	Schema.DateTimeUtcFromSelf,
	{
		decode: (dateStr) => DateTime.unsafeMake(`${dateStr}T00:00:00Z`),
		encode: (dt) => DateTime.formatIso(dt).split('T')[0]
	}
);

/**
 * Optional date-only schema for nullable date fields.
 *
 * @example
 * ```typescript
 * const TaskSchema = Schema.Struct({
 *   planned_for: OptionalDateSchema // Can be undefined, represents date only
 * });
 * ```
 */
export const OptionalDateSchema = Schema.optional(DateSchema);

// Type exports for convenience
export type DateTimeUtc = Schema.Schema.Type<typeof DateTimeUtcSchema>;
export type OptionalDateTimeUtc = Schema.Schema.Type<typeof OptionalDateTimeUtcSchema>;
export type DateOnly = Schema.Schema.Type<typeof DateSchema>;
export type OptionalDateOnly = Schema.Schema.Type<typeof OptionalDateSchema>;
