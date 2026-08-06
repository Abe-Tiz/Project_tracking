import React from 'react';

export const Select = React.memo(({
  value,
  onChange,
  options,
  placeholder,
  className = '',
  ...props
}) => {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`block w-full rounded-xl border border-[#E7E5E0] shadow-sm px-3 py-2 focus:border-[#3E3AA0] focus:ring-2 focus:ring-[#3E3AA0]/20 outline-none pj-body ${className}`}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
});