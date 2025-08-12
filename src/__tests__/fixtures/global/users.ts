// Base test user for authentication
export const baseTestUser = {
	id: 'test_user_001',
	email: 'test@example.com',
	created_at: '2024-01-01T00:00:00Z',
	updated_at: '2024-01-01T00:00:00Z'
};

// Factory function to create test users with variations
export const createTestUser = (suffix: string, overrides: Partial<typeof baseTestUser> = {}) => ({
	...baseTestUser,
	id: `test_user_${suffix}`,
	email: `test_${suffix}@example.com`,
	...overrides
});

// Common test users for different scenarios
export const testUsers = {
	// Primary test user
	primary: baseTestUser,

	// Secondary user for multi-user tests
	secondary: createTestUser('002'),

	// User for concurrent operation tests
	concurrent: createTestUser('concurrent'),

	// Admin user for permission tests
	admin: createTestUser('admin', {
		email: 'admin@example.com'
	}),

	// Inactive user for edge case tests
	inactive: createTestUser('inactive', {
		email: 'inactive@example.com'
	})
};

// Authentication-related test data
export const authTestData = {
	validSession: {
		access_token: 'mock_access_token',
		refresh_token: 'mock_refresh_token',
		expires_in: 3600,
		expires_at: Math.floor(Date.now() / 1000) + 3600,
		token_type: 'bearer',
		user: baseTestUser
	},

	expiredSession: {
		access_token: 'expired_token',
		refresh_token: 'expired_refresh',
		expires_in: 0,
		expires_at: Math.floor(Date.now() / 1000) - 3600,
		token_type: 'bearer',
		user: baseTestUser
	}
};

// User-related error scenarios
export const userErrorScenarios = {
	userNotFound: null,
	invalidUser: {
		id: 'invalid_user',
		email: 'invalid@test.com'
	}
};
