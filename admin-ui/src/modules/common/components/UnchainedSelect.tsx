import React from 'react';
import Select, { Props as SelectProps } from 'react-select';
import useTheme from '../hooks/useTheme';

type ThemedSelectProps<OptionType> = SelectProps<OptionType, false>;

const UnchainedSelect = <OptionType,>({
  styles: externalStyles,
  ...props
}: ThemedSelectProps<OptionType>) => {
  const { theme } = useTheme();
  const baseStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      borderWidth: '1px',
      borderRadius: '0.375rem',
      minHeight: '42px',
      paddingLeft: '16px',
      paddingRight: '16px',
      boxShadow: state.isFocused
        ? '0 0 0 2px #1e293b'
        : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    }),
    valueContainer: (provided: any) => ({
      ...provided,
      padding: '0',
    }),
    input: (provided: any) => ({
      ...provided,
      margin: 0,
      padding: 0,
    }),
    menu: (provided: any) => ({
      ...provided,
      zIndex: 9999,
    }),
    menuList: (provided: any) => ({
      ...provided,
      maxHeight: '300px',
      overflowY: 'auto',
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      padding: '10px 16px',
    }),
  };

  const lightStyles = {
    control: (base: any, state: any) => ({
      ...baseStyles.control(base, state),
      backgroundColor: '#ffffff',
      borderColor: state.isFocused ? '#1e293b' : '#cbd5e1',
    }),
    input: (base: any) => ({
      ...baseStyles.input(base),
      color: '#0f172a',
    }),
    menu: (base: any) => ({
      ...baseStyles.menu,
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
    }),
    option: (base: any, state: any) => ({
      ...baseStyles.option(base, state),
      backgroundColor: state.isFocused ? '#f1f5f9' : 'transparent',
      color: '#0f172a',
    }),
    singleValue: (base: any) => ({
      ...base,
      color: '#0f172a',
    }),
    placeholder: (base: any) => ({
      ...base,
      color: '#9ca3af',
    }),
  };

  const darkStyles = {
    control: (base: any, state: any) => ({
      ...baseStyles.control(base, state),
      backgroundColor: '#0f172a',
      borderColor: state.isFocused ? '#1e293b' : '#374151',
    }),
    input: (base: any) => ({
      ...baseStyles.input(base),
      color: '#f1f5f9',
    }),
    menu: (base: any) => ({
      ...baseStyles.menu,
      backgroundColor: '#0f172a',
      border: '1px solid #1e293b',
    }),
    option: (base: any, state: any) => ({
      ...baseStyles.option(base, state),
      backgroundColor: state.isFocused ? '#1e293b' : 'transparent',
      color: '#f1f5f9',
    }),
    singleValue: (base: any) => ({
      ...base,
      color: '#f1f5f9',
    }),
    placeholder: (base: any) => ({
      ...base,
      color: '#64748b',
    }),
  };

  const mergedStyles =
    theme === 'dark'
      ? { ...darkStyles, ...externalStyles }
      : { ...lightStyles, ...externalStyles };

  return (
    <Select
      {...props}
      styles={mergedStyles}
      className="dark:text-slate-100"
      classNamePrefix="react-select"
      menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
      menuPosition="fixed"
    />
  );
};

export default UnchainedSelect;
