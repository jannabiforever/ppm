import { Schema } from 'effect';

export const SignInSchema = Schema.Struct({
	email: Schema.String,
	password: Schema.String,
	remember: Schema.optional(Schema.Boolean)
});

export const SignUpSchema = Schema.Struct({
	email: Schema.String,
	password: Schema.String,
	confirmPassword: Schema.String
});
