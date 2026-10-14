import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject session token / user ID
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('stitch_token');
  const userId = localStorage.getItem('stitch_user_id') || 'usr-1';

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['x-user-id'] = userId;

  return config;
});

export const authApi = {
  login: (credentials: { username: string; password?: string }) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  switchRole: (role: 'admin' | 'editor' | 'viewer') => api.post('/auth/switch', { role }),
  getUsers: () => api.get('/auth/users'),
};

export const productsApi = {
  getAll: (params?: any) => api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  getByBarcode: (barcode: string) => api.get(`/products/lookup/barcode/${barcode}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  archive: (id: string) => api.post(`/products/${id}/archive`),
  bulk: (action: string, ids: string[], data?: any) => api.post('/products/bulk', { action, ids, data }),
};

export const categoriesApi = {
  getAll: () => api.get('/categories'),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

export const attributesApi = {
  getAll: () => api.get('/attributes'),
  create: (data: any) => api.post('/attributes', data),
  addTerm: (attrId: string, data: any) => api.post(`/attributes/${attrId}/terms`, data),
};

export const wooApi = {
  getConfig: () => api.get('/woocommerce/config'),
  updateConfig: (data: any) => api.post('/woocommerce/config', data),
  testConnection: () => api.post('/woocommerce/test-connection'),
  syncProduct: (id: string) => api.post(`/woocommerce/sync/product/${id}`),
  syncAll: () => api.post('/woocommerce/sync/all'),
  importFromStore: () => api.post('/woocommerce/import'),
  getLogs: () => api.get('/woocommerce/logs'),
  retryLog: (logId: string) => api.post(`/woocommerce/logs/${logId}/retry`),
};

export const excelApi = {
  getTemplateUrl: () => `${import.meta.env.VITE_API_BASE_URL || '/api'}/excel/template`,
  validate: (rows: any[]) => api.post('/excel/validate', { rows }),
  importValidated: (items: any[]) => api.post('/excel/import', { items }),
  getExportUrl: (format: 'xlsx' | 'csv' = 'xlsx') => `${import.meta.env.VITE_API_BASE_URL || '/api'}/excel/export?format=${format}`,
};

export const reportsApi = {
  getOverview: () => api.get('/reports/overview'),
  getCategoriesDistribution: () => api.get('/reports/categories-distribution'),
  getActivityLogs: () => api.get('/reports/activity'),
  getDatabaseStatus: () => api.get('/reports/database-status'),
};

export default api;
