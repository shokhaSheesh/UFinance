import {
  createProject,
  createProjectGroup,
  deleteProject,
  getProject,
  listProjectGroups,
  listProjects,
  normalizeProject,
  normalizeProjectsSummary,
  updateProject,
  updateProjectStatus,
} from "@/lib/api/ucode/projects";
import { showErrorNotification } from "@/lib/utils/notifications";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

const LIMIT = 20;

/**
 * Бесконечный список проектов с фильтрами (list_projects).
 * @param {object} filters — уже собранные параметры API (status, search, project_ids, даты)
 */
export function useProjectsList(filters = {}) {
  const query = useInfiniteQuery({
    queryKey: ["list_projects", filters],
    queryFn: ({ pageParam = 1 }) =>
      listProjects({ ...filters, page: pageParam, limit: LIMIT }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const p = lastPage?.pagination;
      if (!p) return undefined;
      return p.page < p.totalPages ? p.page + 1 : undefined;
    },
    staleTime: 0,
  });

  const projects = (query.data?.pages || [])
    .flatMap((pg) => pg?.data || [])
    .map(normalizeProject);

  const total = query.data?.pages?.[0]?.pagination?.total ?? projects.length;
  // сводка одна на всю выборку — берём с первой страницы
  const summary = normalizeProjectsSummary(
    query.data?.pages?.[0]?.summary,
    total
  );

  return { ...query, projects, total, summary };
}

/**
 * Группы проектов (для селекта в модалке и как справочник).
 */
export function useProjectGroups() {
  const query = useQuery({
    queryKey: ["list_project_groups"],
    queryFn: () => listProjectGroups({ page: 1, limit: 100 }),
    staleTime: 1000 * 60 * 5,
  });
  const groups = (query.data?.data || []).map((g) => ({
    value: g.guid,
    label: g.name,
  }));
  return { ...query, groups };
}

/**
 * Все проекты (без фильтров) — опции для мультиселекта «Проекты» в фильтрах.
 */
export function useProjectOptions() {
  const query = useQuery({
    queryKey: ["project_options"],
    queryFn: () => listProjects({ page: 1, limit: 200 }),
    staleTime: 1000 * 60 * 5,
  });
  const options = (query.data?.data || []).map((p) => ({
    value: p.guid,
    label: p.name,
  }));
  return { ...query, options };
}

export function useProject(guid) {
  const query = useQuery({
    queryKey: ["get_project", guid],
    queryFn: () => getProject(guid),
    enabled: !!guid,
    staleTime: 0,
  });
  return {
    ...query,
    project: query.data?.data ? normalizeProject(query.data.data) : null,
  };
}

// ─── Мутации ────────────────────────────────────────────────────────────────
function useProjectsInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["list_projects"] });
    queryClient.invalidateQueries({ queryKey: ["project_options"] });
  };
}

export function useCreateProject() {
  const invalidate = useProjectsInvalidate();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => invalidate(),
    onError: (e) => showErrorNotification(e?.message),
  });
}

export function useUpdateProject() {
  const invalidate = useProjectsInvalidate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProject,
    onSuccess: (_d, vars) => {
      invalidate();
      if (vars?.guid)
        queryClient.invalidateQueries({ queryKey: ["get_project", vars.guid] });
    },
    onError: (e) => showErrorNotification(e?.message),
  });
}

export function useDeleteProject() {
  const invalidate = useProjectsInvalidate();
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => invalidate(),
    onError: (e) => showErrorNotification(e?.message),
  });
}

export function useUpdateProjectStatus() {
  const invalidate = useProjectsInvalidate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProjectStatus,
    onSuccess: (_d, vars) => {
      invalidate();
      if (vars?.guid)
        queryClient.invalidateQueries({ queryKey: ["get_project", vars.guid] });
    },
    onError: (e) => showErrorNotification(e?.message),
  });
}

export function useCreateProjectGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProjectGroup,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["list_project_groups"] }),
    onError: (e) => showErrorNotification(e?.message),
  });
}
