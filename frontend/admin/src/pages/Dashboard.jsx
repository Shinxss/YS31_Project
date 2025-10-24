import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  ResponsiveContainer,
} from "recharts";

const lineData = [
  { month: "Jan", applications: 140 },
  { month: "Feb", applications: 160 },
  { month: "Mar", applications: 180 },
  { month: "Apr", applications: 210 },
  { month: "May", applications: 250 },
  { month: "Jun", applications: 290 },
  { month: "Jul", applications: 320 },
  { month: "Aug", applications: 350 },
  { month: "Sep", applications: 400 },
  { month: "Oct", applications: 450 },
  { month: "Nov", applications: 480 },
  { month: "Dec", applications: 520 },
];

const barData = [
  { field: "Engineering", jobs: 45 },
  { field: "Data Science", jobs: 38 },
  { field: "Management", jobs: 30 },
  { field: "Design", jobs: 25 },
  { field: "Marketing", jobs: 20 },
];

export default function Dashboard() {
  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />

        {/* Main content area */}
        <div className="ml-72 mt-20 p-8 space-y-8">
          {/* Header */}
          <div className="border-b pb-4 mb-6">
            <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">
              Dashboard
            </h1>
            <p className="text-xl text-gray-600 mt-2 leading-relaxed">
              Welcome back, <span className="font-semibold text-indigo-700">Admin</span>. Here’s your
              platform overview.
            </p>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-4 gap-6">
            {[
              {
                label: "Total Students",
                value: "1,248",
                change: "+12% from last month",
              },
              {
                label: "Total Verified Companies",
                value: "342",
                change: "+8% from last month",
              },
              {
                label: "Total Active Job Listings",
                value: "567",
                change: "+15% from last month",
              },
              {
                label: "Total Applications Received",
                value: "3,892",
                change: "+22% from last month",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <p className="text-gray-500 text-lg font-medium">
                    {stat.label}
                  </p>
                  <h2 className="text-4xl md:text-5xl font-bold mt-3 text-gray-900">
                    {stat.value}
                  </h2>
                </div>
                <p className="text-green-600 text-lg mt-3 font-medium">
                  {stat.change}
                </p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-6">
            {/* Line Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-2xl font-semibold mb-4 text-gray-800">
                Applications per Month
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="applications"
                    stroke="#1d3b8b"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-2xl font-semibold mb-4 text-gray-800">
                Top Job Fields
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="field" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="jobs" fill="#1d3b8b" barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
