import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface AttainmentData {
  name: string;
  value: number;
}

interface AttainmentChartProps {
  data: AttainmentData[];
  title: string;
  departmentOptions: { label: string; value: string }[];
  yearOptions: { label: string; value: string }[];
  onDepartmentChange: (value: string) => void;
  onYearChange: (value: string) => void;
  selectedDepartment: string;
  selectedYear: string;
  loading?: boolean;
}

export default function AttainmentChart({
  data,
  title,
  departmentOptions,
  yearOptions,
  onDepartmentChange,
  onYearChange,
  selectedDepartment,
  selectedYear,
  loading = false,
}: AttainmentChartProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-800">{title}</h2>
        <div className="flex">
          <select
            className="mr-2 text-sm border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
            value={selectedDepartment}
            onChange={(e) => onDepartmentChange(e.target.value)}
          >
            {departmentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
          >
            {yearOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="p-4">
        <div className="h-64 w-full">
          {loading ? (
            <div className="h-full w-full flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Attainment']}
                  labelFormatter={(label) => `${label}`}
                />
                <Bar dataKey="value" fill="#1976d2" barSize={35} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-right">
        <button className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50">
          View Detailed Report
        </button>
      </div>
    </div>
  );
}
