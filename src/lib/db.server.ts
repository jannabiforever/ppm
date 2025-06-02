import Surreal from 'surrealdb';
import {
	VITE_SURREALDB_URL,
	VITE_SURREALDB_USER,
	VITE_SURREALDB_PASS,
	VITE_SURREALDB_NS,
	VITE_SURREALDB_DB
} from '$env/static/private';

export async function getDb(): Promise<Surreal> {
	try {
		const db = new Surreal();
		await db.connect(VITE_SURREALDB_URL);
		await db.signin({ username: VITE_SURREALDB_USER, password: VITE_SURREALDB_PASS });
		await db.use({ namespace: VITE_SURREALDB_NS, database: VITE_SURREALDB_DB });

		return db;
	} catch (error) {
		console.error('Failed to initialize database:', error);
		throw error;
	}
}
