// src/components/reports/ReportGenerator.jsx
import React, { useState } from 'react';
import { FiX, FiFileText, FiCalendar, FiDownload, FiPrinter } from 'react-icons/fi';
import { reportAPI } from '../../services/reportAPI';

export const ReportGenerator = ({ projectId, projectName, onClose, onReportGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportType, setReportType] = useState('comprehensive');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [format, setFormat] = useState('pdf');

  const reportTypes = [
    { value: 'comprehensive', label: 'Comprehensive Report' },
    { value: 'summary', label: 'Executive Summary' },
    { value: 'tracking', label: 'Tracking Sheet' },
    { value: 'team', label: 'Team Report' },
    { value: 'risks', label: 'Risk Analysis' }
  ];

  const formats = [
    { value: 'pdf', label: 'PDF' },
    { value: 'excel', label: 'Excel' },
   
  ];

  const handleGenerate = async (e) => {
    e.preventDefault();
    
    if (!reportType) {
      setError('Please select a report type');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const data = {
        report_type: reportType,
        format: format,
        date_range: dateRange,
        generated_by_name: user.name || 'Unknown',
        company: user.company || '',
        department: user.department || ''
      };

      if (dateRange.start && dateRange.end) {
        data.date_range = dateRange;
      }

      const response = await reportAPI.generateReport(projectId, data);
      
      if (response.data.report) {
        onReportGenerated(response.data.report);
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to generate report:', error);
      setError(error.response?.data?.error || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1B1B1E]/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8A8985] hover:text-[#1B1B1E] transition-colors z-10"
        >
          <FiX size={22} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-[#EDEBFB] rounded-xl">
            <FiFileText size={24} className="text-[#3E3AA0]" />
          </div>
          <div>
            <h3 className="pj-display text-xl font-semibold text-[#1B1B1E]">
              Generate Report
            </h3>
            <p className="text-sm text-[#8A8985] pj-body">
              Create a comprehensive report for {projectName}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#F7E6E8] border border-[#EAC3C8] rounded-lg">
            <p className="text-sm text-[#B23A48] pj-body">{error}</p>
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-[#5B5A56] pj-body mb-2">
              Report Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {reportTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setReportType(type.value)}
                  className={`p-3 rounded-xl border-2 transition-all text-sm ${
                    reportType === type.value
                      ? 'border-[#3E3AA0] bg-[#EDEBFB] text-[#3E3AA0]'
                      : 'border-[#E7E5E0] hover:border-[#3E3AA0]/30 text-[#5B5A56]'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-[#5B5A56] pj-body mb-2">
              Date Range (Optional)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#8A8985] mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full rounded-xl border border-[#E7E5E0] px-3 py-2 focus:border-[#3E3AA0] focus:ring-2 focus:ring-[#3E3AA0]/20 outline-none pj-body text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#8A8985] mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full rounded-xl border border-[#E7E5E0] px-3 py-2 focus:border-[#3E3AA0] focus:ring-2 focus:ring-[#3E3AA0]/20 outline-none pj-body text-sm"
                />
              </div>
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-[#5B5A56] pj-body mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-4 gap-2">
              {formats.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFormat(f.value)}
                  className={`p-2 rounded-xl border-2 transition-all text-sm ${
                    format === f.value
                      ? 'border-[#3E3AA0] bg-[#EDEBFB] text-[#3E3AA0]'
                      : 'border-[#E7E5E0] hover:border-[#3E3AA0]/30 text-[#5B5A56]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#EFEDE8]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-[#5B5A56] bg-[#F2F1ED] hover:bg-[#E7E5E0] rounded-xl transition-colors pj-body"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm font-medium text-white bg-[#3E3AA0] hover:bg-[#33308A] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 pj-body"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <FiFileText size={16} />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};