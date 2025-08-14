export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	graphql_public: {
		Tables: {
			[_ in never]: never;
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			graphql: {
				Args: {
					extensions?: Json;
					operationName?: string;
					query?: string;
					variables?: Json;
				};
				Returns: Json;
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
	public: {
		Tables: {
			focus_sessions: {
				Row: {
					closed_at: string | null;
					created_at: string;
					id: string;
					owner_id: string;
					project_id: string | null;
					scheduled_end_at: string;
					started_at: string;
					updated_at: string;
				};
				Insert: {
					closed_at?: string | null;
					created_at?: string;
					id?: string;
					owner_id?: string;
					project_id?: string | null;
					scheduled_end_at?: string;
					started_at: string;
					updated_at?: string;
				};
				Update: {
					closed_at?: string | null;
					created_at?: string;
					id?: string;
					owner_id?: string;
					project_id?: string | null;
					scheduled_end_at?: string;
					started_at?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'focus_sessions_project_id_fkey';
						columns: ['project_id'];
						isOneToOne: false;
						referencedRelation: 'projects';
						referencedColumns: ['id'];
					}
				];
			};
			projects: {
				Row: {
					active: boolean;
					created_at: string;
					description: string | null;
					id: string;
					name: string;
					owner_id: string;
					updated_at: string;
				};
				Insert: {
					active?: boolean;
					created_at?: string;
					description?: string | null;
					id?: string;
					name: string;
					owner_id?: string;
					updated_at?: string;
				};
				Update: {
					active?: boolean;
					created_at?: string;
					description?: string | null;
					id?: string;
					name?: string;
					owner_id?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			session_tasks: {
				Row: {
					added_at: string;
					session_id: string;
					task_id: string;
				};
				Insert: {
					added_at?: string;
					session_id: string;
					task_id: string;
				};
				Update: {
					added_at?: string;
					session_id?: string;
					task_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'session_tasks_session_id_fkey';
						columns: ['session_id'];
						isOneToOne: false;
						referencedRelation: 'focus_sessions';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'session_tasks_task_id_fkey';
						columns: ['task_id'];
						isOneToOne: false;
						referencedRelation: 'tasks';
						referencedColumns: ['id'];
					}
				];
			};
			tasks: {
				Row: {
					blocked_note: string | null;
					created_at: string;
					description: string | null;
					id: string;
					owner_id: string;
					planned_for: string | null;
					project_id: string | null;
					status: Database['public']['Enums']['task_status'];
					title: string;
					updated_at: string;
				};
				Insert: {
					blocked_note?: string | null;
					created_at?: string;
					description?: string | null;
					id?: string;
					owner_id?: string;
					planned_for?: string | null;
					project_id?: string | null;
					status?: Database['public']['Enums']['task_status'];
					title: string;
					updated_at?: string;
				};
				Update: {
					blocked_note?: string | null;
					created_at?: string;
					description?: string | null;
					id?: string;
					owner_id?: string;
					planned_for?: string | null;
					project_id?: string | null;
					status?: Database['public']['Enums']['task_status'];
					title?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'tasks_project_id_fkey';
						columns: ['project_id'];
						isOneToOne: false;
						referencedRelation: 'projects';
						referencedColumns: ['id'];
					}
				];
			};
			user_profiles: {
				Row: {
					id: string;
					name: string;
				};
				Insert: {
					id: string;
					name: string;
				};
				Update: {
					id?: string;
					name?: string;
				};
				Relationships: [];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			[_ in never]: never;
		};
		Enums: {
			task_status: 'backlog' | 'planned' | 'in_session' | 'blocked' | 'completed';
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema['Enums']
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
		: never = never
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
		? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema['CompositeTypes']
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
		: never = never
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
		? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	graphql_public: {
		Enums: {}
	},
	public: {
		Enums: {
			task_status: ['backlog', 'planned', 'in_session', 'blocked', 'completed']
		}
	}
} as const;
