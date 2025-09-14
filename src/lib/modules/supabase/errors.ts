import {
	AuthError as AE,
	PostgrestError as PE,
	type PostgrestMaybeSingleResponse,
	type PostgrestSingleResponse
} from '@supabase/supabase-js';
import { Data, Effect } from 'effect';
import * as Option from 'effect/Option';
import { StorageApiError as SAE } from '@supabase/storage-js';
import { StatusCodes } from 'http-status-codes';

/**
 * A wrapper class for authentication errors that helps implement error tags introduced in 'effect'.
 * This class extends the TaggedError class from the 'effect' library to create tagged errors
 * specialized for Supabase authentication operations.
 *
 * @remarks
 * Using this class provides consistent error handling and makes it easier to work with
 * the Effect pattern for functional error handling.
 */
export class AuthError extends Data.TaggedError('SupabaseAuth')<{
	readonly message: string;
	readonly status: number;
}> {
	/**
	 * Converts a native Supabase AuthError to a SupabaseAuthError.
	 * This constructor is useful for standardizing error handling in Effect-based applications.
	 *
	 * @param error - The original Supabase AuthError to wrap
	 * @returns A new SupabaseAuthError instance containing the original error information
	 *
	 * @example
	 * ```ts
	 * try {
	 *   // Supabase auth operation
	 * } catch (error) {
	 *   if (error instanceof AE) {
	 *     throw new AuthError(error);
	 *   }
	 * }
	 * ```
	 */
	constructor(error: AE) {
		super({ message: error.message, status: error.status ?? StatusCodes.INTERNAL_SERVER_ERROR });
	}
}

/**
 * A wrapper class for storage errors that helps implement error tags introduced in 'effect'.
 * This class extends the TaggedError class from the 'effect' library to create tagged errors
 * specialized for Supabase storage operations.
 *
 * @remarks
 * Provides a consistent interface for handling storage-related errors within the Effect pattern,
 * making error propagation and handling more predictable across the application.
 */
export class StorageError extends Data.TaggedError('SupabaseStorageApi')<{
	readonly message: string;
	readonly status: number;
}> {
	/**
	 * Creates a new StorageError instance by wrapping a Supabase StorageApiError.
	 *
	 * @param error - The original Supabase StorageApiError to wrap
	 *
	 * @remarks
	 * This constructor attempts to parse the status code from the original error.
	 * If parsing fails, it defaults to status code 500 (Internal Server Error).
	 */
	constructor(error: SAE) {
		let status: number;

		try {
			status = Number(error.statusCode);
		} catch {
			status = 500;
		}

		super({ message: error.message, status });
	}
}

/**
 * A wrapper class for PostgreSQL errors that helps implement error tags introduced in 'effect'.
 * This class extends the TaggedError class from the 'effect' library to create tagged errors
 * specialized for Supabase Postgrest operations.
 *
 * @remarks
 * Provides a consistent way to handle database-related errors with additional context
 * like error codes that can be used for more specific error handling.
 */
export class PostgrestError extends Data.TaggedError('SupabasePostgrest')<{
	readonly message: string;
	readonly status: number;
	readonly code: string;
}> {
	/**
	 * Converts a native Supabase PostgrestError to a SupabasePostgrestError.
	 *
	 * @remarks
	 * Note: PostgrestError objects do not include HTTP status codes by design.
	 * To capture the full context, pass the status from the PostgrestResponse:
	 *
	 * @example
	 * ```ts
	 * const result = await supabase.from('table').select();
	 * if (result.error) {
	 *   throw mapPostgrestError(result.error, result.status);
	 * }
	 * ```
	 *
	 * @param error - The original Supabase PostgrestError to wrap
	 * @param status - The HTTP status code retrieved from the PostgrestResponse
	 * @returns A new SupabasePostgrestError instance with standardized error handling
	 */
	constructor(error: PE, status: number) {
		super({ message: error.message, code: error.code, status });
	}

	/**
	 * Maps the PostgrestError to a different error type based on error code.
	 *
	 * @param mappers - Record of functions that map from error codes to new error types
	 * @returns Either the mapped error (if a matching code is found) or this error
	 *
	 * @example
	 * ```ts
	 * pgError.when({
	 *   '23505': () => new DuplicateKeyError(),
	 *   '42P01': () => new TableNotFoundError()
	 * });
	 * ```
	 */
	when<E>(mappers: Record<string, () => E>): PostgrestError | E {
		const mapper = mappers[this.code];
		return mapper ? mapper() : this;
	}
}

/**
 * Error thrown when an operation requires an authenticated user session but none exists.
 *
 * @remarks
 * This error is commonly used in operations that require authentication, allowing
 * for specific handling of this condition in the application logic.
 */
export class NoSessionOrUserError extends Data.TaggedError('NoSessionOrUser') {}

// ------------------------------------------------------------
// Utility Functions
// ------------------------------------------------------------

/**
 * Maps a PostgrestSingleResponse to an Effect, handling errors automatically.
 *
 * @param res - The Postgrest response to map
 * @returns An Effect that succeeds with the data or fails with a PostgrestError
 *
 * @example
 * ```ts
 * const userEffect = mapPostgrestResponse(await supabase.from('users').select().single());
 * ```
 */
export function mapPostgrestResponse<T>(
	res: PostgrestSingleResponse<T>
): Effect.Effect<T, PostgrestError> {
	return res.error
		? Effect.fail(new PostgrestError(res.error, res.status))
		: Effect.succeed(res.data);
}

/**
 * Maps a PostgrestMaybeSingleResponse to an Effect with an Option result.
 *
 * @param res - The Postgrest response that may contain null data
 * @returns An Effect that succeeds with an Option containing the data (or None if null)
 *          or fails with a PostgrestError
 *
 * @example
 * ```ts
 * const userOption = mapPostgrestResponseOptional(
 *   await supabase.from('users').select().eq('id', userId).maybeSingle()
 * );
 * ```
 */
export function mapPostgrestResponseOptional<T>(
	res: PostgrestMaybeSingleResponse<T>
): Effect.Effect<Option.Option<T>, PostgrestError> {
	return res.error
		? Effect.fail(new PostgrestError(res.error, res.status))
		: Effect.succeed(Option.fromNullable(res.data));
}

/**
 * Maps a PostgrestSingleResponse to an Effect<void>, ignoring the data on success.
 *
 * @param res - The Postgrest response to map
 * @returns An Effect that succeeds with void or fails with a PostgrestError
 *
 * @example
 * ```ts
 * const deleteEffect = mapPostgrestResponseVoid(
 *   await supabase.from('users').delete().eq('id', userId)
 * );
 * ```
 */
export function mapPostgrestResponseVoid<T>(
	res: PostgrestSingleResponse<T>
): Effect.Effect<void, PostgrestError> {
	return res.error ? Effect.fail(new PostgrestError(res.error, res.status)) : Effect.void;
}

// ------------------------------------------------------------
// Union Types
// ------------------------------------------------------------

/**
 * Union type representing all possible Supabase-related errors.
 *
 * @remarks
 * This type simplifies error handling by providing a single type that encompasses
 * all potential errors that can occur during Supabase operations.
 */
export type Error = NoSessionOrUserError | PostgrestError | StorageError | AuthError;
