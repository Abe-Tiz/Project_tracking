// src/components/reports/WeeklyReportGenerator.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiFileText, FiCalendar, FiClock, FiUser, FiUsers, FiAlertCircle } from 'react-icons/fi';
import { reportAPI } from '../../services/reportAPI';

export const WeeklyReportGenerator = ({ projectId, projectName, onClose, onReportGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preparedBy, setPreparedBy] = useState('');
  const [format, setFormat] = useState('pdf');
  const [reportType, setReportType] = useState('weekly');

  const reportTypes = [
    { value: 'weekly', label: 'Weekly Status' },
    { value: 'monthly', label: 'Monthly Summary' },
    { value: 'executive', label: 'Executive Summary' }
  ];

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.name) {
      setPreparedBy(user.name);
    }
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const data = {
        prepared_by: preparedBy || user.name || 'Project Team',
        format: format,
        report_type: reportType,
        generated_by_name: user.name || 'Unknown'
      };

      const response = await reportAPI.generateWeeklyReport(projectId, data);
      
      // If PDF, download directly
      if (format === 'pdf') {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `weekly_status_report_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        onClose();
        return;
      }
      
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
          <div className="p-3 bg-[#1B4F72] rounded-xl">
            <FiFileText size={24} className="text-white" />
          </div>
          <div>
            <h3 className="pj-display text-xl font-semibold text-[#1B1B1E]">
              Weekly Status Report
            </h3>
            <p className="text-sm text-[#8A8985] pj-body">
              Generate a professional weekly status report for {projectName}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#F7E6E8] border border-[#EAC3C8] rounded-lg flex items-start gap-2">
            <FiAlertCircle className="text-[#B23A48] mt-0.5" />
            <p className="text-sm text-[#B23A48] pj-body">{error}</p>
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-[#5B5A56] pj-body mb-2">
              Report Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {reportTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setReportType(type.value)}
                  className={`p-3 rounded-xl border-2 transition-all text-sm ${
                    reportType === type.value
                      ? 'border-[#1B4F72] bg-[#D6EAF8] text-[#1B4F72]'
                      : 'border-[#E7E5E0] hover:border-[#1B4F72]/30 text-[#5B5A56]'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prepared By */}
          <div>
            <label className="block text-sm font-medium text-[#5B5A56] pj-body mb-2">
              Prepared By
            </label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8A8985]" />
              <input
                type="text"
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
                placeholder="Enter your name"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#E7E5E0] focus:border-[#1B4F72] focus:ring-2 focus:ring-[#1B4F72]/20 outline-none pj-body text-sm"
              />
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-[#5B5A56] pj-body mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={`p-3 rounded-xl border-2 transition-all text-sm ${
                  format === 'pdf'
                    ? 'border-[#1B4F72] bg-[#D6EAF8] text-[#1B4F72]'
                    : 'border-[#E7E5E0] hover:border-[#1B4F72]/30 text-[#5B5A56]'
                }`}
              >
                <FiFileText className="mx-auto mb-1" size={20} />
                PDF
              </button>
              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`p-3 rounded-xl border-2 transition-all text-sm ${
                  format === 'json'
                    ? 'border-[#1B4F72] bg-[#D6EAF8] text-[#1B4F72]'
                    : 'border-[#E7E5E0] hover:border-[#1B4F72]/30 text-[#5B5A56]'
                }`}
              >
                <FiFileText className="mx-auto mb-1" size={20} />
                JSON
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-[#FAF9F6] rounded-xl p-4 border border-[#E7E5E0]">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#D6EAF8] rounded-lg">
                <FiCalendar className="text-[#1B4F72]" size={18} />
              </div>
              <div>
                <p className="text-sm font-medium text-[#1B1B1E]">What's Included</p>
                <ul className="text-xs text-[#8A8985] space-y-1 mt-1">
                  <li>• Executive Summary with key metrics</li>
                  <li>• Dynamic Action Log from recent tasks</li>
                  <li>• Risks & Dependencies analysis</li>
                  <li>• Next Steps & Action Items</li>
                  <li>• Team Performance metrics</li>
                </ul>
              </div>
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
              className="px-6 py-2.5 text-sm font-medium text-white bg-[#1B4F72] hover:bg-[#1A3F5E] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 pj-body"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div>
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