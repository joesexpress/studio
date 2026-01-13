'use client';

import * as React from 'react';
import { Bar, BarChart, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { TechnicianPerformance } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type TechnicianPerformanceChartProps = {
  data: TechnicianPerformance[];
};

export default function TechnicianPerformanceChart({ data }: TechnicianPerformanceChartProps) {
  const chartConfigJobs = {
    totalJobs: { label: 'Jobs', color: 'hsl(var(--primary))' },
  };
  const chartConfigRevenue = {
    totalRevenue: { label: 'Revenue', color: 'hsl(var(--accent))' },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Technician Performance</CardTitle>
        <CardDescription>Comparison of jobs and revenue by technician.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="revenue">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="revenue">By Revenue</TabsTrigger>
            <TabsTrigger value="jobs">By Jobs</TabsTrigger>
          </TabsList>
          <TabsContent value="revenue">
            <ChartContainer config={chartConfigRevenue} className="h-[250px] w-full">
              <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="technician"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  width={80}
                />
                <Tooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="totalRevenue" layout="vertical" radius={4} fill="var(--color-totalRevenue)" />
              </BarChart>
            </ChartContainer>
          </TabsContent>
          <TabsContent value="jobs">
            <ChartContainer config={chartConfigJobs} className="h-[250px] w-full">
              <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="technician"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  width={80}
                />
                <Tooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="totalJobs" layout="vertical" radius={4} fill="var(--color-totalJobs)" />
              </BarChart>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
