const systemProject: App.RootProject = {
	id: '0',
	name: 'System',
	goal: 'Wise Life',
	childProjectIds: [],
	priority: 0
};

const mainProject: App.RootProject = {
	id: '1',
	name: 'Alphaiv',
	goal: '학원 컨텐츠 관리 프로그램으로 사업하기',
	childProjectIds: [],
	priority: 1
};

const subProject: App.RootProject = {
	id: '2',
	name: 'Relationship',
	goal: 'Being a fullhearted man',
	childProjectIds: [],
	priority: 2
};

export async function getAllRootProjects(): Promise<App.RootProject[]> {
	return [systemProject, mainProject, subProject];
}
