import api from "./api";

export const reportAPI = {
  // Generate a project report
  generateReport: (projectId, data) => {
    console.log(`📡 POST /reports/project/${projectId}`);
    return api.post(`/reports/project/${projectId}`, data);
  },
  
  // Get a specific report
  getReport: (reportId) => {
    console.log(`📡 GET /reports/${reportId}`);
    return api.get(`/reports/${reportId}`);
  },
  
  // Get all reports for a project
  getProjectReports: (projectId, page = 1, perPage = 20) => {
    console.log(`📡 GET /reports/project/${projectId}`);
    return api.get(`/reports/project/${projectId}?page=${page}&per_page=${perPage}`);
  },
  
  // Delete a report
  deleteReport: (reportId) => {
    console.log(`📡 DELETE /reports/${reportId}`);
    return api.delete(`/reports/${reportId}`);
  },
  
  // Export a report - IMPORTANT: Set responseType to 'blob'
  exportReport: (reportId, format = 'pdf') => {
    console.log(`📡 GET /reports/${reportId}/export?format=${format}`);
    return api.get(`/reports/${reportId}/export?format=${format}`, {
      responseType: 'blob'  // This is critical for file downloads
    });
  },
  generateWeeklyReport: (projectId, data) => {
  console.log(`📡 POST /reports/weekly/project/${projectId}`);
  return api.post(`/reports/weekly/project/${projectId}`, data, {
    responseType: data.format === 'pdf' ? 'blob' : 'json'
  });
}

};
