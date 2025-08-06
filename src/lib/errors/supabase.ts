import { AuthError, PostgrestError } from '@supabase/supabase-js';
import { StorageError } from '@supabase/storage-js';
import { Data } from 'effect';

/**
 * An auth error's wrapper class that helps implementing error tags introduced from 'effect'.
 * This class extends the TaggedError class from 'effect' library to create a tagged
 * error specific to Supabase authentication operations.
 */
export class SupabaseAuthError extends Data.TaggedError('SupabaseAuth')<{
	readonly originalError: AuthError;
}> {}

/**
 * Converts a native Supabase AuthError into a SupabaseAuthError.
 * This function is useful for standardizing error handling in an Effect-based application.
 *
 * @param error - The original Supabase AuthError to wrap
 * @returns A new SupabaseAuthError instance containing the original error
 */
export function mapAuthError(error: AuthError): SupabaseAuthError {
	return new SupabaseAuthError({ originalError: error });
}

/**
 * A storage error's wrapper class that helps implementing error tags introduced from 'effect'.
 * This class extends the TaggedError class from 'effect' library to create a tagged
 * error specific to Supabase storage operations.
 */
export class SupabaseStorageError extends Data.TaggedError('SupabaseStorage')<{
	readonly originalError: StorageError;
}> {}

/**
 * Converts a native Supabase StorageError into a SupabaseStorageError.
 * This function is useful for standardizing error handling in an Effect-based application.
 *
 * @param error - The original Supabase StorageError to wrap
 * @returns A new SupabaseStorageError instance containing the original error
 */
export function mapStorageError(error: StorageError): SupabaseStorageError {
	return new SupabaseStorageError({ originalError: error });
}

/**
 * A PostgreSQL error's wrapper class that helps implementing error tags introduced from 'effect'.
 * This class extends the TaggedError class from 'effect' library to create a tagged
 * error specific to Supabase Postgrest operations.
 */
export class SupabasePostgrestError extends Data.TaggedError('SupabasePostgrest')<{
	readonly originalError: PostgrestError;
}> {}

/**
 * Converts a native Supabase PostgrestError into a SupabasePostgrestError.
 * This function is useful for standardizing error handling in an Effect-based application.
 *
 * @param error - The original Supabase PostgrestError to wrap
 * @returns A new SupabasePostgrestError instance containing the original error
 */
export function mapPostgrestError(error: PostgrestError): SupabasePostgrestError {
	return new SupabasePostgrestError({ originalError: error });
}
