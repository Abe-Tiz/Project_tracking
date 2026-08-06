// src/components/reports/ReportViewer.jsx
import React, { useState, useEffect } from 'react';
import { 
  FiX, FiDownload, FiPrinter, FiCalendar, FiUser, FiCheckCircle, 
  FiClock, FiAlertCircle, FiBarChart2, FiUsers, FiTag, 
  FiFileText, FiFile, FiFilePlus, FiDownloadCloud, FiList, FiGrid
} from 'react-icons/fi';
import { reportAPI } from '../../services/reportAPI';

export const ReportViewer = ({ reportId, onClose }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('');
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await reportAPI.getReport(reportId);
      setReport(response.data);
    } catch (error) {
      console.error('Failed to fetch report:', error);
      setError(error.response?.data?.error || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      setExporting(true);
      setExportFormat(format);
      setError('');
      setSuccess('');
      
      console.log(`📥 Exporting report as ${format.toUpperCase()}`);
      
      const response = await reportAPI.exportReport(reportId, format);
      
      let contentType = '';
      let fileExtension = format;
      
      switch(format) {
        case 'pdf':
          contentType = 'application/pdf';
          fileExtension = 'pdf';
          break;
        case 'csv':
          contentType = 'text/csv';
          fileExtension = 'csv';
          break;
        case 'excel':
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          fileExtension = 'xlsx';
          break;
        case 'json':
          contentType = 'application/json';
          fileExtension = 'json';
          break;
        default:
          contentType = 'application/octet-stream';
      }
      
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report?.project_name || 'project'}_report.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess(`Report exported as ${format.toUpperCase()} successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to export report:', error);
      setError('Failed to export report. Please try again.');
    } finally {
      setExporting(false);
      setExportFormat('');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#1B1B1E]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3E3AA0]"></div>
          <p className="mt-4 text-[#5B5A56] text-sm">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="fixed inset-0 bg-[#1B1B1E]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full">
          <div className="text-center">
            <FiAlertCircle size={48} className="text-[#B23A48] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#1B1B1E] mb-2">Error Loading Report</h3>
            <p className="text-[#8A8985] text-sm mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-[#3E3AA0] hover:bg-[#33308A] rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const data = report.data || {};
  const summary = data.executive_summary || {};
  const overview = data.project_overview || {};
  const tracking = data.tracking_sheet || [];
  const performance = data.performance_metrics || {};
  const team = data.team_analysis || {};
  const risks = data.risk_analysis || {};
  const recommendations = data.recommendations || {};
  const project = data.project_overview || {};
  const quality = data.quality_metrics || {};
  const financial = data.financial_analysis || {};

  const totalTasks = summary.total_tasks || 0;
  const completed = summary.completed || 0;
  const inProgress = summary.in_progress || 0;
  const review = summary.review || 0;
  const todo = summary.todo || 0;
  const completionRate = summary.completion_rate || 0;

  return (
    <div className="fixed inset-0 bg-[#1B1B1E]/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 p-4">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-2xl p-6 relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="pj-display text-2xl font-semibold text-[#1B1B1E] flex items-center gap-2">
              <FiFileText className="text-[#3E3AA0]" />
              Project Report - {report.project_name}
            </h2>
            <p className="text-sm text-[#8A8985] pj-body">
              Generated {new Date(report.generated_at).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-[#8A8985] hover:text-[#3E3AA0] hover:bg-[#EDEBFB] rounded-lg transition-colors"
              title="Print"
            >
              <FiPrinter size={18} />
            </button>
            
            {/* Export Buttons */}
            <div className="flex gap-1 border border-[#E7E5E0] rounded-lg p-1">
              <button
                onClick={() => handleExport('pdf')}
                disabled={exporting}
                className="px-3 py-1.5 text-xs font-medium text-white bg-[#B23A48] hover:bg-[#8A1F2A] rounded transition-colors flex items-center gap-1 disabled:opacity-50"
                title="Export as PDF"
              >
                <FiFileText size={14} />
                PDF
                {exporting && exportFormat === 'pdf' && (
                  <div className="ml-1 animate-spin rounded-full h-3 w-3 border-2 border-white"></div>
                )}
              </button>
              
              <button
                onClick={() => handleExport('excel')}
                disabled={exporting}
                className="px-3 py-1.5 text-xs font-medium text-white bg-[#12786B] hover:bg-[#0F5F54] rounded transition-colors flex items-center gap-1 disabled:opacity-50"
                title="Export as Excel"
              >
                <FiFilePlus size={14} />
                Excel
                {exporting && exportFormat === 'excel' && (
                  <div className="ml-1 animate-spin rounded-full h-3 w-3 border-2 border-white"></div>
                )}
              </button>
              
           
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-[#8A8985] hover:text-[#1B1B1E] hover:bg-[#F2F1ED] rounded-lg transition-colors"
            >
              <FiX size={22} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[#E7E5E0] mb-6">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'summary' 
                ? 'text-[#3E3AA0] border-b-2 border-[#3E3AA0]' 
                : 'text-[#8A8985] hover:text-[#5B5A56]'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'tracking' 
                ? 'text-[#3E3AA0] border-b-2 border-[#3E3AA0]' 
                : 'text-[#8A8985] hover:text-[#5B5A56]'
            }`}
          >
            Tracking Sheet
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'team' 
                ? 'text-[#3E3AA0] border-b-2 border-[#3E3AA0]' 
                : 'text-[#8A8985] hover:text-[#5B5A56]'
            }`}
          >
            Team
          </button>
          <button
            onClick={() => setActiveTab('risks')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'risks' 
                ? 'text-[#3E3AA0] border-b-2 border-[#3E3AA0]' 
                : 'text-[#8A8985] hover:text-[#5B5A56]'
            }`}
          >
            Risks
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'recommendations' 
                ? 'text-[#3E3AA0] border-b-2 border-[#3E3AA0]' 
                : 'text-[#8A8985] hover:text-[#5B5A56]'
            }`}
          >
            Recommendations
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-3 bg-[#E4F2EE] border border-[#B8D5CC] rounded-lg flex items-center gap-2">
            <FiCheckCircle className="text-[#12786B]" size={16} />
            <p className="text-sm text-[#12786B] pj-body">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-[#F7E6E8] border border-[#EAC3C8] rounded-lg flex items-center gap-2">
            <FiAlertCircle className="text-[#B23A48]" size={16} />
            <p className="text-sm text-[#B23A48] pj-body">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="space-y-6">
          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <>
              {/* Project Overview */}
              <div className="bg-gradient-to-r from-[#EDEBFB] to-[#E4F2EE] rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-[#1B1B1E]">{report.project_name}</h3>
                    <p className="text-sm text-[#5B5A56] mt-1">{overview.project_description || ''}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        overview.project_status === 'Active' ? 'bg-[#E4F2EE] text-[#12786B]' :
                        overview.project_status === 'Completed' ? 'bg-[#E4F2EE] text-[#12786B]' :
                        overview.project_status === 'On Hold' ? 'bg-[#FBECD9] text-[#C1741F]' :
                        'bg-[#F2F1ED] text-[#5B5A56]'
                      }`}>
                        {overview.project_status || 'Planning'}
                      </span>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        overview.project_priority === 'High' ? 'bg-[#F7E6E8] text-[#B23A48]' :
                        overview.project_priority === 'Medium' ? 'bg-[#FBECD9] text-[#C1741F]' :
                        'bg-[#E4F2EE] text-[#12786B]'
                      }`}>
                        {overview.project_priority || 'Medium'} Priority
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-[#3E3AA0]">{completionRate}%</p>
                    <p className="text-xs text-[#8A8985]">Completion Rate</p>
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full mt-1 ${
                      completionRate >= 80 ? 'bg-[#E4F2EE] text-[#12786B]' :
                      completionRate >= 50 ? 'bg-[#EDEBFB] text-[#3E3AA0]' :
                      completionRate >= 20 ? 'bg-[#FBECD9] text-[#C1741F]' :
                      'bg-[#F7E6E8] text-[#B23A48]'
                    }`}>
                      {summary.overall_status || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#F2F1ED] rounded-xl p-4">
                  <div className="flex items-center gap-2 text-[#8A8985] mb-1">
                    <FiCheckCircle size={16} />
                    <span className="text-xs">Completed</span>
                  </div>
                  <p className="text-2xl font-semibold text-[#12786B]">{completed}</p>
                  <p className="text-xs text-[#8A8985]">
                    {completionRate}% of total
                  </p>
                </div>
                <div className="bg-[#F2F1ED] rounded-xl p-4">
                  <div className="flex items-center gap-2 text-[#8A8985] mb-1">
                    <FiClock size={16} />
                    <span className="text-xs">In Progress</span>
                  </div>
                  <p className="text-2xl font-semibold text-[#3E3AA0]">{inProgress}</p>
                  <p className="text-xs text-[#8A8985]">Active tasks</p>
                </div>
                <div className="bg-[#F2F1ED] rounded-xl p-4">
                  <div className="flex items-center gap-2 text-[#8A8985] mb-1">
                    <FiAlertCircle size={16} />
                    <span className="text-xs">Review</span>
                  </div>
                  <p className="text-2xl font-semibold text-[#C1741F]">{review}</p>
                  <p className="text-xs text-[#8A8985]">Pending review</p>
                </div>
                <div className="bg-[#F2F1ED] rounded-xl p-4">
                  <div className="flex items-center gap-2 text-[#8A8985] mb-1">
                    <FiBarChart2 size={16} />
                    <span className="text-xs">Todo</span>
                  </div>
                  <p className="text-2xl font-semibold text-[#5B5A56]">{todo}</p>
                  <p className="text-xs text-[#8A8985]">Backlog</p>
                </div>
              </div>

              {/* Performance Metrics */}
              {performance.schedule_performance && (
                <div className="bg-[#FAF9F6] rounded-xl p-4">
                  <h5 className="font-medium text-[#1B1B1E] text-sm mb-3">Performance Metrics</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-[#8A8985]">SPI</p>
                      <p className="text-lg font-semibold text-[#3E3AA0]">
                        {performance.schedule_performance.schedule_performance_index || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8A8985]">Schedule Variance</p>
                      <p className="text-lg font-semibold text-[#3E3AA0]">
                        {performance.schedule_performance.schedule_variance || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8A8985]">Velocity</p>
                      <p className="text-lg font-semibold text-[#3E3AA0]">
                        {performance.productivity?.velocity || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8A8985]">Efficiency</p>
                      <p className="text-lg font-semibold text-[#3E3AA0]">
                        {performance.productivity?.efficiency || 0}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Metrics */}
              {financial && Object.keys(financial).length > 0 && (
                <div className="bg-[#FAF9F6] rounded-xl p-4">
                  <h5 className="font-medium text-[#1B1B1E] text-sm mb-3">Financial Metrics</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-[#8A8985]">Budget</p>
                      <p className="text-lg font-semibold text-[#3E3AA0]">${financial.budget || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8A8985]">Spent</p>
                      <p className="text-lg font-semibold text-[#B23A48]">${financial.spent || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8A8985]">ROI</p>
                      <p className="text-lg font-semibold text-[#12786B]">{financial.roi || 0}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8A8985]">Status</p>
                      <p className={`text-lg font-semibold ${
                        financial.status === 'On Budget' ? 'text-[#12786B]' :
                        financial.status === 'Over Budget' ? 'text-[#B23A48]' :
                        'text-[#C1741F]'
                      }`}>
                        {financial.status || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Tracking Sheet Tab */}
          {activeTab === 'tracking' && (
            <div className="bg-[#FAF9F6] rounded-xl p-4">
              <h5 className="font-medium text-[#1B1B1E] text-sm mb-3 flex items-center gap-2">
                <FiList size={16} className="text-[#3E3AA0]" />
                Tracking Sheet ({tracking.length} entries)
              </h5>
              {tracking.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[#8A8985] border-b border-[#E7E5E0]">
                        <th className="pb-2 font-medium">#</th>
                        <th className="pb-2 font-medium">Requesting Team</th>
                        <th className="pb-2 font-medium">Request Description</th>
                        <th className="pb-2 font-medium">Assigned To</th>
                        <th className="pb-2 font-medium">Request Date</th>
                        <th className="pb-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tracking.map((item, index) => (
                        <tr key={index} className="border-b border-[#EFEDE8] last:border-0">
                          <td className="py-2 text-[#8A8985]">{index + 1}</td>
                          <td className="py-2 font-medium text-[#1B1B1E]">{item.requesting_team}</td>
                          <td className="py-2 text-[#5B5A56]">{item.request_description}</td>
                          <td className="py-2 text-[#5B5A56]">{item.assigned_to}</td>
                          <td className="py-2 text-[#5B5A56]">{item.request_date?.split('T')[0] || ''}</td>
                          <td className="py-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              item.current_status === 'Done' || item.current_status === 'completed 100%' 
                                ? 'bg-[#E4F2EE] text-[#12786B]' 
                                : item.current_status === 'In Progress' || item.current_status === 'in progress'
                                ? 'bg-[#EDEBFB] text-[#3E3AA0]'
                                : item.current_status === 'Review' || item.current_status === 'review'
                                ? 'bg-[#FBECD9] text-[#C1741F]'
                                : 'bg-[#F2F1ED] text-[#8A8985]'
                            }`}>
                              {item.current_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-[#8A8985] text-sm py-8">No tracking entries available</p>
              )}
            </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="bg-[#FAF9F6] rounded-xl p-4">
              <h5 className="font-medium text-[#1B1B1E] text-sm mb-3 flex items-center gap-2">
                <FiUsers size={16} className="text-[#3E3AA0]" />
                Team Performance ({team.total_members || 0} members)
              </h5>
              {team.member_performance && team.member_performance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[#8A8985] border-b border-[#E7E5E0]">
                        <th className="pb-2 font-medium">Name</th>
                        <th className="pb-2 font-medium">Role</th>
                        <th className="pb-2 font-medium text-center">Tasks</th>
                        <th className="pb-2 font-medium text-center">Completed</th>
                        <th className="pb-2 font-medium text-center">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {team.member_performance.map((member, index) => (
                        <tr key={index} className="border-b border-[#EFEDE8] last:border-0">
                          <td className="py-2 font-medium text-[#1B1B1E]">{member.name}</td>
                          <td className="py-2 text-[#5B5A56]">{member.role}</td>
                          <td className="py-2 text-center">{member.total_tasks}</td>
                          <td className="py-2 text-center text-[#12786B]">{member.completed}</td>
                          <td className="py-2 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              member.completion_rate >= 80 ? 'bg-[#E4F2EE] text-[#12786B]' :
                              member.completion_rate >= 50 ? 'bg-[#EDEBFB] text-[#3E3AA0]' :
                              'bg-[#F7E6E8] text-[#B23A48]'
                            }`}>
                              {member.completion_rate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-[#8A8985] text-sm py-8">No team members found</p>
              )}
              
              {/* Workload Distribution */}
              {team.workload_distribution && Object.keys(team.workload_distribution).length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white rounded-lg border border-[#E7E5E0]">
                  <div>
                    <p className="text-xs text-[#8A8985]">Avg Tasks/Member</p>
                    <p className="text-lg font-semibold text-[#3E3AA0]">
                      {team.workload_distribution.avg_tasks_per_member || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#8A8985]">Balance Score</p>
                    <p className="text-lg font-semibold text-[#3E3AA0]">
                      {team.workload_distribution.balance_score || 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#8A8985]">Team Efficiency</p>
                    <p className="text-lg font-semibold text-[#12786B]">
                      {team.team_efficiency || 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#8A8985]">Active Members</p>
                    <p className="text-lg font-semibold text-[#3E3AA0]">
                      {team.active_members || 0} / {team.total_members || 0}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Risks Tab */}
          {activeTab === 'risks' && (
            <div className="bg-[#FAF9F6] rounded-xl p-4">
              <h5 className="font-medium text-[#1B1B1E] text-sm mb-3 flex items-center gap-2">
                <FiAlertCircle size={16} className="text-[#B23A48]" />
                Risk Analysis
              </h5>
              
              {/* Risk Summary */}
              {risks.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-3 border border-[#E7E5E0]">
                    <p className="text-xs text-[#8A8985]">Total Risks</p>
                    <p className="text-xl font-semibold text-[#1B1B1E]">{risks.summary.total_risks || 0}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-[#E7E5E0]">
                    <p className="text-xs text-[#8A8985]">High Risks</p>
                    <p className="text-xl font-semibold text-[#B23A48]">{risks.summary.high_risks || 0}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-[#E7E5E0]">
                    <p className="text-xs text-[#8A8985]">Medium Risks</p>
                    <p className="text-xl font-semibold text-[#C1741F]">{risks.summary.medium_risks || 0}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-[#E7E5E0]">
                    <p className="text-xs text-[#8A8985]">Risk Level</p>
                    <p className={`text-xl font-semibold ${
                      risks.summary.risk_level === 'High' ? 'text-[#B23A48]' :
                      risks.summary.risk_level === 'Medium' ? 'text-[#C1741F]' :
                      'text-[#12786B]'
                    }`}>
                      {risks.summary.risk_level || 'Low'}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Risk List */}
              {risks.high && risks.high.length > 0 && (
                <div className="mb-3">
                  <h6 className="text-sm font-medium text-[#B23A48] mb-2">High Risks</h6>
                  {risks.high.map((risk, index) => (
                    <div key={index} className="p-3 bg-white rounded-lg border border-[#EAC3C8] mb-2">
                      <p className="font-medium text-sm">{risk.category}</p>
                      <p className="text-xs text-[#8A8985]">{risk.description}</p>
                      <p className="text-xs text-[#5B5A56] mt-1">💡 {risk.mitigation}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {risks.medium && risks.medium.length > 0 && (
                <div className="mb-3">
                  <h6 className="text-sm font-medium text-[#C1741F] mb-2">Medium Risks</h6>
                  {risks.medium.map((risk, index) => (
                    <div key={index} className="p-3 bg-white rounded-lg border border-[#FBECD9] mb-2">
                      <p className="font-medium text-sm">{risk.category}</p>
                      <p className="text-xs text-[#8A8985]">{risk.description}</p>
                      <p className="text-xs text-[#5B5A56] mt-1">💡 {risk.mitigation}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {!risks.high?.length && !risks.medium?.length && !risks.low?.length && (
                <p className="text-center text-[#8A8985] text-sm py-8">No risks identified</p>
              )}
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div className="bg-[#FAF9F6] rounded-xl p-4">
              <h5 className="font-medium text-[#1B1B1E] text-sm mb-3 flex items-center gap-2">
                <FiCheckCircle size={16} className="text-[#3E3AA0]" />
                Recommendations
              </h5>
              
              {recommendations.summary && (
                <div className="p-3 bg-[#EDEBFB] rounded-lg border border-[#D5D2F5] mb-4">
                  <p className="text-sm text-[#3E3AA0]">{recommendations.summary}</p>
                </div>
              )}
              
              {/* High Priority */}
              {recommendations.high_priority && recommendations.high_priority.length > 0 && (
                <div className="mb-4">
                  <h6 className="text-sm font-medium text-[#B23A48] mb-2">High Priority</h6>
                  {recommendations.high_priority.map((rec, index) => (
                    <div key={index} className="p-3 bg-white rounded-lg border border-[#EAC3C8] mb-2">
                      <p className="font-medium text-sm">{rec.area}</p>
                      <p className="text-xs text-[#8A8985]">{rec.recommendation}</p>
                      <div className="mt-2">
                        {rec.action_items && rec.action_items.map((item, idx) => (
                          <p key={idx} className="text-xs text-[#5B5A56]">• {item}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Medium Priority */}
              {recommendations.medium_priority && recommendations.medium_priority.length > 0 && (
                <div className="mb-4">
                  <h6 className="text-sm font-medium text-[#C1741F] mb-2">Medium Priority</h6>
                  {recommendations.medium_priority.map((rec, index) => (
                    <div key={index} className="p-3 bg-white rounded-lg border border-[#FBECD9] mb-2">
                      <p className="font-medium text-sm">{rec.area}</p>
                      <p className="text-xs text-[#8A8985]">{rec.recommendation}</p>
                      <div className="mt-2">
                        {rec.action_items && rec.action_items.map((item, idx) => (
                          <p key={idx} className="text-xs text-[#5B5A56]">• {item}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Low Priority */}
              {recommendations.low_priority && recommendations.low_priority.length > 0 && (
                <div className="mb-4">
                  <h6 className="text-sm font-medium text-[#12786B] mb-2">Low Priority</h6>
                  {recommendations.low_priority.map((rec, index) => (
                    <div key={index} className="p-3 bg-white rounded-lg border border-[#E4F2EE] mb-2">
                      <p className="font-medium text-sm">{rec.area}</p>
                      <p className="text-xs text-[#8A8985]">{rec.recommendation}</p>
                      <div className="mt-2">
                        {rec.action_items && rec.action_items.map((item, idx) => (
                          <p key={idx} className="text-xs text-[#5B5A56]">• {item}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {!recommendations.high_priority?.length && !recommendations.medium_priority?.length && !recommendations.low_priority?.length && (
                <p className="text-center text-[#8A8985] text-sm py-8">No recommendations available</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#EFEDE8] flex justify-between items-center">
          <p className="text-xs text-[#8A8985]">
            Report ID: {report._id} • Generated by {report.generated_by_name}
          </p>
          <p className="text-xs text-[#8A8985]">
            {new Date(report.generated_at).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};