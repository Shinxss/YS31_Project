import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function AnalyticsPage() {
  const data = [
    { month: "Jan", value: 40 },
    { month: "Feb", value: 50 },
    { month: "Mar", value: 45 },
    { month: "Apr", value: 60 },
    { month: "May", value: 55 },
    { month: "Jun", value: 65 },
  ];

  const pieData = [
    { name: "Completed", value: 75 },
    { name: "Pending", value: 25 },
  ];

  const COLORS = ["#1E40AF", "#F97316"]; // blue, orange

  return (
    <section className="p-8 bg-[#f5f8ff] min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <h3 className="text-2xl font-semibold text-gray-800">Analytics</h3>

        {/* Top 3 Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex flex-col justify-center items-center p-6 h-28"
            >
              <p className="text-gray-500 text-sm mb-2">Label</p>
              <h4 className="text-2xl font-semibold text-blue-800">24%</h4>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h4 className="text-md font-semibold text-gray-800 mb-1">
              Application Trends
            </h4>
            <p className="text-gray-500 text-sm mb-4">
              Monthly application volume
            </p>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-xl shadow-md p-6 flex justify-center items-center">
            <ResponsiveContainer width="70%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
