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
import { useIsMobile } from "@/hooks/use-mobile"

interface TrendGraphProps {
  allRecords: DailyRecord[];
}

const chartConfig = {
  totalBalance: {
    label: "Total Balance",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

const CustomizedLabel: React.FC<any> = (props) => {
  const { x, y, value, formatter } = props;
  if (value === undefined || formatter === undefined) {
      return null;
  }
  const formattedValue = formatter(value);
  return (
    <text x={x} y={y} dy={-10} fill="hsl(var(--foreground))" fontSize={12} textAnchor="middle">
      {formattedValue}
    </text>
  );
};


export default function TrendGraph({ allRecords }: TrendGraphProps) {
  const chartContainerRef = React.useRef<HTMLDivElement>(null)
  const [width, setWidth] = React.useState(0)
  const isMobile = useIsMobile();

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

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const { chartData, tickFormatter, yAxisFormatter, labelFormatter, chartWidth } = React.useMemo(() => {
    const sortedRecords = allRecords
      .map(record => ({
        date: parseISO(record.date),
        totalBalance: record.accounts.reduce((acc, curr) => acc + curr.balance + curr.fds.reduce((fdAcc, fd) => fdAcc + fd.principal, 0), 0),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const processedData = sortedRecords.map(r => ({
      date: format(r.date, 'yyyy-MM-dd'),
      totalBalance: r.totalBalance,
      label: format(r.date, 'PPP')
    }));

    const finalTickFormatter = (value: string) => format(parseISO(value), 'MMM d');

    const maxBalance = processedData.length > 0 ? Math.max(...processedData.map(d => d.totalBalance)) : 0;

    let divisor = 1;
    let suffix = '';

    if (maxBalance >= 10000000) { // Crores
        divisor = 10000000;
        suffix = 'Cr';
    } else if (maxBalance >= 100000) { // Lakhs
        divisor = 100000;
        suffix = 'L';
    } else if (maxBalance >= 1000) { // Thousands
        divisor = 1000;
        suffix = 'K';
    }

    const yAxisFormatter = (value: number) => {
        if (divisor === 1) return `₹${value}`;
        return `₹${(value / divisor).toFixed(1)}${suffix}`;
    };

    const labelFormatter = (value: number) => {
        if (divisor === 1) return value.toString();
        return `${(value / divisor).toFixed(2)}${suffix}`;
    };

    const defaultVisiblePoints = isMobile ? 5 : 10;
    const pointWidth = 70; // px per data point

    const chartWidth = processedData.length <= defaultVisiblePoints
      ? width
      : Math.max(processedData.length * pointWidth, defaultVisiblePoints * pointWidth);

    return {
        chartData: processedData,
        tickFormatter: finalTickFormatter,
        yAxisFormatter,
        labelFormatter,
        chartWidth,
    };
  }, [allRecords, width, isMobile]);

  React.useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [chartData]);

  if (allRecords.length < 2) {
    return (
      <div className="flex items-center justify-center h-[250px] text-muted-foreground">
        Not enough data to display a trend.
      </div>
    );
  }

  return (
    <ChartContainer ref={chartContainerRef} config={chartConfig} className="h-[250px] w-full">
      <div ref={scrollContainerRef} className="w-full h-full overflow-x-auto overflow-y-hidden">
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 20, bottom: 5 }}
          width={chartWidth}
          height={250}
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
            tickFormatter={yAxisFormatter}
            width={50}
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
            label={<CustomizedLabel formatter={labelFormatter} />}
          />
        </LineChart>
      </div>
    </ChartContainer>
  )
}
