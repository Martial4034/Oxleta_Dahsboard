"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";

interface OfferCount {
  name: string;
  count: number;
  clients: string[];
}

interface WeekData {
  weekNumber: number;
  data: OfferCount[];
  total: number;
}

// Ajout d'une interface pour le comptage des clients
interface ClientCount {
  [client: string]: number;
}

export function OfferChart() {
  const [weeksData, setWeeksData] = useState<WeekData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string>("current");

  const getCurrentWeek = () => {
    const today = new Date();
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    const pastDaysOfYear =
      (today.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  useEffect(() => {
    const fetchWeeksData = async () => {
      try {
        const currentWeek = getCurrentWeek();
        const weeks = [currentWeek, currentWeek + 1, currentWeek + 2];
        const results = await Promise.all(
          weeks.map(async (week) => {
            const response = await fetch(`/api/offer-stats?weekNumber=${week}`);
            if (!response.ok) {
              throw new Error(`Failed to fetch statistics for week ${week}`);
            }
            const data = await response.json();
            const formattedData = [
              {
                name: "Premium 1",
                count: data["Premium 1"].count || 0,
                clients: data["Premium 1"].clients || [],
              },
              {
                name: "Gold 1",
                count: data["Gold 1"].count || 0,
                clients: data["Gold 1"].clients || [],
              },
              {
                name: "Gold 2",
                count: data["Gold 2"].count || 0,
                clients: data["Gold 2"].clients || [],
              },
              {
                name: "Silver 1",
                count: data["Silver 1"].count || 0,
                clients: data["Silver 1"].clients || [],
              },
              {
                name: "Silver 2",
                count: data["Silver 2"].count || 0,
                clients: data["Silver 2"].clients || [],
              },
              {
                name: "Silver 3",
                count: data["Silver 3"].count || 0,
                clients: data["Silver 3"].clients || [],
              },
            ];
            const total = formattedData.reduce(
              (sum, item) => sum + item.count,
              0
            );
            return { weekNumber: week, data: formattedData, total };
          })
        );
        setWeeksData(results);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeeksData();
  }, []);

  const chartConfig = {
    count: {
      label: "Count",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  // Composant personnalisé pour le tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      // Compter les occurrences de chaque client
      const clientCounts = data.clients.reduce(
        (acc: ClientCount, client: string) => {
          acc[client] = (acc[client] || 0) + 1;
          return acc;
        },
        {}
      );

      return (
        <div className="p-4 bg-white border rounded-lg shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="mb-2 text-sm text-muted-foreground">
            Total: {data.count}
          </p>
          {Object.keys(clientCounts).length > 0 && (
            <div className="space-y-1">
              {Object.entries(clientCounts).map(([client, count], index) => (
                <p key={index} className="text-sm text-muted-foreground">
                  {client}: {count as number}
                </p>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </CardHeader>
        <CardContent className="h-[350px]">
          <Skeleton className="w-full h-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-[350px] text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Offer Distribution</CardTitle>
        <CardDescription>Next 3 weeks overview</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue="current"
          value={selectedWeek}
          onValueChange={setSelectedWeek}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            {weeksData.map((week, index) => (
              <TabsTrigger
                key={week.weekNumber}
                value={index === 0 ? "current" : `week${week.weekNumber}`}
                className="relative"
              >
                Week {week.weekNumber}
                {week.total > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground z-50">
                    {week.total}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          {weeksData.map((week, index) => (
            <TabsContent
              key={week.weekNumber}
              value={index === 0 ? "current" : `week${week.weekNumber}`}
            >
              <ChartContainer config={chartConfig}>
                <BarChart
                  data={week.data}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 30,
                    bottom: 20,
                  }}
                  className="w-full"
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <ChartTooltip cursor={false} content={<CustomTooltip />} />
                  <Bar
                    dataKey="count"
                    fill="var(--color-count)"
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList
                      dataKey="count"
                      position="top"
                      offset={10}
                      className="fill-foreground"
                      fontSize={12}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="leading-none text-muted-foreground">
          Total offers for week{" "}
          {
            weeksData[parseInt(selectedWeek.replace(/\D/g, "")) || 0]
              ?.weekNumber
          }
          :{" "}
          <span className="font-medium text-foreground">
            {weeksData[parseInt(selectedWeek.replace(/\D/g, "")) || 0]?.total ||
              0}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
