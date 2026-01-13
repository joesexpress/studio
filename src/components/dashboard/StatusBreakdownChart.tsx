'use client';

import * as React from 'react';
import { Pie, PieChart, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartLegend, ChartLegendContent } from '@/components/ui/chart';

type StatusBreakdownChartProps = {
  data: { name: string; value: number }[];
};

const chartConfig = {
  Paid: { label: 'Paid', color: 'hsl(var(--chart-2))' },
  Owed: { label: 'Owed', color: 'hsl(var(--chart-4))' },
  Estimate: { label: 'Estimate', color: 'hsl(var(--chart-1))' },
  'No Charge': { label: 'No Charge', color: 'hsl(var(--muted))' },
};

export default function StatusBreakdownChart({ data }: StatusBreakdownChartProps) {
  const totalValue = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.value, 0);
  }, [data]);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Job Status Breakdown</CardTitle>
        <CardDescription>Distribution of all service records by status.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px]">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              strokeWidth={5}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={chartConfig[entry.name as keyof typeof chartConfig]?.color || 'hsl(var(--muted))'}
                />
              ))}
            </Pie>
             <ChartLegend content={<ChartLegendContent />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
