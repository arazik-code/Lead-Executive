import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { day: "Day 1", leads: 4, qualified: 3 },
  { day: "Day 2", leads: 7, qualified: 5 },
  { day: "Day 3", leads: 5, qualified: 4 },
  { day: "Day 4", leads: 9, qualified: 7 },
  { day: "Day 5", leads: 6, qualified: 5 },
  { day: "Day 6", leads: 11, qualified: 9 },
  { day: "Day 7", leads: 8, qualified: 7 },
];

export function LeadChart() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          Lead Volume
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(187, 60%, 45%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(187, 60%, 45%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorQualified" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(158, 60%, 40%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(158, 60%, 40%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(220, 14%, 18%)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fill: "hsl(210, 12%, 50%)", fontSize: 11 }}
                axisLine={{ stroke: "hsl(220, 14%, 18%)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "hsl(210, 12%, 50%)", fontSize: 11 }}
                axisLine={{ stroke: "hsl(220, 14%, 18%)" }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(220, 16%, 11%)",
                  border: "1px solid hsl(220, 14%, 18%)",
                  borderRadius: "6px",
                  color: "hsl(210, 20%, 96%)",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "hsl(210, 20%, 96%)" }}
              />
              <Area
                type="monotone"
                dataKey="leads"
                stroke="hsl(187, 60%, 45%)"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorLeads)"
                name="Total Leads"
              />
              <Area
                type="monotone"
                dataKey="qualified"
                stroke="hsl(158, 60%, 40%)"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorQualified)"
                name="Qualified"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex items-center justify-center gap-5 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-accent" />
            <span className="text-muted-foreground">Total Leads</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-success" />
            <span className="text-muted-foreground">Qualified</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
