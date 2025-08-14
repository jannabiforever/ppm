import { Schema } from 'effect';

// Re-export Schema from effect
export { Schema };

// Export datetime schemas
export {
	DateTimeUtcSchema,
	OptionalDateTimeUtcSchema,
	DateSchema,
	OptionalDateSchema,
	type DateTimeUtc,
	type OptionalDateTimeUtc,
	type DateOnly,
	type OptionalDateOnly
} from './datetime';

// Basic login credentials schema
export const LoginCredentials = Schema.Struct({
	email: Schema.String,
	password: Schema.String
});

// Basic register credentials schema
export const RegisterCredentials = Schema.Struct({
	email: Schema.String,
	password: Schema.String
});

// Type exports
export type LoginCredentialsType = typeof LoginCredentials.Type;
export type RegisterCredentialsType = typeof RegisterCredentials.Type;
