"use client"

//import { useUser } from "@auth0/nextjs-auth0"
import { useEffect, useState } from "react"
import { DollarSign, ChevronDown, Download, FileText, Music2, AlertTriangle } from "lucide-react"
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
  PieChart,
  Pie,
  Cell,
} from "recharts"

// Fake data for a music business dashboard
const dspBreakdown = [
  { name: "Spotify", value: 420000, color: "#1DB954" },
  { name: "Apple Music", value: 280000, color: "#FA243C" },
  { name: "YouTube", value: 190000, color: "#FF0000" },
  { name: "Amazon", value: 90000, color: "#FF9900" },
  { name: "Other", value: 60000, color: "#6B7280" },
]

const incomeBreakdown = [
  { name: "Recording", value: 640000, color: "#F97316" },
  { name: "Publishing", value: 280000, color: "#10B981" },
  { name: "Sync", value: 120000, color: "#3B82F6" },
]

const royaltiesTrend = [
  { month: "Jan", net: 200000, recouped: 30000 },
  { month: "Feb", net: 180000, recouped: 25000 },
  { month: "Mar", net: 260000, recouped: 45000 },
  { month: "Apr", net: 210000, recouped: 35000 },
  { month: "May", net: 240000, recouped: 40000 },
  { month: "Jun", net: 230000, recouped: 38000 },
]

const topTracks = [
  { title: "Midnight Drive", artist: "Nova", revenue: 82000, streams: 3_200_000 },
  { title: "Echoes", artist: "Lumen", revenue: 67000, streams: 2_610_000 },
  { title: "Golden Hour", artist: "Aria", revenue: 54000, streams: 2_100_000 },
  { title: "Neon Skies", artist: "Pulse", revenue: 42000, streams: 1_540_000 },
  { title: "Falling Stars", artist: "Orion", revenue: 36000, streams: 1_210_000 },
]

const royaltiesByTerritory = [
  { country: "United States", royalties: 350000, color: "#0D9488" },
  { country: "United Kingdom", royalties: 120000, color: "#F97316" },
  { country: "Germany", royalties: 95000, color: "#1E40AF" },
  { country: "Japan", royalties: 80000, color: "#EAB308" },
  { country: "Brazil", royalties: 60000, color: "#22C55E" },
]

const tasksAlerts = [
  "3 statements need review (metadata mismatches)",
  "2 invoices overdue > 30 days",
  "1 split approval pending for 'Midnight Drive'",
]

export default function DashboardPage() {
  //const { user, isLoading } = useUser()
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
          <h1 className="text-3xl font-bold text-white">Music Royalties Dashboard</h1>
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
              <p className="text-gray-400 text-sm">Total Royalties (YTD)</p>
              <p className="text-2xl font-bold text-orange-500">$4,295,231.89</p>
              <p className="text-green-400 text-sm">+20.1% vs last quarter</p>
            </div>
            <DollarSign className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Unpaid Invoices</p>
              <p className="text-2xl font-bold text-orange-500">$128,450</p>
              <p className="text-yellow-400 text-sm">12 outstanding</p>
            </div>
            <FileText className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Unrecouped Advances</p>
              <p className="text-2xl font-bold text-orange-500">$512,300</p>
              <p className="text-gray-400 text-sm">Across 9 contracts</p>
            </div>
            <DollarSign className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Catalog Size</p>
              <p className="text-lg font-bold text-orange-500">1,542 Tracks</p>
              <p className="text-gray-400 text-sm">134 Artists</p>
            </div>
            <Music2 className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* DSP Revenue Breakdown */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">DSP Revenue Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dspBreakdown} dataKey="value" nameKey="name" outerRadius={90} label>
                  {dspBreakdown.map((entry, index) => (
                    <Cell key={`cell-dsp-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    color: "#F9FAFB",
                  }}
                />
                <Legend wrapperStyle={{ color: "#F9FAFB" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income Type Breakdown */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Income Type Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={incomeBreakdown} dataKey="value" nameKey="name" outerRadius={90} label>
                  {incomeBreakdown.map((entry, index) => (
                    <Cell key={`cell-inc-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    color: "#F9FAFB",
                  }}
                />
                <Legend wrapperStyle={{ color: "#F9FAFB" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Trends and Top Tracks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Royalties Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={royaltiesTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickFormatter={value => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#F9FAFB",
                  }}
                />
                <Legend wrapperStyle={{ color: "#F9FAFB" }} iconType="circle" />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#F97316"
                  strokeWidth={3}
                  dot={{ fill: "#F97316", r: 4 }}
                  name="Net Royalties"
                />
                <Line
                  type="monotone"
                  dataKey="recouped"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: "#10B981", r: 4 }}
                  name="Recouped"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Top Tracks (This Period)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700 text-sm">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-300 font-medium">Title</th>
                  <th className="px-4 py-2 text-left text-gray-300 font-medium">Artist</th>
                  <th className="px-4 py-2 text-right text-gray-300 font-medium">Revenue</th>
                  <th className="px-4 py-2 text-right text-gray-300 font-medium">Streams</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {topTracks.map(track => (
                  <tr key={track.title} className="hover:bg-gray-700">
                    <td className="px-4 py-2 text-white">{track.title}</td>
                    <td className="px-4 py-2 text-gray-300">{track.artist}</td>
                    <td className="px-4 py-2 text-right text-orange-400">
                      ${track.revenue.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-300">
                      {track.streams.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Territories and Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Royalties by Territory</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={royaltiesByTerritory}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="country"
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
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Royalties"]}
                />
                <Bar dataKey="royalties" radius={[4, 4, 0, 0]}>
                  {royaltiesByTerritory.map((entry, index) => (
                    <Cell key={`cell-ter-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Tasks & Alerts</h3>
          <ul className="space-y-3 text-sm">
            {tasksAlerts.map(item => (
              <li key={item} className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
                <span className="text-gray-300">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
