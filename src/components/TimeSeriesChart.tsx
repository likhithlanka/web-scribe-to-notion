import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';

interface TimeSeriesChartProps {
  data: Array<{
    date: string;
    count: number;
  }>;
}

export function TimeSeriesChart({ data }: TimeSeriesChartProps) {
  return (
    <ResponsiveContainer width="100%\" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tickFormatter={(date) => format(parseISO(date), 'MMM d')}
        />
        <YAxis />
        <Tooltip 
          labelFormatter={(date) => format(parseISO(date as string), 'MMM d, yyyy')}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="count" 
          stroke="#8884d8" 
          name="Bookmarks"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}