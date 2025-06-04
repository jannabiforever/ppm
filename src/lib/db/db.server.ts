import Surreal, { RecordId, type Patch } from 'surrealdb';
import {
	VITE_SURREALDB_URL,
	VITE_SURREALDB_USER,
	VITE_SURREALDB_PASS,
	VITE_SURREALDB_NS,
	VITE_SURREALDB_DB
} from '$env/static/private';

export const CHILD_PROJECT_TABLE = 'childProject';
export const ROOT_PROJECT_TABLE = 'rootProject';

export async function getDb(): Promise<Surreal> {
	const db = new Surreal();
	await db.connect(VITE_SURREALDB_URL, {
		namespace: VITE_SURREALDB_NS,
		database: VITE_SURREALDB_DB,
		reconnect: {
			enabled: true,
			attempts: 2,
			retryDelay: 500
		}
	});
	await db.signin({ username: VITE_SURREALDB_USER, password: VITE_SURREALDB_PASS });

	return db;
}

export async function replaceData<T extends { [x: string]: unknown }, P extends Partial<T>>(
	surreal: Surreal,
	recordId: RecordId,
	payload: P
): Promise<T | null> {
	const patches: Patch[] = Object.entries(payload).map(([key, value]) => ({
		op: 'replace',
		path: `/${key}`,
		value
	}));
	const result = await surreal.patch<T>(recordId, patches);
	return result;
}

export async function addData<T extends { [x: string]: unknown }>(
	surreal: Surreal,
	recordId: RecordId,
	payload: Partial<T>
): Promise<T | null> {
	const patches: Patch[] = Object.entries(payload).map(([key, value]) => ({
		op: 'add',
		path: `/${key}`,
		value
	}));
	const result = await surreal.patch<T>(recordId, patches);
	return result;
}

export async function removeData<T extends { [x: string]: unknown }>(
	surreal: Surreal,
	recordId: RecordId,
	payload: Partial<T>
): Promise<T | null> {
	const patches: Patch[] = Object.keys(payload).map((key) => ({
		op: 'remove',
		path: `/${key}`
	}));
	const result = await surreal.patch<T>(recordId, patches);
	return result;
}
