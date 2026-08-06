// src/components/reports/ExcelExport.jsx
import React, { useState } from 'react';
import { FiFilePlus, FiDownload } from 'react-icons/fi';
import { reportAPI } from '../../services/reportAPI';

export const ExcelExport = ({ reportId, reportName, onExport }) => {
  const [exporting, setExporting] = useState(false);

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const response = await reportAPI.exportReport(reportId, 'excel');
      
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportName || 'project'}_report.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      if (onExport) onExport('excel');
    } catch (error) {
      console.error('Failed to export Excel:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExportExcel}
      disabled={exporting}
      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#12786B] hover:bg-[#0F5F54] rounded-xl transition-colors disabled:opacity-50"
    >
      {exporting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div>
          Exporting...
        </>
      ) : (
        <>
          <FiFilePlus size={18} />
          Export Excel
        </>
      )}
    </button>
  );
};