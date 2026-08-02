/**
 * Global API Configuration
 * Centralized configuration for all API endpoints
 */

export const apiConfig = {
  // U-code API Configuration
  ucode: {
    baseURL: "https://api.admin.u-code.io",
    authBaseURL: "https://api.auth.u-code.io",
    projectId: "3ed54a59-5eda-4cfe-b4ae-8a201c1ea4ed",
    // appId: '3ed54a59-5eda-4cfe-b4ae-8a201c1ea4ed', // Same as projectId
    "environment-id": process.env.NEXT_PUBLIC_ENVIRONMENT_ID,
    environmentId: process.env.NEXT_PUBLIC_ENVIRONMENT_ID, // Alias for easier access
    clientTypeId: "2d3beced-ea36-41ab-9e24-e7ad372300fe",
    roleId: "653c399c-ed2b-4f16-bfe8-612d2e29e87d",
    authToken:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRfaWQiOiIiLCJjbGllbnRfcGxhdGZvcm1faWQiOiIiLCJjbGllbnRfdHlwZV9pZCI6IjJkM2JlY2VkLWVhMzYtNDFhYi05ZTI0LWU3YWQzNzIzMDBmZSIsImRhdGEiOiJQb3N0bWFuUnVudGltZS83LjUxLjEiLCJleHAiOjE3NzA4NzE1NTMsImlhdCI6MTc3MDc4NTE1MywiaWQiOiIwY2FjZGY5NS0yMWI3LTQyZTctYWQ5NS03NTczODU2MzRmZTAiLCJpcCI6IjEwLjEwLjAuMy8zMiIsImxvZ2luX3RhYmxlX3NsdWciOiJwbGFuX2Zha3RfYWRtaW5zIiwicHJvamVjdF9pZCI6IjNlZDU0YTU5LTVlZGEtNGNmZS1iNGFlLThhMjAxYzFlYTRlZCIsInJvbGVfaWQiOiI2NTNjMzk5Yy1lZDJiLTRmMTYtYmZlOC02MTJkMmUyOWU4N2QiLCJ0YWJsZXMiOltdLCJ1c2VyX2lkIjoiOTQ0NDlhZWMtMDk3NS00MDViLTkwNTUtOWIxMmRhODNkYWNjIiwidXNlcl9pZF9hdXRoIjoiM2YzOGE3N2MtODI2OS00NTA4LTg5YzQtZjUzZDlmOGYzNDc3In0.yWUIZedAw5c8PMKBQwVUPyP-5BPp2FAZpzwF0DOuS8s",

    // Default menu and view IDs for chart of accounts
    chartOfAccounts: {
      menuId: "bf6ca200-c8ba-4cd4-8075-64812dc6f734",
      viewId: "f9a81b00-0d00-4800-8a94-57d232accf4a",
    },

    // Default menu and view IDs for bank accounts
    bankAccounts: {
      menuId: "69473d23-62fd-4450-bfbd-8915ebba9878",
      viewId: "72e2730b-c0e6-480d-92af-e13b6a6dea73",
      tableSlug: "bank_accounts",
    },

    // Default menu and view IDs for counterparties
    counterparties: {
      menuId: "13791961-1778-4dfa-aeb4-3cf55f1767a8",
      viewId: "1625ed84-caeb-4064-b68a-d07e542a1349",
      tableSlug: "counterparties",
    },

    // Default menu and view IDs for operations
    operations: {
      menuId: "d9cf223e-73cd-41e3-be68-91836696d51b",
      viewId: "72ead1b5-4233-4572-9755-c667622ce5a6",
      tableSlug: "operations",
    },
  },

  // API Keys (if needed for other services)
  apiKeys: {
    // Add other API keys here if needed
  },
};

/**
 * Get project ID
 */
export const getProjectId = () => apiConfig.ucode.projectId;

/**
 * Get U-code base URL
 */
export const getUcodeBaseURL = () => apiConfig.ucode.baseURL;

/**
 * Get auth token
 */
export const getAuthToken = () => apiConfig.ucode.authToken;

/**
 * Get environment ID
 */
export const getEnvironmentId = () => apiConfig.ucode["environment-id"];

/**
 * Get auth base URL
 */
export const getAuthBaseURL = () => apiConfig.ucode.authBaseURL;
