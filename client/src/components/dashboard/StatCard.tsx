import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: 'primary' | 'secondary' | 'accent' | 'success';
}

export default function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    primary: 'bg-primary bg-opacity-10 text-primary',
    secondary: 'bg-orange-500 bg-opacity-10 text-orange-500',
    accent: 'bg-purple-700 bg-opacity-10 text-purple-700',
    success: 'bg-green-600 bg-opacity-10 text-green-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-center">
      <div className={`${colorClasses[color]} p-3 rounded-full`}>
        {icon}
      </div>
      <div className="ml-4">
        <h2 className="text-gray-500 text-sm">{title}</h2>
        <p className="text-2xl font-medium text-gray-800">{value}</p>
      </div>
    </div>
  );
}
