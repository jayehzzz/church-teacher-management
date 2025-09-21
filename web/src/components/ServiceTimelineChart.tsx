"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, LabelList, ReferenceLine } from "recharts";
import type { ServiceRecord } from "@/types/service";

interface ServiceTimelineChartProps {
  services: ServiceRecord[];
  className?: string;
}

type ViewMode = "month" | "week";
type FilterType = "total" | "adults" | "children" | "firstTimers" | "converts" | "tithers";
type SortMode = "date" | "value" | "alphabetical";
type DisplayMode = "average" | "total";
type ComparisonMode = boolean;
type SeriesModeMap = Partial<Record<FilterType, DisplayMode>>;

interface ChartDataPoint {
  period: string;
  total: number;
  adults: number;
  children: number;
  firstTimers: number;
  converts: number;
  tithers: number;
  serviceCount?: number; // Number of services in this period (for calculating averages)
}

const FILTER_CONFIG = {
  total: { label: "Total Attendance", cssVar: "--metric-total", key: "total" as const, active: true },
  adults: { label: "Adults", cssVar: "--metric-adults", key: "adults" as const, active: true },
  children: { label: "Children", cssVar: "--metric-children", key: "children" as const, active: true },
  firstTimers: { label: "First-Timers", cssVar: "--metric-firstTimers", key: "firstTimers" as const, active: true },
  converts: { label: "Converts", cssVar: "--metric-converts", key: "converts" as const, active: true },
  tithers: { label: "Tithers", cssVar: "--metric-tithers", key: "tithers" as const, active: true },
} as const;

