import { Schema } from 'effect';

/**
 * Schema for user sign-in credentials.
 * Used for authenticating existing users with email and password.
 */
export const SignInSchema = Schema.Struct({
	email: Schema.String,
	password: Schema.String
});

/**
 * Schema for user sign-up data.
 * Used for creating new user accounts with email and password.
 * Includes password confirmation for validation.
 */
export const SignUpSchema = Schema.Struct({
	email: Schema.String,
	password: Schema.String,
	confirmPassword: Schema.String
});
