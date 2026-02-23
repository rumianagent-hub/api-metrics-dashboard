import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts'
import { BarChart3, Plus, Trash2 } from 'lucide-react'

type Metric = {
  id: string
  date: string
  provider: string
  endpoint: string
  calls: number
  inputTokens: number
  outputTokens: number
  cost: number
}

const seed: Metric[] = [
  {
    id: crypto.randomUUID(),
    date: '2026-02-20',
    provider: 'OpenAI',
    endpoint: '/v1/chat/completions',
    calls: 24,
    inputTokens: 128400,
    outputTokens: 44200,
    cost: 4.12,
  },
  {
    id: crypto.randomUUID(),
    date: '2026-02-21',
    provider: 'Anthropic',
    endpoint: '/v1/messages',
    calls: 38,
    inputTokens: 168200,
    outputTokens: 67500,
    cost: 9.84,
  },
  {
    id: crypto.randomUUID(),
    date: '2026-02-22',
    provider: 'OpenRouter',
    endpoint: '/api/v1/chat/completions',
    calls: 51,
    inputTokens: 195200,
    outputTokens: 88200,
    cost: 8.09,
  },
]

const colors = ['#38bdf8', '#a78bfa', '#10b981', '#fb7185', '#f59e0b']

function App() {
  const [metrics, setMetrics] = useState<Metric[]>(seed)
  const [form, setForm] = useState<Omit<Metric, 'id'>>({
    date: new Date().toISOString().slice(0, 10),
    provider: 'OpenAI',
    endpoint: '/v1/chat/completions',
    calls: 1,
    inputTokens: 0,
    outputTokens: 0,
    cost: 0,
  })

  const totals = useMemo(() => {
    return metrics.reduce(
      (acc, row) => {
        acc.calls += row.calls
        acc.inputTokens += row.inputTokens
        acc.outputTokens += row.outputTokens
        acc.cost += row.cost
        return acc
      },
      { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 }
    )
  }, [metrics])

  const chartRows = useMemo(
    () =>
      metrics.map((m) => ({
        date: m.date.slice(5),
        calls: m.calls,
        totalTokens: m.inputTokens + m.outputTokens,
      })),
    [metrics]
  )

  const providerMix = useMemo(() => {
    const grouped = new Map<string, number>()
    metrics.forEach((m) => grouped.set(m.provider, (grouped.get(m.provider) ?? 0) + m.cost))
    return [...grouped.entries()].map(([name, value]) => ({ name, value }))
  }, [metrics])

  const addRow = () => {
    setMetrics((prev) => [...prev, { id: crypto.randomUUID(), ...form }])
  }

  const removeRow = (id: string) => setMetrics((prev) => prev.filter((m) => m.id !== id))

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 text-slate-100 md:px-8">
      <header className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-sky-400/20 px-3 py-1 text-xs font-semibold text-sky-200">
          <BarChart3 size={14} /> API Metrics Command Center
        </p>
        <h1 className="text-3xl font-bold tracking-tight md:text-5xl">Track every call, token, and dollar</h1>
        <p className="mt-2 max-w-3xl text-slate-300">Realtime-ready dashboard for monitoring API usage across OpenAI, Anthropic, OpenRouter, and anything else you add.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Total API Calls" value={totals.calls.toLocaleString()} />
        <Card title="Input Tokens" value={totals.inputTokens.toLocaleString()} />
        <Card title="Output Tokens" value={totals.outputTokens.toLocaleString()} />
        <Card title="Estimated Cost" value={`$${totals.cost.toFixed(2)}`} />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 lg:col-span-2">
          <h2 className="mb-3 text-xl font-semibold">Usage trend</h2>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={chartRows}>
                <defs>
                  <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Area type="monotone" dataKey="calls" stroke="#38bdf8" fillOpacity={1} fill="url(#callsGradient)" />
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
                <Tooltip formatter={(v: number | string | undefined) => `$${Number(v ?? 0).toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-slate-950/60 p-4">
        <h2 className="mb-4 text-xl font-semibold">Add metric row</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Date" type="date" value={form.date} onChange={(v) => setForm((f) => ({ ...f, date: v }))} />
          <Input label="Provider" value={form.provider} onChange={(v) => setForm((f) => ({ ...f, provider: v }))} />
          <Input label="Endpoint" value={form.endpoint} onChange={(v) => setForm((f) => ({ ...f, endpoint: v }))} />
          <Input label="Calls" type="number" value={String(form.calls)} onChange={(v) => setForm((f) => ({ ...f, calls: Number(v) || 0 }))} />
          <Input label="Input Tokens" type="number" value={String(form.inputTokens)} onChange={(v) => setForm((f) => ({ ...f, inputTokens: Number(v) || 0 }))} />
          <Input label="Output Tokens" type="number" value={String(form.outputTokens)} onChange={(v) => setForm((f) => ({ ...f, outputTokens: Number(v) || 0 }))} />
          <Input label="Cost (USD)" type="number" value={String(form.cost)} onChange={(v) => setForm((f) => ({ ...f, cost: Number(v) || 0 }))} />
          <button onClick={addRow} className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sky-400 px-4 font-semibold text-slate-950 hover:bg-sky-300">
            <Plus size={18} /> Add row
          </button>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="p-3">Date</th><th className="p-3">Provider</th><th className="p-3">Endpoint</th><th className="p-3">Calls</th><th className="p-3">Input</th><th className="p-3">Output</th><th className="p-3">Cost</th><th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => (
              <tr key={m.id} className="border-t border-white/10">
                <td className="p-3">{m.date}</td>
                <td className="p-3">{m.provider}</td>
                <td className="p-3">{m.endpoint}</td>
                <td className="p-3">{m.calls.toLocaleString()}</td>
                <td className="p-3">{m.inputTokens.toLocaleString()}</td>
                <td className="p-3">{m.outputTokens.toLocaleString()}</td>
                <td className="p-3">${m.cost.toFixed(2)}</td>
                <td className="p-3"><button onClick={() => removeRow(m.id)} className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/20"><Trash2 size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
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

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="text-sm text-slate-300">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-11 w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-slate-100 outline-none ring-sky-300/40 placeholder:text-slate-500 focus:ring-2"
      />
    </label>
  )
}

export default App
