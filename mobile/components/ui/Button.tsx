import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface ButtonProps {
  onPress: () => void;
  children: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

const variantClasses = {
  primary: 'bg-blue-600 active:bg-blue-700',
  secondary: 'bg-gray-100 active:bg-gray-200',
  danger: 'bg-red-600 active:bg-red-700',
  ghost: 'bg-transparent active:bg-gray-100',
};

const textClasses = {
  primary: 'text-white font-semibold',
  secondary: 'text-gray-800 font-semibold',
  danger: 'text-white font-semibold',
  ghost: 'text-blue-600 font-semibold',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 rounded-lg',
  md: 'px-4 py-2.5 rounded-xl',
  lg: 'px-6 py-3.5 rounded-xl',
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function Button({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={`flex-row items-center justify-center ${variantClasses[variant]} ${sizeClasses[size]} ${isDisabled ? 'opacity-50' : ''} ${className}`}
    >
      {loading && <ActivityIndicator size="small" color={variant === 'primary' || variant === 'danger' ? '#fff' : '#2563eb'} className="mr-2" />}
      <Text className={`${textClasses[variant]} ${textSizeClasses[size]}`}>{children}</Text>
    </TouchableOpacity>
  );
}
