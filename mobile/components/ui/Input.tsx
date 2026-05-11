import { View, TextInput, Text, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <View className={`mb-4 ${className}`}>
      {label && <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>}
      <TextInput
        className={`border rounded-xl px-4 py-3 text-base text-gray-900 bg-white ${
          error ? 'border-red-500' : 'border-gray-300'
        } focus:border-blue-500`}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error && <Text className="text-xs text-red-500 mt-1">{error}</Text>}
    </View>
  );
}
