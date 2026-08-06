import React from 'react';
import { FiLink, FiX } from 'react-icons/fi';

export const LinkList = React.memo(({ links, onRemove, className = '' }) => {
  const safeLinks = Array.isArray(links) ? links : [];
  if (safeLinks.length === 0) return null;

  const getLinkData = (link) => {
    let url = '';
    let label = '';
    
    if (typeof link === 'string') {
      try {
        const parsed = JSON.parse(link);
        url = parsed.url || parsed.link || '';
        label = parsed.title || parsed.label || parsed.name || url;
      } catch {
        url = link;
        label = link;
      }
    } else if (link && typeof link === 'object') {
      url = link.url || link.link || '';
      label = link.title || link.label || link.name || url;
    }
    
    return { url, label };
  };

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {safeLinks.map((link, idx) => {
        const { url, label } = getLinkData(link);
        if (!url) return null;
        
        return (
          <span
            key={`link-${idx}`}
            className="inline-flex items-center gap-1 px-2 py-1 bg-[#EDEBFB] rounded-lg text-xs text-[#3E3AA0] max-w-[250px]"
          >
            <FiLink size={10} className="flex-shrink-0" />
            <span className="truncate">{label || url}</span>
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(link.id || idx)}
                className="ml-1 text-[#8A8985] hover:text-[#B23A48] flex-shrink-0"
              >
                <FiX size={12} />
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
});