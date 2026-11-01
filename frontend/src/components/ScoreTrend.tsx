import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { HistoryEntry } from '../types'

export default function ScoreTrend({ entries }: { entries: HistoryEntry[] }) {
  // entries are newest first; chart oldest to newest.
  const data = [...entries].reverse().map((e, i) => ({
    n: i + 1,
    score: e.score,
    when: new Date(e.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }),
  }))
  return (
    <div role="img" aria-label={`Line chart of ${data.length} predicted scores, oldest to newest: ${data.map((d) => d.score).join(', ')}`}>
      <ResponsiveContainer width="100%" height={230}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="#E7E5F7" vertical={false} />
          <XAxis dataKey="n" tickLine={false} axisLine={false} tick={{ fill: '#5B5E82', fontSize: 12 }} allowDecimals={false} />
          <YAxis domain={['auto', 'auto']} tickLine={false} axisLine={false} tick={{ fill: '#5B5E82', fontSize: 12 }} width={44} />
          <Tooltip
            formatter={(v) => [Number(v).toFixed(2), 'Predicted score']}
            labelFormatter={(_, p) => p?.[0]?.payload?.when ?? ''}
            contentStyle={{ borderRadius: 12, border: '1px solid #E7E5F7', boxShadow: '0 8px 24px -12px rgba(60,50,140,.3)' }}
          />
          <Line type="monotone" dataKey="score" stroke="#6A58E8" strokeWidth={2.5} dot={{ r: 4, fill: '#fff', stroke: '#6A58E8', strokeWidth: 2 }} activeDot={{ r: 5 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
