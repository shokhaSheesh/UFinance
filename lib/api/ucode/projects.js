import { appStore } from "@/store/app.store";
import { authStore } from "@/store/auth.store";
import { apiClient } from "./base";

const PROJECT_ID = "3ed54a59-5eda-4cfe-b4ae-8a201c1ea4ed";

export const STATUS_RU = {
  planned: "Плановый",
  in_progress: "В работе",
  completed: "Завершен",
};
export const STATUS_KEY = {
  Плановый: "planned",
  "В работе": "in_progress",
  Завершен: "completed",
};
export const statusToKey = (ru) => STATUS_KEY[ru] || "planned";
export const statusToRu = (key) => STATUS_RU[key] || "Плановый";

export const STATUS_COLORS = {
  planned: "#2f6bff",
  in_progress: "#f59e0b",
  completed: "#10b981",
};

const getInvokeUrl = () =>
  appStore?.localApiUrl ||
  `${apiClient.baseURL}${apiClient.invokeFunctionEndpoint}?project-id=${PROJECT_ID}`;

async function projectsRequest(method, objectData = {}) {
  const url = getInvokeUrl();
  const body = {
    data: {
      auth: { data: {}, type: "apikey" },
      method,
      object_data: {
        ...objectData,
        ...(authStore?.branch_id ? { branch_id: authStore.branch_id } : {}),
      },
    },
  };

  const doFetch = (token) =>
    fetch(url, {
      method: "POST",
      headers: apiClient.buildHeaders(token),
      body: JSON.stringify(body),
    });

  let token = apiClient.getAuthToken();
  let response = await doFetch(token);

  if (response.status === 401) {
    try {
      token = await apiClient.refreshAccessToken();
      response = await doFetch(token);
    } catch {
      /* отдадим ошибку ниже */
    }
  }

  const text = await response.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = {};
  }

  const inner = json?.data ?? {};
  const isError =
    json?.status === "error" ||
    json?.status === "ERROR" ||
    inner?.success === false ||
    (!response.ok && !inner?.success);
  if (isError) {
    const message =
      inner?.message ||
      json?.description ||
      json?.data?.error ||
      "Ошибка запроса";
    throw new Error(message);
  }

  return inner;
}

export const listProjectGroups = ({ page = 1, limit = 100 } = {}) =>
  projectsRequest("list_project_groups", { page, limit });

export const getProjectGroup = (guid) =>
  projectsRequest("get_project_group", { guid });

export const createProjectGroup = ({ name, description }) =>
  projectsRequest("create_project_group", {
    name,
    description: description || undefined,
  });

export const updateProjectGroup = ({ guid, name, description }) =>
  projectsRequest("update_project_group", { guid, name, description });

export const deleteProjectGroup = (guid) =>
  projectsRequest("delete_project_group", { guid });

export const listProjects = (params = {}) =>
  projectsRequest("list_projects", params);

export const getProject = (guid) => projectsRequest("get_project", { guid });

export const createProject = ({ name, project_groups_id, description }) =>
  projectsRequest("create_project", {
    name,
    project_groups_id: project_groups_id || undefined,
    description: description || undefined,
  });

export const updateProject = ({ guid, name, project_groups_id, description }) =>
  projectsRequest("update_project", {
    guid,
    name,
    project_groups_id,
    description,
  });

export const deleteProject = (guid) =>
  projectsRequest("delete_project", { guid });

export const updateProjectStatus = ({ guid, status }) =>
  projectsRequest("update_project_status", {
    guid,
    status: status ? STATUS_RU[status] || status : undefined,
  });

export const normalizeProject = (p = {}) => ({
  id: p.guid,
  name: p.name,
  comment: p.description || "",
  groupId: p.project_groups_id || "",
  groupName: p.project_group_name || "",
  status: statusToKey(p.status),
  startDate: p.start_date || null,
  endDate: p.end_date || null,
  income: p.income ?? null,
  expenses: p.expense ?? null,
  profit: p.profit ?? null,
  profitability: p.profitability ?? null,
});

export const normalizeProjectsSummary = (s = {}, fallbackCount = 0) => ({
  count: s?.count ?? fallbackCount,
  income: s?.total_income ?? 0,
  expenses: s?.total_expense ?? 0,
  profit: s?.total_profit ?? 0,
  profitability: s?.total_profitability ?? null,
});