export default function ServiceTimelineChart({ services, className = "" }: ServiceTimelineChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [sortMode, setSortMode] = useState<SortMode>("date");
  const [selectedMetrics, setSelectedMetrics] = useState<FilterType[]>(["total"]);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("average");
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [seriesModes, setSeriesModes] = useState<SeriesModeMap>({});

  const chartWrapRef = useRef<HTMLDivElement | null>(null);
  const fullscreenChartWrapRef = useRef<HTMLDivElement | null>(null);

  const getSeriesMode = (metric: FilterType): DisplayMode => {
    return (seriesModes[metric] ?? displayMode) as DisplayMode;
  };

  const getPointValue = (point: ChartDataPoint, metric: FilterType, mode: DisplayMode): number => {
    const base = (point as any)[metric] as number;
    if (mode === "average" && viewMode === "month") {
      const count = point.serviceCount || 1;
      return Math.round(base / count);
    }
    return base;
  };

  // 1) Aggregate per-period data (sums + serviceCount)
  const aggregatedData = useMemo(() => {
    if (!services.length) return [] as ChartDataPoint[];

    const sortedServices = [...services].sort((a, b) => a.service_date.localeCompare(b.service_date));
    const dataMap = new Map<string, ChartDataPoint>();

    sortedServices.forEach((service) => {
      const date = new Date(service.service_date);
      let period: string;

      if (viewMode === "month") {
        period = date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
      } else {
        const startOfWeek = new Date(date);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        period = startOfWeek.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }

      if (!dataMap.has(period)) {
        dataMap.set(period, {
          period,
          total: 0,
          adults: 0,
          children: 0,
          firstTimers: 0,
          converts: 0,
          tithers: 0,
          serviceCount: 0,
        });
      }

      const point = dataMap.get(period)!;
      const firstTimersCount = service.first_timers?.length ?? service.attendance_first_timers ?? 0;
      const totalAttendance = (service.attendees?.length ?? 0) + firstTimersCount;

      if (viewMode === "month") {
        point.total += totalAttendance;
        point.adults += service.attendance_adults ?? 0;
        point.children += service.attendance_children ?? 0;
        point.firstTimers += firstTimersCount;
        point.converts += service.converts ?? 0;
        point.tithers += service.tithers ?? 0;
        point.serviceCount = (point.serviceCount ?? 0) + 1;
      } else {
        // Assume one service per week; use max to be safe
        point.total = Math.max(point.total, totalAttendance);
        point.adults = Math.max(point.adults, service.attendance_adults ?? 0);
        point.children = Math.max(point.children, service.attendance_children ?? 0);
        point.firstTimers = Math.max(point.firstTimers, firstTimersCount);
        point.converts = Math.max(point.converts, service.converts ?? 0);
        point.tithers = Math.max(point.tithers, service.tithers ?? 0);
        point.serviceCount = Math.max(point.serviceCount ?? 0, 1);
      }
    });

    return Array.from(dataMap.values());
  }, [services, viewMode]);

  // 2) Build total and average datasets
  const { totalData, averageData } = useMemo(() => {
    const toAverage = (points: ChartDataPoint[]) =>
      points.map((p) => {
        const count = p.serviceCount || 1;
        return viewMode === "month"
          ? {
              ...p,
              total: Math.round(p.total / count),
              adults: Math.round(p.adults / count),
              children: Math.round(p.children / count),
              firstTimers: Math.round(p.firstTimers / count),
              converts: Math.round(p.converts / count),
              tithers: Math.round(p.tithers / count),
            }
          : { ...p };
      });

    const sortData = (data: ChartDataPoint[]) => {
      const d = [...data];
    if (sortMode === "date") {
        d.sort((a, b) => {
          const dateA = viewMode === "month" ? new Date(a.period + " 01") : new Date(a.period);
          const dateB = viewMode === "month" ? new Date(b.period + " 01") : new Date(b.period);
        return dateA.getTime() - dateB.getTime();
      });
    } else if (sortMode === "value") {
        const primary = selectedMetrics[0] ?? "total";
        d.sort((a, b) => b[primary] - a[primary]);
    } else if (sortMode === "alphabetical") {
        d.sort((a, b) => a.period.localeCompare(b.period));
      }
      return d;
    };

    const totalsSorted = sortData(aggregatedData);
    const avgUnsorted = toAverage(aggregatedData);

    // Align average ordering to totals for easier side-by-side comparison
    const periodOrder = totalsSorted.map((p) => p.period);
    const avgSorted = [...avgUnsorted].sort((a, b) => periodOrder.indexOf(a.period) - periodOrder.indexOf(b.period));

    return { totalData: totalsSorted, averageData: avgSorted };
  }, [aggregatedData, sortMode, selectedMetrics, viewMode]);

  // 3) Overall reference for current primary metric and its mode
  const referenceMixed = useMemo(() => {
    if (viewMode !== "month" || totalData.length === 0) return null;
    const primary = selectedMetrics[0] ?? "total";
    const mode = getSeriesMode(primary);
    const sum = totalData.reduce((acc, p) => acc + getPointValue(p, primary, mode), 0);
    const value = totalData.length > 0 ? sum / totalData.length : 0;
    const label = `${mode === "average" ? "Avg" : "Avg"}: ${Math.round(value)}`;
    return { value, label } as const;
  }, [totalData, viewMode, selectedMetrics, seriesModes, displayMode]);

  const selectMetric = (metric: FilterType) => {
    if (!comparisonMode) {
      setSelectedMetrics([metric]);
      return;
    }
    setSelectedMetrics((prev) => {
      const has = prev.includes(metric);
      if (has) {
        const next = prev.filter((m) => m !== metric);
        return next.length ? next : [metric];
      }
      return [...prev, metric];
    });
  };

  const getMetricLabel = (metric: FilterType) => {
    const baseLabel = FILTER_CONFIG[metric].label;
    if (displayMode === "average") {
      return `Avg ${baseLabel}`;
    }
    return baseLabel;
  };

  const formatTooltipLabel = (label: string) => {
    if (viewMode === "month") {
      return `Month: ${label}`;
    } else {
      return `Week of: ${label}`;
    }
  };

  const renderChart = (
    data: ChartDataPoint[],
    reference: { value: number; label: string } | null
  ) => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 40, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis 
          dataKey="period" 
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} 
          stroke="var(--border)"
          angle={viewMode === "week" ? -45 : 0}
          textAnchor={viewMode === "week" ? "end" : "middle"}
          height={viewMode === "week" ? 60 : 30}
        />
        <YAxis 
          allowDecimals={false} 
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} 
          stroke="var(--border)" 
        />
        <Tooltip 
          labelFormatter={formatTooltipLabel}
          contentStyle={{
            backgroundColor: 'var(--popover)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            color: 'var(--popover-foreground)'
          }}
        />
        <Legend />
        {selectedMetrics.map((metric) => {
          const mode = getSeriesMode(metric);
          const name = mode === "average" ? `Avg ${FILTER_CONFIG[metric].label}` : FILTER_CONFIG[metric].label;
          const dataKeyFn = (entry: any) => getPointValue(entry, metric, mode);
          return (
          <Bar
            key={metric}
            dataKey={dataKeyFn as any}
            name={name}
            fill={`var(${FILTER_CONFIG[metric].cssVar})`}
          >
            <LabelList
              dataKey={dataKeyFn as any}
              position="top"
              style={{ fill: 'var(--card-foreground)', fontSize: '12px', fontWeight: 'bold' }}
            />
          </Bar>
        );
        })}
        {viewMode === "month" && reference !== null && (
          <ReferenceLine 
            y={reference.value}
            stroke="var(--destructive)" 
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{ 
              value: reference.label,
              position: "topRight",
              style: { fill: 'var(--destructive)', fontSize: '12px', fontWeight: 'bold' }
            }}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );

  async function copyChartFrom(refEl: HTMLDivElement | null) {
    try {
      if (!refEl) throw new Error("Chart not ready");
      const svg = refEl.querySelector(".recharts-wrapper svg") as SVGSVGElement | null;
      if (!svg) throw new Error("SVG not found");
      const clone = svg.cloneNode(true) as SVGSVGElement;
      const rect = svg.getBoundingClientRect();
      const width = Math.ceil(rect.width || Number(svg.getAttribute("width")) || 1000);
      const height = Math.ceil(rect.height || Number(svg.getAttribute("height")) || 600);
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      clone.setAttribute("width", String(width));
      clone.setAttribute("height", String(height));
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clone);
      const img = new Image();
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      const bg = getComputedStyle(refEl).backgroundColor || "#ffffff";
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          try {
            ctx.drawImage(img, 0, 0, width, height);
            resolve();
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = reject as any;
        img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);
      });
      const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/png"));
      if (blob && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ "image/png": blob })
        ]);
      } else {
        await navigator.clipboard.writeText(canvas.toDataURL("image/png"));
      }
      // Optional: brief visual feedback could be added here later
    } catch (err) {
      console.warn("Copy chart failed:", err);
      try {
        await navigator.clipboard.writeText("Copy failed. Try screenshot.");
      } catch {}
    }
  }

  const renderMetricButtons = (prefix: string) => (
    <>
      <div className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>Filters</div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(FILTER_CONFIG).map(([key, config]) => (
          <button
            key={`${prefix}-metric-${key}`}
            onClick={() => selectMetric(key as FilterType)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedMetrics.includes(key as FilterType)
                ? "text-white shadow-lg"
                : ""
            }`}
            style={{
              backgroundColor: selectedMetrics.includes(key as FilterType) ? `var(${(config as any).cssVar})` : "var(--muted)",
              color: selectedMetrics.includes(key as FilterType) ? "var(--card-foreground)" : "var(--muted-foreground)",
            }}
          >
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: `var(${(config as any).cssVar})` }}
            />
            {config.label}
          </button>
        ))}
      </div>
    </>
  );

  const renderSelectedSeriesControls = (prefix: string) => (
    selectedMetrics.length > 0 ? (
      <div className="mt-3">
        <div className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>Selected series</div>
        <div className="flex flex-wrap gap-3">
          {selectedMetrics.map((metric) => (
            <div
              key={`${prefix}-sel-${metric}`}
              className="flex items-center gap-3 rounded-md px-3 py-2 border"
              style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}
            >
              <span className="inline-flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: FILTER_CONFIG[metric].color }} />
                <span style={{ color: 'var(--card-foreground)', fontWeight: 600 }}>{FILTER_CONFIG[metric].label}</span>
              </span>
              <div className="flex items-center gap-1 rounded-md p-0.5 border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
                <button
                  onClick={() => setSeriesModes((m) => ({ ...m, [metric]: "total" }))}
                  className={`px-2 py-1 rounded text-xs ${getSeriesMode(metric) === "total" ? "text-white" : ""}`}
                  style={{
                    backgroundColor: getSeriesMode(metric) === "total" ? "var(--primary)" : "transparent",
                    color: getSeriesMode(metric) === "total" ? "var(--primary-foreground)" : "var(--muted-foreground)",
                  }}
                >
                  Total
                </button>
                <button
                  onClick={() => setSeriesModes((m) => ({ ...m, [metric]: "average" }))}
                  className={`px-2 py-1 rounded text-xs ${getSeriesMode(metric) === "average" ? "text-white" : ""}`}
                  style={{
                    backgroundColor: getSeriesMode(metric) === "average" ? "var(--primary)" : "transparent",
                    color: getSeriesMode(metric) === "average" ? "var(--primary-foreground)" : "var(--muted-foreground)",
                  }}
                >
                  Average
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    ) : null
  );

  return (
    <div
      className={`rounded-lg p-6 ${className}`}
      style={{
        backgroundColor: "var(--card)",
        color: "var(--card-foreground)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Service Timeline
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </h2>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Sort by:</span>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="text-sm rounded-md px-3 py-1 focus:outline-none"
              style={{
                backgroundColor: "var(--muted)",
                color: "var(--card-foreground)",
                border: "1px solid var(--border)",
              }}
            >
              <option value="date">Date</option>
              <option value="value">Value (High to Low)</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
          
          {/* View Mode Toggle */}
          <div
            className="flex items-center gap-2 rounded-lg p-1"
            style={{ backgroundColor: "var(--muted)" }}
          >
            <button
              onClick={() => setViewMode("month")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "month" 
                  ? "text-white" 
                  : ""
              }`}
              style={{
                backgroundColor:
                  viewMode === "month" ? "var(--primary)" : "transparent",
                color:
                  viewMode === "month"
                    ? "var(--primary-foreground)"
                    : "var(--muted-foreground)",
              }}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "week" 
                  ? "text-white" 
                  : ""
              }`}
              style={{
                backgroundColor:
                  viewMode === "week" ? "var(--primary)" : "transparent",
                color:
                  viewMode === "week"
                    ? "var(--primary-foreground)"
                    : "var(--muted-foreground)",
              }}
            >
              Week
            </button>
          </div>

          {/* Display Mode Toggle (hidden in comparison mode) */}
          {!comparisonMode && (
            <div
              className="flex items-center gap-2 rounded-lg p-1"
              style={{ backgroundColor: "var(--muted)" }}
            >
              <button
                onClick={() => setDisplayMode("total")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  displayMode === "total" ? "text-white" : ""
                }`}
                style={{
                  backgroundColor: displayMode === "total" ? "var(--primary)" : "transparent",
                  color: displayMode === "total" ? "var(--primary-foreground)" : "var(--muted-foreground)",
                }}
              >
                Total
              </button>
              <button
                onClick={() => setDisplayMode("average")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  displayMode === "average" ? "text-white" : ""
                }`}
                style={{
                  backgroundColor: displayMode === "average" ? "var(--primary)" : "transparent",
                  color: displayMode === "average" ? "var(--primary-foreground)" : "var(--muted-foreground)",
                }}
              >
                Average
              </button>
            </div>
          )}

          {/* Comparison Mode Toggle (always on by default) */}
          <button
            onClick={() => {
              setComparisonMode((v) => {
                const next = !v;
                if (!next) {
                  setSelectedMetrics((prev) => [prev[0] ?? "total"]);
                  setSeriesModes({});
                }
                return next;
              });
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors border`}
            style={{
              backgroundColor: comparisonMode ? "var(--primary)" : "transparent",
              color: comparisonMode ? "var(--primary-foreground)" : "var(--muted-foreground)",
              borderColor: "var(--border)",
            }}
          >
            {comparisonMode ? "Comparison On" : "Comparison Mode"}
          </button>
          
          {/* Fullscreen Button */}
          <button className="p-2 text-slate-400 hover:text-white transition-colors" onClick={() => setIsFullscreen(true)} aria-label="Enter fullscreen">
            <span className="sr-only">Toggle fullscreen</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
          <button
            className="p-2 text-slate-400 hover:text-white transition-colors"
            onClick={() => copyChartFrom(chartWrapRef.current)}
            aria-label="Copy chart image"
            title="Copy chart to clipboard"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16h8a2 2 0 002-2V7a2 2 0 00-2-2h-5l-3 3v6a2 2 0 002 2zm-2 4h10a2 2 0 002-2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height: '500px' }} ref={chartWrapRef}>
        {totalData.length === 0 ? (
          <div className="h-full flex items-center justify-center" style={{ color: "var(--muted-foreground)" }}>
            No service data available
          </div>
        ) : (
          renderChart(totalData, referenceMixed)
        )}
      </div>

      {/* Fullscreen overlay */}
      {isFullscreen ? (
        <div className="fixed inset-0 z-[100]" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
          <div className="absolute inset-4 rounded-lg" style={{ backgroundColor: "var(--card)" }}>
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-2 rounded-md"
                style={{ backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }}
                aria-label="Exit fullscreen"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-4.553M19 5h-4m4 0v4M9 14l-4.553 4.553M5 19h4m-4 0v-4" />
                </svg>
              </button>
              <button
                onClick={() => copyChartFrom(fullscreenChartWrapRef.current)}
                className="p-2 rounded-md"
                style={{ backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }}
                aria-label="Copy chart"
                title="Copy chart to clipboard"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16h8a2 2 0 002-2V7a2 2 0 00-2-2h-5l-3 3v6a2 2 0 002 2zm-2 4h10a2 2 0 002-2" />
                </svg>
              </button>
            </div>
            <div className="w-full h-full p-4">
              {totalData.length === 0 ? (
                <div className="h-full flex items-center justify-center" style={{ color: "var(--muted-foreground)" }}>
                  No service data available
                </div>
              ) : (
                <div className="w-full h-full" ref={fullscreenChartWrapRef}>
                  {renderChart(totalData, referenceMixed)}
                  {/* Controls duplicated for fullscreen */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                      {renderMetricButtons('fs')}
                      {comparisonMode ? renderSelectedSeriesControls('fs') : null}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
      </div>
      ) : null}

      {/* Filters Area */}
      <div className="mt-6">
        {renderMetricButtons("main")}
        {/* Help + Summary */}
        <div className="mt-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
          Tip: Select multiple filters. Selected series appear below with their own Total/Average toggle. The first selected series controls sorting and the red reference line.
        </div>
        {comparisonMode ? renderSelectedSeriesControls("main") : null}
      </div>

      {comparisonMode && selectedMetrics.length > 0 ? (
        <div className="flex flex-wrap gap-2 mt-3">
          {selectedMetrics.map((metric) => (
            <div key={metric} className="flex items-center gap-2 rounded-lg p-1" style={{ backgroundColor: "var(--muted)" }}>
              <span className="px-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {FILTER_CONFIG[metric].label}
              </span>
              <button
                onClick={() => setSeriesModes((m) => ({ ...m, [metric]: "total" }))}
                className={`px-2 py-1 rounded text-xs ${getSeriesMode(metric) === "total" ? "text-white" : ""}`}
                style={{
                  backgroundColor: getSeriesMode(metric) === "total" ? "var(--primary)" : "transparent",
                  color: getSeriesMode(metric) === "total" ? "var(--primary-foreground)" : "var(--muted-foreground)",
                }}
              >
                Total
              </button>
              <button
                onClick={() => setSeriesModes((m) => ({ ...m, [metric]: "average" }))}
                className={`px-2 py-1 rounded text-xs ${getSeriesMode(metric) === "average" ? "text-white" : ""}`}
                style={{
                  backgroundColor: getSeriesMode(metric) === "average" ? "var(--primary)" : "transparent",
                  color: getSeriesMode(metric) === "average" ? "var(--primary-foreground)" : "var(--muted-foreground)",
                }}
              >
                Average
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
