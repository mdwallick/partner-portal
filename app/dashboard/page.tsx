"use client"

import { useOktaAuth } from "@/lib/use-okta-auth"
import { useEffect, useState } from "react"
import { DollarSign, Clock, Users, Tv, ChevronDown, Download } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts"

// Fake data for charts
const royaltiesByLicensor = [
  { name: "Toei Animation", royalties: 3800 },
  { name: "Studio Pierrot", royalties: 2800 },
  { name: "Ufotable", royalties: 2200 },
  { name: "Bones", royalties: 1500 },
  { name: "MAPPA", royalties: 800 },
]

const revenueData = [
  { month: "Jan", revenue: 2000, watchHours: 9000 },
  { month: "Feb", revenue: 1000, watchHours: 11000 },
  { month: "Mar", revenue: 9000, watchHours: 19000 },
  { month: "Apr", revenue: 4000, watchHours: 14000 },
  { month: "May", revenue: 5000, watchHours: 22000 },
  { month: "Jun", revenue: 4500, watchHours: 19000 },
]

const royaltiesByRegion = [
  { region: "North America", royalties: 8500, color: "#0D9488" }, // teal
  { region: "Europe", royalties: 7200, color: "#F97316" }, // orange
  { region: "Asia Pacific", royalties: 6800, color: "#1E40AF" }, // blue
  { region: "Japan", royalties: 5200, color: "#EAB308" }, // yellow
  { region: "Latin America", royalties: 3800, color: "#FB923C" }, // light orange
  { region: "Middle East & Africa", royalties: 2100, color: "#000000" }, // black
]

const watchTimeByGenre = [
  { genre: "Action", hours: 355 },
  { genre: "Adventure", hours: 295 },
  { genre: "Shōnen", hours: 285 },
  { genre: "Fantasy", hours: 245 },
  { genre: "Comedy", hours: 185 },
  { genre: "Drama", hours: 165 },
  { genre: "Romance", hours: 135 },
  { genre: "Supernatural", hours: 120 },
  { genre: "Slice of Life", hours: 95 },
  { genre: "Isekai", hours: 85 },
  { genre: "Magic", hours: 75 },
  { genre: "Sci-Fi", hours: 65 },
  { genre: "Psychological", hours: 45 },
  { genre: "Mystery", hours: 35 },
  { genre: "Seinen", hours: 25 },
]

export default function DashboardPage() {
  const { user } = useOktaAuth()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Licensor Royalties Dashboard</h1>
          <p className="text-gray-400">Performance overview for Q2 2025</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <select className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white appearance-none pr-8">
              <option>This Quarter</option>
              <option>Last Quarter</option>
              <option>This Year</option>
            </select>
            <ChevronDown className="absolute right-2 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <Download className="h-4 w-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Total Royalties</p>
              <p className="text-2xl font-bold text-orange-500">$4,295,231.89</p>
              <p className="text-green-400 text-sm">+20.1% from last quarter</p>
            </div>
            <DollarSign className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Total Watch Hours</p>
              <p className="text-2xl font-bold text-orange-500">1.2M hours</p>
              <p className="text-green-400 text-sm">+15.3% from last quarter</p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Active Subscribers</p>
              <p className="text-2xl font-bold text-orange-500">12,405</p>
              <p className="text-green-400 text-sm">+8.2% from last quarter</p>
            </div>
            <Users className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Top Performing Title</p>
              <p className="text-lg font-bold text-orange-500">Galactic Drifters</p>
              <p className="text-gray-400 text-sm">Toei Animation</p>
            </div>
            <Tv className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Royalties by Licensor Chart */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Royalties by Licensor</h3>
          <div className="space-y-4">
            {royaltiesByLicensor.map((licensor, index) => (
              <div key={licensor.name} className="flex items-center space-x-4">
                <div className="w-32 text-sm text-gray-300">{licensor.name}</div>
                <div className="flex-1">
                  <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-orange-500 h-4 rounded-full animate-fill-bar"
                      style={{
                        width: `${(licensor.royalties / 4000) * 100}%`,
                        animationDelay: `${index * 200}ms`,
                        transform: "translateX(-100%)",
                        animation: `fillBar 1s ease-out ${index * 200}ms forwards`,
                      }}
                    ></div>
                  </div>
                </div>
                <div className="w-20 text-right text-sm text-orange-500 font-semibold">
                  ${licensor.royalties.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
          <style jsx>{`
            @keyframes fillBar {
              from {
                transform: translateX(-100%);
              }
              to {
                transform: translateX(0%);
              }
            }
          `}</style>
        </div>

        {/* Revenue vs Watch Hours Chart */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue vs. Watch Hours</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickFormatter={value => value.toLocaleString()}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#F9FAFB",
                  }}
                  labelStyle={{ color: "#9CA3AF" }}
                />
                <Legend wrapperStyle={{ color: "#F9FAFB" }} iconType="circle" />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#F97316"
                  strokeWidth={3}
                  dot={{ fill: "#F97316", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#F97316", strokeWidth: 2 }}
                  name="Revenue (USD)"
                />
                <Line
                  type="monotone"
                  dataKey="watchHours"
                  stroke="#FFFFFF"
                  strokeWidth={3}
                  dot={{ fill: "#FFFFFF", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#FFFFFF", strokeWidth: 2 }}
                  name="Watch Hours"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Placeholder Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Royalties by Region</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={royaltiesByRegion}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="region"
                  stroke="#9CA3AF"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickFormatter={value => `$${(value / 1000).toFixed(1)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#F9FAFB",
                  }}
                  labelStyle={{ color: "#9CA3AF" }}
                  formatter={value => [`$${value.toLocaleString()}`, "Royalties"]}
                />
                <Bar dataKey="royalties" fill="#F97316" radius={[4, 4, 0, 0]}>
                  {royaltiesByRegion.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-2">Watch Time by Genre</h3>
          <p className="text-sm text-gray-400 mb-4">Hours watched for your most-viewed genres</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={watchTimeByGenre} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="genre"
                  stroke="#9CA3AF"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={value => `${value}h`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#F9FAFB",
                  }}
                  labelStyle={{ color: "#9CA3AF" }}
                  formatter={value => [`${value} hours`, "Watch Time"]}
                />
                <Bar
                  dataKey="hours"
                  fill="#F97316"
                  radius={[4, 4, 0, 0]}
                  animationDuration={1000}
                  animationBegin={0}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
