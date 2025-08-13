import { AuthError, PostgrestError } from '@supabase/supabase-js';
import { Data } from 'effect';
import { StorageApiError } from '@supabase/storage-js';
import { StatusCodes } from 'http-status-codes';

/**
 * An auth error's wrapper class that helps implementing error tags introduced from 'effect'.
 * This class extends the TaggedError class from 'effect' library to create a tagged
 * error specific to Supabase authentication operations.
 */
export class SupabaseAuthError extends Data.TaggedError('SupabaseAuth')<{
	readonly message: string;
	readonly status: number;
}> {}

/**
 * Converts a native Supabase AuthError into a SupabaseAuthError.
 * This function is useful for standardizing error handling in an Effect-based application.
 *
 * @param error - The original Supabase AuthError to wrap
 * @returns A new SupabaseAuthError instance containing the original error
 */
export function mapAuthError(error: AuthError): SupabaseAuthError {
	return new SupabaseAuthError({
		message: error.message,
		status: error.status ?? StatusCodes.INTERNAL_SERVER_ERROR
	});
}

/**
 * A storage error's wrapper class that helps implementing error tags introduced from 'effect'.
 * This class extends the TaggedError class from 'effect' library to create a tagged
 * error specific to Supabase storage operations.
 */
export class SupabaseStorageError extends Data.TaggedError('SupabaseStorageApi')<{
	readonly message: string;
	readonly status: number;
}> {}

/**
 * Converts a native Supabase StorageError into a SupabaseStorageError.
 * This function is useful for standardizing error handling in an Effect-based application.
 *
 * @param error - The original Supabase StorageError to wrap
 * @returns A new SupabaseStorageError instance containing the original error
 */
export function mapStorageError(error: StorageApiError): SupabaseStorageError {
	let status: number;

	try {
		status = Number(error.statusCode);
	} catch {
		status = 500;
	}

	return new SupabaseStorageError({
		message: error.message,
		status
	});
}

/**
 * A PostgreSQL error's wrapper class that helps implementing error tags introduced from 'effect'.
 * This class extends the TaggedError class from 'effect' library to create a tagged
 * error specific to Supabase Postgrest operations.
 */
export class SupabasePostgrestError extends Data.TaggedError('SupabasePostgrest')<{
	readonly message: string;
	readonly status: number;
	readonly code: string;
}> {}

/**
 * Converts a native Supabase PostgrestError into a SupabasePostgrestError.
 *
 * Note: PostgrestError objects don't include HTTP status codes by design.
 * To capture the full context, pass the status from PostgrestResponse:
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
 * @param status - Optional HTTP status code from PostgrestResponse
 * @returns A new SupabasePostgrestError instance with standardized error handling
 */
export function mapPostgrestError(error: PostgrestError, status: number): SupabasePostgrestError {
	return new SupabasePostgrestError({ message: error.message, code: error.code, status });
}

/**
 * Union type for all Supabase errors
 */
export type SupabaseError = SupabaseAuthError | SupabaseStorageError | SupabasePostgrestError;

export class NoSessionOrUserError extends Data.TaggedError('NoSessionOrUser')<{
	readonly message: string;
}> {
	constructor() {
		super({ message: 'No session or user were found' });
	}
}
