import Surreal from 'surrealdb';
import {
	// @ts-expect-error env variable detection
	VITE_SURREALDB_URL,
	// @ts-expect-error env variable detection
	VITE_SURREALDB_USER,
	// @ts-expect-error env variable detection
	VITE_SURREALDB_PASS,
	// @ts-expect-error env variable detection
	VITE_SURREALDB_NS,
	// @ts-expect-error env variable detection
	VITE_SURREALDB_DB
} from '$env/static/private';

// let isInitialized = false;
let db: Surreal;

async function initializeDb() {
	try {
		db = new Surreal();
		await db.connect(VITE_SURREALDB_URL);
		await db.signin({ username: VITE_SURREALDB_USER, password: VITE_SURREALDB_PASS });
		await db.use({ namespace: VITE_SURREALDB_NS, database: VITE_SURREALDB_DB });
	} catch (error) {
		console.error('Failed to initialize database:', error);
		throw error;
	}
}

export async function getDb(): Promise<Surreal> {
	await initializeDb();
	return db;
}
