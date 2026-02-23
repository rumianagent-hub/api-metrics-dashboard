import fs from 'fs'
import path from 'path'

const sessionsDir = '/home/naimur/.openclaw/agents/main/sessions'
const outPath = path.join(process.cwd(), 'public', 'metrics.json')

function readJsonl(filePath) {
  const rows = []
  const lines = fs.readFileSync(filePath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      rows.push(JSON.parse(trimmed))
    } catch {
      // ignore malformed line
    }
  }
  return rows
}

function providerFromModel(model = '') {
  if (model.startsWith('anthropic/') || model.includes('claude')) return 'Anthropic'
  if (model.startsWith('openai/')) return 'OpenAI'
  if (model.startsWith('openai-codex/')) return 'OpenAI Codex'
  if (model.startsWith('google/')) return 'Google'
  if (model.startsWith('xai/')) return 'xAI'
  return 'Other'
}

const files = fs.existsSync(sessionsDir)
  ? fs
      .readdirSync(sessionsDir)
      .filter((f) => f.endsWith('.jsonl'))
      .map((f) => path.join(sessionsDir, f))
  : []

const byDay = new Map()
const byModel = new Map()

if (files.length === 0) {
  console.log('No local OpenClaw session logs found in this environment; keeping existing public/metrics.json')
  process.exit(0)
}

let totals = {
  calls: 0,
  inputTokens: 0,
  outputTokens: 0,
  cacheRead: 0,
  cacheWrite: 0,
  totalTokens: 0,
  cost: 0,
}

for (const filePath of files) {
  const events = readJsonl(filePath)
  for (const event of events) {
    const msg = event?.message
    const usage = msg?.usage
    if (!usage || !usage.cost) continue

    const ts = event.timestamp || msg.timestamp || new Date().toISOString()
    const date = String(ts).slice(0, 10)
    const model = msg.model || msg.modelId || 'unknown'
    const provider = providerFromModel(model)

    totals.calls += 1
    totals.inputTokens += Number(usage.input || 0)
    totals.outputTokens += Number(usage.output || 0)
    totals.cacheRead += Number(usage.cacheRead || 0)
    totals.cacheWrite += Number(usage.cacheWrite || 0)
    totals.totalTokens += Number(usage.totalTokens || 0)
    totals.cost += Number(usage.cost.total || 0)

    const day = byDay.get(date) || {
      date,
      calls: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      cost: 0,
    }
    day.calls += 1
    day.inputTokens += Number(usage.input || 0)
    day.outputTokens += Number(usage.output || 0)
    day.totalTokens += Number(usage.totalTokens || 0)
    day.cost += Number(usage.cost.total || 0)
    byDay.set(date, day)

    const modelAgg = byModel.get(model) || {
      model,
      provider,
      calls: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      cost: 0,
    }
    modelAgg.calls += 1
    modelAgg.inputTokens += Number(usage.input || 0)
    modelAgg.outputTokens += Number(usage.output || 0)
    modelAgg.totalTokens += Number(usage.totalTokens || 0)
    modelAgg.cost += Number(usage.cost.total || 0)
    byModel.set(model, modelAgg)
  }
}

const payload = {
  generatedAt: new Date().toISOString(),
  source: 'openclaw session jsonl usage records',
  totals,
  daily: Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date)),
  models: Array.from(byModel.values()).sort((a, b) => b.cost - a.cost),
}

fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2))
console.log(`Wrote ${outPath}`)
