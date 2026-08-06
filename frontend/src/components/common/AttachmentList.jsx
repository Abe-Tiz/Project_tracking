import React from 'react';
import { FiFile, FiMaximize2, FiX } from 'react-icons/fi';

const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50"%3E%3Crect width="50" height="50" fill="%23EEEEEC"/%3E%3Ctext x="25" y="25" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="10" fill="%238A8985"%3E📎%3C/text%3E%3C/svg%3E';

const isImageAttachment = (attachment) => {
  if (!attachment) return false;
  if (attachment.type && attachment.type.startsWith('image/')) return true;
  if (attachment.url && attachment.url.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)/i)) return true;
  if (attachment.name && attachment.name.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)/i)) return true;
  return false;
};

export const AttachmentList = React.memo(({ attachments, onRemove, onPreview, className = '' }) => {
  const safeAttachments = Array.isArray(attachments) ? attachments : [];
  if (safeAttachments.length === 0) return null;

  const imageAttachments = safeAttachments.filter(isImageAttachment);
  const otherAttachments = safeAttachments.filter(a => !isImageAttachment(a));

  const getDisplayUrl = (att) => {
    return att?.url || att?.preview || PLACEHOLDER_IMAGE;
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {imageAttachments.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {imageAttachments.map((att, idx) => {
            const imageSrc = getDisplayUrl(att);
            const isValid = imageSrc !== PLACEHOLDER_IMAGE;
            
            return (
              <div 
                key={`img-${idx}`}
                className="relative group cursor-pointer"
                onClick={() => isValid && onPreview?.(imageSrc, att?.name || 'Image')}
              >
                <img 
                  src={imageSrc} 
                  alt={att?.name || 'Attachment'} 
                  className="w-12 h-12 rounded-lg object-cover border border-[#E7E5E0] hover:border-[#3E3AA0] transition-colors"
                  onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                  loading="lazy"
                />
                {isValid && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <FiMaximize2 size={14} className="text-white" />
                  </div>
                )}
                {onRemove && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(att.id);
                    }}
                    className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FiX size={12} className="text-[#B23A48]" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      {otherAttachments.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {otherAttachments.map((att, idx) => (
            <div
              key={`file-${idx}`}
              className="inline-flex items-center gap-1 px-2 py-1 bg-[#F2F1ED] rounded-lg text-xs text-[#5B5A56]"
            >
              <FiFile size={12} />
              <span className="truncate max-w-[100px]">{att?.name || 'Attachment'}</span>
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(att.id)}
                  className="ml-1 text-[#8A8985] hover:text-[#B23A48]"
                >
                  <FiX size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});