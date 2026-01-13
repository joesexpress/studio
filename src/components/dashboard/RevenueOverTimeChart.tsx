'use client';

import * as React from 'react';
import { Line, LineChart, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { RevenueDataPoint } from '@/lib/types';
import { format } from 'date-fns';

type RevenueOverTimeChartProps = {
  data: RevenueDataPoint[];
};

export default function RevenueOverTimeChart({ data }: RevenueOverTimeChartProps) {
  const chartConfig = {
    revenue: {
      label: 'Revenue',
      color: 'hsl(var(--primary))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Over Time</CardTitle>
        <CardDescription>Monthly paid revenue from service records.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => format(new Date(`${value}-02`), 'MMM')}
            />
            <YAxis
              tickFormatter={(value) => `$${value / 1000}k`}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Line
              dataKey="revenue"
              type="monotone"
              stroke="var(--color-revenue)"
              strokeWidth={2}
              dot={true}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
