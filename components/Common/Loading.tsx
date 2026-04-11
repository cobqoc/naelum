interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Loading({ message = '낼름...', size = 'md' }: LoadingProps) {
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-2xl';
  const py = size === 'sm' ? 'py-6' : size === 'lg' ? 'py-20' : 'py-12';

  return (
    <div className={`text-center ${py}`}>
      <div className={`animate-bounce font-bold text-accent-warm ${textSize}`}>
        {message}
      </div>
    </div>
  );
}
