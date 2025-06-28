"use client"

import * as React from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"
import { format, parseISO, startOfMonth, startOfWeek } from "date-fns"

import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { DailyRecord } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

interface TrendGraphProps {
  allRecords: DailyRecord[];
}

const chartConfig = {
  totalBalance: {
    label: "Total Balance",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

const CustomizedLabel: React.FC<any> = ({ x, y, value }) => {
  const formattedValue = `${(value / 100000).toFixed(1)}L`;
  return (
    <text x={x} y={y} dy={-10} fill="hsl(var(--foreground))" fontSize={12} textAnchor="middle">
      {formattedValue}
    </text>
  );
};


export default function TrendGraph({ allRecords }: TrendGraphProps) {
  const chartContainerRef = React.useRef<HTMLDivElement>(null)
  const [width, setWidth] = React.useState(0)

  React.useEffect(() => {
    if (!chartContainerRef.current) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width)
      }
    })

    observer.observe(chartContainerRef.current)
    return () => observer.disconnect()
  }, [])

  const { chartData, tickFormatter } = React.useMemo(() => {
    if (!allRecords || allRecords.length < 2 || width === 0) {
        // Return daily format for server-side rendering or when not enough data
        return {
            chartData: allRecords
                .map(record => ({
                    date: record.date,
                    totalBalance: record.accounts.reduce((acc, curr) => acc + curr.balance + curr.fds.reduce((fdAcc, fd) => fdAcc + fd.principal, 0), 0),
                    label: format(parseISO(record.date), 'PPP')
                }))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
            tickFormatter: (value: string) => format(parseISO(value), "MMM d")
        };
    }

    const sortedRecords = allRecords
      .map(record => ({
        date: parseISO(record.date),
        totalBalance: record.accounts.reduce((acc, curr) => acc + curr.balance + curr.fds.reduce((fdAcc, fd) => fdAcc + fd.principal, 0), 0),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    let grouping: 'daily' | 'weekly' | 'monthly' = 'daily';
    const numPoints = sortedRecords.length;

    // Heuristic for grouping based on available width per point
    if (width / numPoints < 35) grouping = 'monthly';
    else if (width / numPoints < 65) grouping = 'weekly';

    if (grouping === 'monthly') {
        const monthlyData = new Map<string, { total: number, count: number, date: Date }>();
        sortedRecords.forEach(record => {
            const monthKey = format(record.date, 'yyyy-MM');
            const entry = monthlyData.get(monthKey) || { total: 0, count: 0, date: startOfMonth(record.date) };
            entry.total += record.totalBalance;
            entry.count += 1;
            monthlyData.set(monthKey, entry);
        });

        return {
            chartData: Array.from(monthlyData.values()).map(entry => ({
                date: format(entry.date, 'yyyy-MM-dd'),
                totalBalance: entry.total / entry.count,
                label: `Avg for ${format(entry.date, "MMMM yyyy")}`,
            })),
            tickFormatter: (value: string) => format(parseISO(value), 'MMM yy'),
        };
    }

    if (grouping === 'weekly') {
        const weeklyData = new Map<string, { total: number, count: number, date: Date }>();
        sortedRecords.forEach(record => {
            const weekStart = startOfWeek(record.date, { weekStartsOn: 1 });
            const weekKey = format(weekStart, 'yyyy-MM-dd');
            const entry = weeklyData.get(weekKey) || { total: 0, count: 0, date: weekStart };
            entry.total += record.totalBalance;
            entry.count += 1;
            weeklyData.set(weekKey, entry);
        });
        
        return {
            chartData: Array.from(weeklyData.values()).map(entry => ({
                date: format(entry.date, 'yyyy-MM-dd'),
                totalBalance: entry.total / entry.count,
                label: `Avg for week of ${format(entry.date, "do MMM")}`,
            })),
            tickFormatter: (value: string) => format(parseISO(value), 'MMM d'),
        };
    }
    
    // Daily
    return {
        chartData: sortedRecords.map(r => ({ 
            date: format(r.date, 'yyyy-MM-dd'),
            totalBalance: r.totalBalance,
            label: format(r.date, 'PPP')
        })),
        tickFormatter: (value: string) => format(parseISO(value), 'MMM d')
    };

  }, [allRecords, width]);

  if (allRecords.length < 2) {
    return (
      <div className="flex items-center justify-center h-[250px] text-muted-foreground">
        Not enough data to display a trend.
      </div>
    );
  }

  return (
    <ChartContainer ref={chartContainerRef} config={chartConfig} className="h-[250px] w-full">
      <LineChart
        data={chartData}
        margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={tickFormatter}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(value) => `₹${Number(value) / 100000}L`}
          width={40}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <Tooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value, name, item) => (
                <div className="flex flex-col">
                   <span className="text-muted-foreground text-xs">{item.payload.label}</span>
                  <span>{formatCurrency(value as number)}</span>
                </div>
              )}
            />
          }
        />
        <Line
          dataKey="totalBalance"
          type="monotone"
          stroke="var(--color-totalBalance)"
          strokeWidth={2}
          dot={true}
          label={<CustomizedLabel />}
        />
      </LineChart>
    </ChartContainer>
  )
}
