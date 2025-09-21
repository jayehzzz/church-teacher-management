"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTotals } from "@/services/dashboard";
import { listServices } from "@/services/services";
import type { ServiceRecord } from "@/types/service";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Select, Label, Button, Skeleton } from "@/components/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, Legend } from "recharts";

export default function DashboardPage() {
  const { data: totalsData, isLoading: loadingTotals } = useQuery({ queryKey: ["totals"], queryFn: fetchTotals });
  const { data: services, isLoading: loadingServices } = useQuery<ServiceRecord[]>({ queryKey: ["services"], queryFn: listServices });

  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  const years = useMemo(() => {
    const set = new Set<number>();
    ((services ?? []) as ServiceRecord[]).forEach((s) => {
      const y = Number((s.service_date ?? "").slice(0, 4));
      if (Number.isFinite(y)) set.add(y);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [services]);

  const months = [
    { value: "1", label: "Jan" },
    { value: "2", label: "Feb" },
    { value: "3", label: "Mar" },
    { value: "4", label: "Apr" },
    { value: "5", label: "May" },
    { value: "6", label: "Jun" },
    { value: "7", label: "Jul" },
    { value: "8", label: "Aug" },
    { value: "9", label: "Sep" },
    { value: "10", label: "Oct" },
    { value: "11", label: "Nov" },
    { value: "12", label: "Dec" },
  ];

  function toIsoDate(d: Date) {
    const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return tz.toISOString().slice(0, 10);
  }

  function formatDateUK(iso: string): string {
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    try {
      const d = new Date(iso);
      if (!isNaN(d.getTime())) {
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
      }
    } catch {}
    return iso;
  }

  const filtered = useMemo(() => {
    const list = ((services ?? []) as ServiceRecord[]).slice().sort((a, b) => a.service_date.localeCompare(b.service_date));
    return list.filter((s) => {
      const yearOk = selectedYear === "all" ? true : s.service_date.startsWith(`${selectedYear}-`);
      const monthOk = selectedMonth === "all" ? true : s.service_date.slice(5, 7) === String(selectedMonth).padStart(2, "0");
      return yearOk && monthOk;
    });
  }, [services, selectedMonth, selectedYear]);

  const summary = useMemo(() => {
    const totalServices = filtered.length;
    let sumAttendance = 0;
    let totalConverts = 0;
    let totalFirstTimers = 0;
    for (const s of filtered) {
      const inferredFirstTimers = (s.first_timers?.length ?? (s.attendance_first_timers ?? 0));
      const attendance = (s.attendees?.length ?? 0) + inferredFirstTimers;
      sumAttendance += attendance;
      totalConverts += s.converts ?? 0;
      totalFirstTimers += inferredFirstTimers;
    }
    const avgAttendance = totalServices > 0 ? Math.round(sumAttendance / totalServices) : 0;
    return { totalServices, avgAttendance, totalConverts, totalFirstTimers };
  }, [filtered]);

  const chartData = useMemo(() => {
    return filtered.map((s) => {
      const inferredFirstTimers = (s.first_timers?.length ?? (s.attendance_first_timers ?? 0));
      return {
        date: s.service_date,
        total: (s.attendees?.length ?? 0) + inferredFirstTimers,
        firstTimers: inferredFirstTimers,
        converts: s.converts ?? 0,
      };
    });
  }, [filtered]);

  function setThisMonth() {
    const now = new Date();
    setSelectedYear(String(now.getFullYear()));
    setSelectedMonth(String(now.getMonth() + 1));
  }

  function setThisYear() {
    const now = new Date();
    setSelectedYear(String(now.getFullYear()));
    setSelectedMonth("all");
  }

  function clearFilters() {
    setSelectedMonth("all");
    setSelectedYear("all");
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" />

      {loadingTotals ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent><Skeleton className="h-6 w-24" /><div className="mt-3"><Skeleton className="h-8 w-16" /></div></CardContent></Card>
          <Card><CardContent><Skeleton className="h-6 w-28" /><div className="mt-3"><Skeleton className="h-8 w-16" /></div></CardContent></Card>
          <Card><CardContent><Skeleton className="h-6 w-24" /><div className="mt-3"><Skeleton className="h-8 w-16" /></div></CardContent></Card>
          <Card><CardContent><Skeleton className="h-6 w-20" /><div className="mt-3"><Skeleton className="h-8 w-16" /></div></CardContent></Card>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Contacts" value={totalsData?.totalContacts ?? 0} />
          <StatCard label="Members" value={totalsData?.totalMembers ?? 0} />
          <StatCard label="First Timers" value={totalsData?.totalFirstTimers ?? 0} />
          <StatCard label="Services" value={totalsData?.totalServices ?? 0} />
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="font-medium">Sunday Services - Visual Dashboard</div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label>Month</Label>
                <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="mt-1">
                  <option value="all">All</option>
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Year</Label>
                <Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="mt-1">
                  <option value="all">All</option>
                  {years.map((y) => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button type="button" onClick={setThisMonth}>This Month</Button>
                <Button type="button" onClick={setThisYear}>This Year</Button>
                <Button type="button" onClick={clearFilters}>Clear</Button>
              </div>
            </div>

            {loadingServices ? (
              <div className="text-sm text-neutral-500">Loading services...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent>
                      <div className="text-sm text-neutral-500">Services in Period</div>
                      <div className="text-3xl font-semibold">{summary.totalServices}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent>
                      <div className="text-sm text-neutral-500">Avg Attendance</div>
                      <div className="text-3xl font-semibold">{summary.avgAttendance}</div>
                      <div className="text-xs text-neutral-400">Per service</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent>
                      <div className="text-sm text-neutral-500">First Timers</div>
                      <div className="text-3xl font-semibold">{summary.totalFirstTimers}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent>
                      <div className="text-sm text-neutral-500">Converts</div>
                      <div className="text-3xl font-semibold">{summary.totalConverts}</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <div className="font-medium">Attendance Trend</div>
                    </CardHeader>
                    <CardContent style={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={formatDateUK} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                          <Tooltip labelFormatter={(v) => formatDateUK(String(v))} />
                          <Legend />
                          <Line type="monotone" dataKey="total" name="Total" stroke="var(--metric-total)" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="firstTimers" name="First Timers" stroke="var(--metric-firstTimers)" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <div className="font-medium">Converts per Service</div>
                    </CardHeader>
                    <CardContent style={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={formatDateUK} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                          <Tooltip labelFormatter={(v) => formatDateUK(String(v))} />
                          <Legend />
                          <Bar dataKey="converts" name="Converts" fill="#a78bfa" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="hover:scale-105 transition-transform duration-200">
      <CardContent>
        <div className="text-sm mb-2" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
        <div className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>{value}</div>
      </CardContent>
    </Card>
  );
}


