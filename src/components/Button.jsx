// File: src/components/Button.jsx
import { Button as AntButton } from 'antd';

const Button = ({ children, className = '', ...props }) => {
  return (
    <AntButton
      type="primary"
      className={`
        !border-0
        hover:!brightness-90
        active:!translate-y-px 
        !shadow-[0_12px_28px_rgba(30,125,255,0.2)]
        flex items-center justify-center gap-2
        transition-all duration-300
        ${className}
      `}
      {...props}
    >
      {children}
    </AntButton>
  );
};

export default Button;