import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3, RefreshCcw } from 'lucide-react'

type DailyMetric = {
  date: string
  calls: number
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost: number
}

type ModelMetric = {
  model: string
  provider: string
  calls: number
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost: number
}

type MetricsPayload = {
  generatedAt: string
  source: string
  totals: {
    calls: number
    inputTokens: number
    outputTokens: number
    cacheRead: number
    cacheWrite: number
    totalTokens: number
    cost: number
  }
  daily: DailyMetric[]
  models: ModelMetric[]
}

const colors = ['#38bdf8', '#a78bfa', '#10b981', '#fb7185', '#f59e0b', '#22d3ee', '#f97316']

function App() {
  const [data, setData] = useState<MetricsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/metrics.json?ts=${Date.now()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as MetricsPayload
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load metrics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const providerMix = useMemo(() => {
    const grouped = new Map<string, number>()
    for (const row of data?.models ?? []) {
      grouped.set(row.provider, (grouped.get(row.provider) ?? 0) + row.cost)
    }
    return [...grouped.entries()].map(([name, value]) => ({ name, value }))
  }, [data])

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 text-slate-100 md:px-8">
      <header className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="inline-flex items-center gap-2 rounded-full bg-sky-400/20 px-3 py-1 text-xs font-semibold text-sky-200">
            <BarChart3 size={14} /> OpenClaw Cost Dashboard
          </p>
          <button onClick={loadData} className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 text-xs hover:bg-slate-700">
            <RefreshCcw size={14} /> Refresh
          </button>
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-5xl">Actual OpenClaw usage + cost</h1>
        <p className="mt-2 max-w-3xl text-slate-300">
          Reads usage/cost data from local OpenClaw session logs and publishes it as metrics.json during build/deploy.
        </p>
        {data && <p className="mt-2 text-xs text-slate-400">Last sync: {new Date(data.generatedAt).toLocaleString()}</p>}
        {error && <p className="mt-2 text-xs text-rose-300">Error loading metrics: {error}</p>}
      </header>

      {loading && <p className="text-slate-300">Loading metrics…</p>}

      {!!data && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card title="API Calls" value={data.totals.calls.toLocaleString()} />
            <Card title="Input Tokens" value={data.totals.inputTokens.toLocaleString()} />
            <Card title="Output Tokens" value={data.totals.outputTokens.toLocaleString()} />
            <Card title="Total Cost" value={`$${data.totals.cost.toFixed(2)}`} />
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 lg:col-span-2">
              <h2 className="mb-3 text-xl font-semibold">Daily spend</h2>
              <div className="h-72">
                <ResponsiveContainer>
                  <AreaChart data={data.daily}>
                    <defs>
                      <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip formatter={(v: number | string | undefined) => `$${Number(v ?? 0).toFixed(4)}`} />
                    <Area type="monotone" dataKey="cost" stroke="#38bdf8" fillOpacity={1} fill="url(#costGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
              <h2 className="mb-3 text-xl font-semibold">Cost by provider</h2>
              <div className="h-72">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={providerMix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={92} paddingAngle={4}>
                      {providerMix.map((entry, i) => (
                        <Cell key={entry.name} fill={colors[i % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number | string | undefined) => `$${Number(v ?? 0).toFixed(4)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-slate-300">
                <tr>
                  <th className="p-3">Model</th>
                  <th className="p-3">Provider</th>
                  <th className="p-3">Calls</th>
                  <th className="p-3">Input</th>
                  <th className="p-3">Output</th>
                  <th className="p-3">Cost</th>
                </tr>
              </thead>
              <tbody>
                {data.models.slice(0, 20).map((m) => (
                  <tr key={m.model} className="border-t border-white/10">
                    <td className="p-3">{m.model}</td>
                    <td className="p-3">{m.provider}</td>
                    <td className="p-3">{m.calls.toLocaleString()}</td>
                    <td className="p-3">{m.inputTokens.toLocaleString()}</td>
                    <td className="p-3">{m.outputTokens.toLocaleString()}</td>
                    <td className="p-3">${m.cost.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </main>
  )
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <p className="text-xs uppercase tracking-wider text-slate-400">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </article>
  )
}

export default App
