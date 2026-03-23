window.components = window.components || {};

const API_BASE_URL = window.location.protocol.startsWith("http")
  ? `${window.location.origin}/api`
  : "http://localhost:3000/api";

window.dataStore = {
  apiUrl: API_BASE_URL,

  async load() {
    try {
      const [
        inventory,
        procurements,
        deliveries,
        employees,
        salaries,
        auditLogs,
      ] = await Promise.all([
        fetch(`${this.apiUrl}/inventory`).then((r) => r.json()),
        fetch(`${this.apiUrl}/procurements`).then((r) => r.json()),
        fetch(`${this.apiUrl}/deliveries`).then((r) => r.json()),
        fetch(`${this.apiUrl}/employees`).then((r) => r.json()),
        fetch(`${this.apiUrl}/salaries`).then((r) => r.json()),
        fetch(`${this.apiUrl}/audit-logs`).then((r) => r.json()),
      ]);

      return {
        inventory,
        procurements,
        deliveries,
        employees,
        salaries,
        auditLogs,
      };
    } catch (error) {
      console.error("Failed to load data from backend:", error);
      return {
        inventory: [],
        procurements: [],
        deliveries: [],
        employees: [],
        salaries: [],
        auditLogs: [],
      };
    }
  },

  // In the new system, "save" is replaced by specific create/update operations
  // but we keep this stub if any old code still tries to call it
  save(data) {
    console.warn("dataStore.save() is deprecated. Use background API calls.");
  },

  // --- Helper CRUD methods for components to use ---

  async createItem(endpoint, data) {
    const response = await fetch(`${this.apiUrl}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async updateItem(endpoint, id, data) {
    const response = await fetch(`${this.apiUrl}/${endpoint}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async deleteItem(endpoint, id) {
    const response = await fetch(`${this.apiUrl}/${endpoint}/${id}`, {
      method: "DELETE",
    });
    return response.json();
  },
};
