import React from 'react';

export const Textarea = React.memo(({
  value,
  onChange,
  placeholder,
  rows = 2,
  className = '',
  ...props
}) => {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`mt-1 block w-full rounded-xl border border-[#E7E5E0] shadow-sm px-3 py-2 focus:border-[#3E3AA0] focus:ring-2 focus:ring-[#3E3AA0]/20 outline-none pj-body ${className}`}
      {...props}
    />
  );
});