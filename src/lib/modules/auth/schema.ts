import { Schema } from 'effect';

/**
 * Sign in form schema
 */
export const SignInSchema = Schema.Struct({
	email: Schema.String,
	password: Schema.String,
	remember: Schema.optional(Schema.Boolean)
});

/**
 * Sign up form schema
 */
export const SignUpSchema = Schema.Struct({
	email: Schema.String,
	password: Schema.String,
	confirmPassword: Schema.String
});

// Type exports
export type SignInInput = typeof SignInSchema.Type;
export type SignUpInput = typeof SignUpSchema.Type;
