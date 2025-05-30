const projects: App.RootProject[] = [
	{
		id: '0',
		name: 'System',
		goal: 'Wise Life',
		childProjectIds: [],
		priority: 'high'
	},
	{
		id: '1',
		name: 'Alphaiv',
		goal: '학원 컨텐츠 관리 프로그램으로 사업하기',
		childProjectIds: [],
		priority: 'high'
	},
	{
		id: '2',
		name: 'Relationship',
		goal: 'Being a fullhearted man',
		childProjectIds: [],
		priority: 'medium'
	}
];

export async function getAllRootProjects(): Promise<App.RootProject[]> {
	return [...projects];
}

export async function addRootProject(project: Omit<App.RootProject, 'id' | 'childProjectIds'>): Promise<App.RootProject> {
	// 새 ID 생성 (실제 앱에서는 더 안전한 방식 사용)
	const id = `${Date.now()}`;

	// 새 프로젝트 생성
	const newProject: App.RootProject = {
		id,
		name: project.name,
		goal: project.goal,
		childProjectIds: [],
		priority: project.priority
	};

	// 프로젝트 배열에 추가
	projects.push(newProject);

	// 정렬 (high > medium > low 순서로)
	projects.sort((a, b) => {
		const priorityOrder = { high: 0, medium: 1, low: 2 };
		return priorityOrder[a.priority] - priorityOrder[b.priority];
	});

	return newProject;
}
