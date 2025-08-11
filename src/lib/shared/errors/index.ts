export * from './supabase';
export * from './domain';

/**
 * A helper function to map error objects to a standardized format, to avoid pojo error.
 *
 * @param error any error definitions with Data.TaggedError
 * @returns
 */
export const toObj = (error: { _tag: string; message: string }) => {
	return {
		_tag: error._tag,
		message: error.message
	};
};
