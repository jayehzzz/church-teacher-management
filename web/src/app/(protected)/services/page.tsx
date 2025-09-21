"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button, Input, Label, Select } from "@/components/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { Plus, Upload, Download, Copy, X, ChevronLeft, ChevronRight, User } from "lucide-react";
import ServiceTimelineChart from "@/components/ServiceTimelineChart";
import { listMembers, syncMemberFromService } from "@/services/members";
import { createService, listServices, removeService, updateService, getService } from "@/services/services";
import type { MemberRecord } from "@/types/member";
import type { FirstTimerInline, ServiceRecord, ServiceType } from "@/types/service";
import { computeAttendanceMetrics } from "@/types/service";
import { getFirebaseStorage } from "@/lib/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

function RowImageUpload({ service }: { service: ServiceRecord }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function uploadImagesAndAttach(files: File[]) {
    if (!files.length) return;
    setErrorMsg("");
    setBusy(true);
    try {
      const storage = getFirebaseStorage();
      const dateFolder = service.service_date || new Date().toISOString().slice(0, 10);
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
        const unique = (typeof crypto !== "undefined" && (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}_${i}`);
        const path = `services/${dateFolder}/${unique}_${safeName}`;
        const r = storageRef(storage, path);
        const snap = await uploadBytes(r, file);
        const url = await getDownloadURL(snap.ref);
        urls.push(url);
      }
      const merged = Array.from(new Set([...(service.service_image_refs ?? []), ...urls]));
      await updateService(service.id, { service_image_refs: merged });
      qc.invalidateQueries({ queryKey: ["services"] });
    } catch (err: any) {
      setErrorMsg(err?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  }

  function onPick() {
    inputRef.current?.click();
  }

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) {
      await uploadImagesAndAttach(files);
    }
    e.target.value = "";
  }

  return (
    <span className="inline-flex items-center gap-2">
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={onChange} />
      <button type="button" onClick={onPick} disabled={busy} className="underline" style={{ color: 'var(--accent)' }}>
        {busy ? "Uploading..." : "Upload Images"}
      </button>
      {errorMsg ? <span className="text-xs text-red-600">{errorMsg}</span> : null}
    </span>
  );
}

const schema = z.object({
  service_date: z.string().min(1, "Date is required"),
  topic: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  service_type: z.enum(["Sunday service", "Bacenta", "Special event", "Other"]).optional(),
  attendance_adults: z.string().optional().or(z.literal("")),
  attendance_children: z.string().optional().or(z.literal("")),
  converts: z.string().optional().or(z.literal("")),
  tithers: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export default function ServicesPage() {
  const qc = useQueryClient();

  const { data: members, isLoading: loadingMembers } = useQuery({
    queryKey: ["members"],
    queryFn: listMembers,
  });
  const { data: services, isLoading: loadingServices } = useQuery({
    queryKey: ["services"],
    queryFn: listServices,
  });

  // Bulk cleanup state to prevent repeated cleanup
  const [bulkCleanupDone, setBulkCleanupDone] = useState(false);
  
  // Bulk cleanup of duplicate entries across all services (runs once per page load)
  useEffect(() => {
    if (services && !loadingServices && !bulkCleanupDone) {
      const servicesList = services as ServiceRecord[];
      const servicesToClean: string[] = [];
      
      servicesList.forEach(service => {
        const attendees = service.attendees ?? [];
        const firstTimers = (service.first_timers ?? []) as FirstTimerInline[];
        
        const firstTimerNames = firstTimers.map(ft => ft.name.toLowerCase());
        const cleanedAttendees = attendees.filter(attendee => !firstTimerNames.includes(attendee.toLowerCase()));
        
        // If we found duplicates, mark this service for cleaning
        if (cleanedAttendees.length !== attendees.length) {
          servicesToClean.push(service.id);
        }
      });
      
      // Clean up services with duplicates
      if (servicesToClean.length > 0) {
        console.log(`Found ${servicesToClean.length} services with duplicate entries. Cleaning up...`);
        
        Promise.all(
          servicesToClean.map(async (serviceId) => {
            const service = servicesList.find(s => s.id === serviceId);
            if (!service) return;
            
            const attendees = service.attendees ?? [];
            const firstTimers = (service.first_timers ?? []) as FirstTimerInline[];
            const firstTimerNames = firstTimers.map(ft => ft.name.toLowerCase());
            const cleanedAttendees = attendees.filter(attendee => !firstTimerNames.includes(attendee.toLowerCase()));
            
            // Only update attendees - updateService will fetch current first_timers and recalculate metrics
            console.log(`Service ${serviceId} - Original attendees: ${attendees.length}, Cleaned attendees: ${cleanedAttendees.length}, First timers: ${firstTimers.length}`);
            await updateService(serviceId, { 
              attendees: cleanedAttendees
            });
          })
        ).then(() => {
          console.log(`Successfully cleaned up ${servicesToClean.length} services`);
          setBulkCleanupDone(true);
          qc.invalidateQueries({ queryKey: ["services"] });
        }).catch(error => {
          console.error("Error during bulk cleanup:", error);
          setBulkCleanupDone(true); // Mark as done even if there was an error to prevent infinite retries
        });
      } else {
        setBulkCleanupDone(true); // No cleanup needed
      }
    }
  }, [services, loadingServices, bulkCleanupDone, qc]);

  const [memberQuery, setMemberQuery] = useState("");
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [firstTimers, setFirstTimers] = useState<FirstTimerInline[]>([]);
  const [firstTimerName, setFirstTimerName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [topicFilter, setTopicFilter] = useState("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [quickRange, setQuickRange] = useState<"week" | "month" | "year" | "last7" | "lastMonth" | "qtd" | "ytd" | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "dashboard">("dashboard");
  const [showColumns, setShowColumns] = useState(false);
  const [columns, setColumns] = useState({
    date: true,
    type: true,
    topic: true,
    total: true,
    firstTimers: true,
    converts: true,
    who: true,
    images: true,
    actions: true,
  });
  const [dateSort, setDateSort] = useState<"asc" | "desc">("desc");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<"all" | ServiceType>("all");
  const [syncingMembers, setSyncingMembers] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; message: string } | null>(null);

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

  const years = useMemo(() => {
    const set = new Set<number>();
    const list = (services as ServiceRecord[] | undefined) ?? [];
    for (const s of list) {
      const y = Number((s.service_date ?? "").slice(0, 4));
      if (Number.isFinite(y)) set.add(y);
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [services]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { service_date: new Date().toISOString().slice(0, 10), service_type: "Sunday service" } });

  // Image upload state and helpers (for create form)
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUploadBusy, setImageUploadBusy] = useState(false);
  const [imageUploadMsg, setImageUploadMsg] = useState<string>("");

  function onSelectImageFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) setImageFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  }

  function removeSelectedImage(name: string) {
    setImageFiles((prev) => prev.filter((f) => f.name !== name));
  }

  async function uploadImagesAndGetUrls(files: File[], serviceDate: string): Promise<string[]> {
    if (!files.length) return [];
    const storage = getFirebaseStorage();
    const dateFolder = serviceDate || new Date().toISOString().slice(0, 10);
    const uploads = files.map(async (file, idx) => {
      const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
      const unique = (typeof crypto !== "undefined" && (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}_${idx}`);
      const path = `services/${dateFolder}/${unique}_${safeName}`;
      const r = storageRef(storage, path);
      const snap = await uploadBytes(r, file);
      const url = await getDownloadURL(snap.ref);
      return url;
    });
    return Promise.all(uploads);
  }

  const createMut = useMutation({
    mutationFn: async (v: FormValues) => {
      const toNum = (val?: string) => (val && val.trim() !== "" ? Number(val) : undefined);
      setImageUploadMsg("");
      setImageUploadBusy(true);
      let imageUrls: string[] = [];
      try {
        imageUrls = await uploadImagesAndGetUrls(imageFiles, v.service_date);
      } catch (err: any) {
        setImageUploadMsg(`Image upload failed: ${err?.message ?? String(err)}`);
      } finally {
        setImageUploadBusy(false);
      }

      // Create the service first
      const serviceId = await createService({
        service_date: v.service_date,
        topic: v.topic || undefined,
        notes: v.notes || undefined,
        service_type: (v.service_type ?? "Sunday service") as ServiceType,
        attendance_adults: toNum(v.attendance_adults),
        attendance_children: toNum(v.attendance_children),
        converts: toNum(v.converts),
        tithers: toNum(v.tithers),
        attendees: selectedAttendees,
        first_timers: firstTimers,
        service_image_refs: imageUrls,
      });

      // Sync attendees to central members database
      try {
        // Sync regular attendees (not first-timers)
        for (const attendeeName of selectedAttendees) {
          await syncMemberFromService(attendeeName, v.service_date, false);
        }
        
        // Sync first-timers as visitors
        for (const firstTimer of firstTimers) {
          await syncMemberFromService(firstTimer.name, v.service_date, true);
        }
      } catch (err) {
        console.warn("Failed to sync some members:", err);
        // Don't fail the whole operation if sync fails
      }

      return serviceId;
    },
    onSuccess: () => {
      reset({ service_date: new Date().toISOString().slice(0, 10), topic: "", notes: "", attendance_adults: "", attendance_children: "", converts: "", tithers: "" });
      setSelectedAttendees([]);
      setFirstTimers([]);
      setImageFiles([]);
      qc.invalidateQueries({ queryKey: ["services"] });
      qc.invalidateQueries({ queryKey: ["members"] }); // Invalidate members to show newly synced members
      qc.invalidateQueries({ queryKey: ["totals"] });
      setShowCreate(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => removeService(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      qc.invalidateQueries({ queryKey: ["totals"] });
    },
  });

  const filteredMembers = useMemo(() => {
    const list = (members as MemberRecord[] | undefined) ?? [];
    if (!memberQuery.trim()) return list;
    const q = memberQuery.toLowerCase();
    return list.filter((m) =>
      (m.full_name ?? `${m.first_name}${m.surname ? ` ${m.surname}` : ""}`).toLowerCase().includes(q) ||
      (m.phone_number ?? "").toLowerCase().includes(q) ||
      (m.email ?? "").toLowerCase().includes(q) ||
      (m.church_role ?? "").toLowerCase().includes(q) ||
      (m.member_type ?? "").toLowerCase().includes(q)
    );
  }, [members, memberQuery]);

  const filteredServices = useMemo(() => {
    const list = (services as ServiceRecord[] | undefined) ?? [];
    return list.filter((s) => {
      const topicOk = topicFilter.trim()
        ? (s.topic ?? "").toLowerCase().includes(topicFilter.toLowerCase())
        : true;
      const fromOk = dateFrom ? s.service_date >= dateFrom : true;
      const toOk = dateTo ? s.service_date <= dateTo : true;
      const yearOk = selectedYear === "all" ? true : s.service_date.startsWith(`${selectedYear}-`);
      const monthOk = selectedMonth === "all" ? true : s.service_date.slice(5, 7) === String(selectedMonth).padStart(2, "0");
      const typeOk = selectedType === "all" ? true : (s.service_type ?? "Sunday service") === selectedType;
      return topicOk && fromOk && toOk && yearOk && monthOk && typeOk;
    });
  }, [services, topicFilter, dateFrom, dateTo, selectedMonth, selectedYear, selectedType]);

  const sortedServices = useMemo(() => {
    const list = [...filteredServices];
    list.sort((a, b) => (dateSort === "asc" ? a.service_date.localeCompare(b.service_date) : b.service_date.localeCompare(a.service_date)));
    return list;
  }, [filteredServices, dateSort]);

  const totals = useMemo(() => {
    const list = filteredServices;
    const totalServices = list.length;
    let sumAttendance = 0;
    let totalConverts = 0;
    let totalFirstTimers = 0;
    const attendanceNumbers = [];
    for (const s of list) {
      const inferredFirstTimers = (s.first_timers?.length ?? (s.attendance_first_timers ?? 0));
      // Use the exact same calculation as the table display
      const attendance = (s.attendees?.length ?? 0) + inferredFirstTimers;
      attendanceNumbers.push(attendance);
      sumAttendance += attendance;
      totalConverts += s.converts ?? 0;
      totalFirstTimers += inferredFirstTimers;
    }
    const avgAttendance = totalServices > 0 ? Math.round(sumAttendance / totalServices) : 0;
    
    return { totalServices, avgAttendance, totalConverts, totalFirstTimers };
  }, [filteredServices]);
  // Ensure Recharts recalculates sizes when showing the dashboard tab
  useEffect(() => {
    if (activeTab === "dashboard") {
      const id = setTimeout(() => {
        if (typeof window !== "undefined") window.dispatchEvent(new Event("resize"));
      }, 50);
      return () => clearTimeout(id);
    }
  }, [activeTab, filteredServices.length]);


  const metrics = useMemo(() => computeAttendanceMetrics(selectedAttendees, firstTimers), [selectedAttendees, firstTimers]);


  useEffect(() => {
    // Ensure no duplicates in attendees
    setSelectedAttendees((prev) => Array.from(new Set(prev)));
  }, [selectedAttendees.length]);

  const toggleAttendee = (fullName: string) => {
    // Check if this person is already a first-timer to prevent double-counting
    const isFirstTimer = firstTimers.some(ft => ft.name.toLowerCase() === fullName.toLowerCase());
    
    if (isFirstTimer && !selectedAttendees.includes(fullName)) {
      alert("This person is already listed as a first-timer. Please remove them from the First Timers section if you want to add them as a regular attendee.");
      return;
    }
    
    setSelectedAttendees((prev) => (prev.includes(fullName) ? prev.filter((n) => n !== fullName) : [...prev, fullName]));
  };

  const addFirstTimer = () => {
    const name = firstTimerName.trim();
    if (!name) return;
    
    // Check if this person is already selected as an attendee to prevent double-counting
    const isAttendee = selectedAttendees.some(attendee => attendee.toLowerCase() === name.toLowerCase());
    
    if (isAttendee) {
      alert("This person is already selected as an attendee. Please uncheck them from the Members section if you want to add them as a first-timer.");
      return;
    }
    
    setFirstTimers((prev) => [...prev, { name, added_at: new Date().toISOString() }]);
    setFirstTimerName("");
  };

  const removeFirstTimer = (name: string) => {
    setFirstTimers((prev) => prev.filter((ft) => ft.name !== name));
  };

  function download(filename: string, data: string, mime = "text/plain") {
    const blob = new Blob([data], { type: mime + ";charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function toCsv(rows: ServiceRecord[]) {
    const header = [
      "service_date",
      "service_type",
      "topic",
      "notes",
      "attendance_adults",
      "attendance_children",
      "converts",
      "tithers",
      "total_attendance",
      "first_timers_count",
    ];
    const lines = [header.join(",")];
    for (const s of rows) {
      const values = [
        s.service_date,
        (s.service_type ?? "Sunday service"),
        (s.topic ?? "").replaceAll(",", " "),
        (s.notes ?? "").replaceAll(",", " "),
        String(s.attendance_adults ?? ""),
        String(s.attendance_children ?? ""),
        String(s.converts ?? ""),
        String(s.tithers ?? ""),
        String((s.attendees?.length ?? 0) + (s.first_timers?.length ?? (s.attendance_first_timers ?? 0))),
        String(s.first_timers?.length ?? (s.attendance_first_timers ?? 0)),
      ];
      lines.push(values.join(","));
    }
    return lines.join("\n");
  }

  async function handleCopyData() {
    const list = filteredServices;
    await navigator.clipboard.writeText(JSON.stringify(list, null, 2));
  }

  function handleExportCsvTop() {
    const csv = toCsv(filteredServices);
    download(`services_export.csv`, csv, "text/csv");
  }

  function toIsoDate(d: Date) {
    const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return tz.toISOString().slice(0, 10);
  }

  function formatDateUK(iso: string): string {
    // iso YYYY-MM-DD -> DD/MM/YYYY
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

  function formatDateHumanUK(iso: string): string {
    // Ex: Sun 06th Feb 2025
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    let d: Date;
    if (m) {
      d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    } else {
      d = new Date(iso);
    }
    if (isNaN(d.getTime())) return iso;
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = days[d.getDay()];
    const date = d.getDate();
    const ord = (n: number) => {
      if (n % 10 === 1 && n % 100 !== 11) return "st";
      if (n % 10 === 2 && n % 100 !== 12) return "nd";
      if (n % 10 === 3 && n % 100 !== 13) return "rd";
      return "th";
    };
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${date}${ord(date)} ${month} ${year}`;
  }

  function applyQuickRange(range: "week" | "month" | "year" | "last7" | "lastMonth" | "qtd" | "ytd") {
    const now = new Date();
    if (range === "week") {
      const day = now.getDay(); // 0 Sun - 6 Sat
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const start = new Date(now);
      start.setDate(now.getDate() + diffToMonday);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      setDateFrom(toIsoDate(start));
      setDateTo(toIsoDate(end));
    } else if (range === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setDateFrom(toIsoDate(start));
      setDateTo(toIsoDate(end));
    } else if (range === "year") {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      setDateFrom(toIsoDate(start));
      setDateTo(toIsoDate(end));
    } else if (range === "last7") {
      const end = new Date(now);
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      setDateFrom(toIsoDate(start));
      setDateTo(toIsoDate(end));
    } else if (range === "lastMonth") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setDateFrom(toIsoDate(start));
      setDateTo(toIsoDate(end));
    } else if (range === "qtd") {
      const qStartMonth = Math.floor(now.getMonth() / 3) * 3; // 0,3,6,9
      const start = new Date(now.getFullYear(), qStartMonth, 1);
      const end = new Date(now);
      setDateFrom(toIsoDate(start));
      setDateTo(toIsoDate(end));
    } else if (range === "ytd") {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now);
      setDateFrom(toIsoDate(start));
      setDateTo(toIsoDate(end));
    }
    setQuickRange(range);
    setSelectedMonth("all");
    setSelectedYear("all");
  }

  function clearQuickRange() {
    setQuickRange(null);
    setDateFrom("");
    setDateTo("");
    setSelectedMonth("all");
    setSelectedYear("all");
  }

  // Bulk sync existing service data to central members
  async function bulkSyncExistingData() {
    if (syncingMembers) return;
    
    const allServices = (services as ServiceRecord[] | undefined) ?? [];
    if (allServices.length === 0) {
      alert("No services found to sync.");
      return;
    }

    // Collect all unique names first to avoid processing duplicates
    const uniqueNames = new Set<string>();
    const nameToFirstService = new Map<string, string>(); // Track earliest service date for each person
    
    for (const service of allServices) {
      // Process attendees
      const attendees = service.attendees ?? [];
      for (const attendeeName of attendees) {
        const normalizedName = attendeeName.trim().toLowerCase();
        if (normalizedName) {
          uniqueNames.add(attendeeName); // Keep original casing
          // Track earliest service date
          if (!nameToFirstService.has(normalizedName) || service.service_date < nameToFirstService.get(normalizedName)!) {
            nameToFirstService.set(normalizedName, service.service_date);
          }
        }
      }
      
      // Process first-timers
      const firstTimers = service.first_timers ?? [];
      for (const firstTimer of firstTimers) {
        const normalizedName = firstTimer.name.trim().toLowerCase();
        if (normalizedName) {
          uniqueNames.add(firstTimer.name); // Keep original casing
          // Track earliest service date
          if (!nameToFirstService.has(normalizedName) || service.service_date < nameToFirstService.get(normalizedName)!) {
            nameToFirstService.set(normalizedName, service.service_date);
          }
        }
      }
    }

    const uniqueNamesArray = Array.from(uniqueNames);
    
    const confirmed = confirm(
      `This will sync ${uniqueNamesArray.length} unique people from ${allServices.length} services to the Central Members database.\n\nDuplicates will be automatically handled. Continue?`
    );
    
    if (!confirmed) return;

    setSyncingMembers(true);
    setSyncProgress({ current: 0, total: uniqueNamesArray.length, message: "Starting sync..." });

    try {
      let currentProgress = 0;
      let syncedCount = 0;
      let errorCount = 0;
      let skippedCount = 0;

      for (const personName of uniqueNamesArray) {
        currentProgress++;
        const normalizedName = personName.trim().toLowerCase();
        const firstServiceDate = nameToFirstService.get(normalizedName) || new Date().toISOString().slice(0, 10);
        
        setSyncProgress({ 
          current: currentProgress, 
          total: uniqueNamesArray.length, 
          message: `Processing: ${personName}` 
        });
        
        try {
          // Check if this person was ever a first-timer across all services
          let wasFirstTimer = false;
          for (const service of allServices) {
            const firstTimers = service.first_timers ?? [];
            if (firstTimers.some(ft => ft.name.toLowerCase().trim() === personName.toLowerCase().trim())) {
              wasFirstTimer = true;
              break;
            }
          }
          
          const result = await syncMemberFromService(personName, firstServiceDate, wasFirstTimer);
          if (result) {
            syncedCount++;
          } else {
            skippedCount++; // Already existed
          }
        } catch (err) {
          console.warn(`Failed to sync ${personName}:`, err);
          errorCount++;
        }
      }

      // Refresh members data
      qc.invalidateQueries({ queryKey: ["members"] });

      setSyncProgress({ 
        current: uniqueNamesArray.length, 
        total: uniqueNamesArray.length, 
        message: `Sync complete! ${syncedCount} new, ${skippedCount} existing, ${errorCount} errors` 
      });

      setTimeout(() => {
        setSyncProgress(null);
        setSyncingMembers(false);
        alert(`Bulk sync completed!\n\nNew members created: ${syncedCount}\nExisting members updated: ${skippedCount}\nErrors: ${errorCount}\n\nCheck the Central Members section to see all members.`);
      }, 2000);

    } catch (err) {
      console.error("Bulk sync failed:", err);
      alert("Bulk sync failed. Please try again.");
      setSyncProgress(null);
      setSyncingMembers(false);
    }
  }

  // -------------------- CSV Import (Sunday Service Log) --------------------
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    created: number;
    updated: number;
    skipped: number;
    errors: number;
    messages: string[];
  } | null>(null);
  const [importPreview, setImportPreview] = useState<AggregatedService[] | null>(null);
  const [importMapping, setImportMapping] = useState<{ label: string; found: boolean }[] | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [performingImport, setPerformingImport] = useState(false);

  function triggerImport() {
    fileInputRef.current?.click();
  }

  function normalizeHeader(header: string): string {
    return header
      .trim()
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\s+/g, " ");
  }

  function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result.map((v) => v.trim());
  }

  function parseCsv(text: string): string[][] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return [];
    return lines.map(parseCsvLine);
  }

  function parseNumber(value?: string): number | undefined {
    if (!value) return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const n = Number(trimmed.replace(/,/g, ""));
    return Number.isFinite(n) ? n : undefined;
  }

  function toIsoFromAny(dateStr?: string): string | undefined {
    if (!dateStr) return undefined;
    const s = dateStr.trim();
    if (!s) return undefined;
    // Handle already-ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    // Try formats with weekday + ordinal + month name e.g., "Sunday 23rd March 2025" or without weekday "23rd March 2025"
    const months: Record<string, number> = {
      jan: 1, january: 1,
      feb: 2, february: 2,
      mar: 3, march: 3,
      apr: 4, april: 4,
      may: 5,
      jun: 6, june: 6,
      jul: 7, july: 7,
      aug: 8, august: 8,
      sep: 9, sept: 9, september: 9,
      oct: 10, october: 10,
      nov: 11, november: 11,
      dec: 12, december: 12,
    };
    let mFull = s.match(/^(?:sun|mon|tue|wed|thu|fri|sat|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\s+(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})$/i);
    if (!mFull) mFull = s.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})$/i);
    if (mFull) {
      const dd = String(Number(mFull[1])).padStart(2, "0");
      const monKey = mFull[2].toLowerCase();
      const mi = months[monKey];
      const yyyy = mFull[3];
      if (mi) return `${yyyy}-${String(mi).padStart(2, "0")}-${dd}`;
    }
    // Try slash format and disambiguate: prefer UK (DD/MM/YYYY), but if second part > 12, treat as US (MM/DD/YYYY)
    const sm = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (sm) {
      const a = Number(sm[1]);
      const b = Number(sm[2]);
      const yyyy = sm[3];
      let dd: string;
      let mm: string;
      if (b > 12 && a <= 12) {
        // Clearly US M/D/YYYY
        mm = String(a).padStart(2, "0");
        dd = String(b).padStart(2, "0");
      } else {
        // Prefer UK D/M/YYYY
        dd = String(a).padStart(2, "0");
        mm = String(b).padStart(2, "0");
      }
      // Basic bounds check
      const mi = Number(mm), di = Number(dd);
      if (mi >= 1 && mi <= 12 && di >= 1 && di <= 31) return `${yyyy}-${mm}-${dd}`;
    }
    // Fallback: try Date parser
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      return tz.toISOString().slice(0, 10);
    }
    return undefined;
  }

  type AggregatedService = {
    dateIso: string;
    topic?: string;
    adults?: number;
    firstTimersCount?: number;
    children?: number;
    converts?: number;
    tithers?: number;
    attendees: Set<string>;
    imageRefs: string[];
    firstTimerNames?: string[];
  };

  function addNamesToSet(set: Set<string>, rawList: string) {
    const parts = rawList.split(",");
    for (const p of parts) {
      const name = p.trim();
      if (name) set.add(name);
    }
  }

  function normalizePersonName(name: string): string {
    return name.toLowerCase().replace(/\s+/g, " ").trim();
  }

  function buildMemberNameSet(): Set<string> {
    const set = new Set<string>();
    const list = (members as MemberRecord[] | undefined) ?? [];
    for (const m of list) {
      const full = m.full_name ?? `${m.first_name}${m.surname ? ` ${m.surname}` : ""}`;
      set.add(normalizePersonName(full));
      if (m.first_name) set.add(normalizePersonName(m.first_name));
      if (m.surname) set.add(normalizePersonName(m.surname));
    }
    return set;
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImporting(true);
      setImportSummary(null);
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length < 2) {
        setImportSummary({ created: 0, updated: 0, skipped: 0, errors: 1, messages: ["CSV seems empty or missing data rows."] });
        return;
      }

      const header = rows[0];
      const headerNorm = header.map((h) => normalizeHeader(h));
      const indexOf = (label: string) => headerNorm.findIndex((h) => h === label);

      const idxDate1 = indexOf("date of sunday service");
      const idxTopic = indexOf("sunday - what was preached");
      const idxAdults = indexOf("sunday - adult attendance over 12yrs");
      const idxFirstTimers = indexOf("sunday - first timers over 12yrs");
      const idxChildren = indexOf("sunday - children under 12yrs");
      const idxConverts = indexOf("sunday - how many converts");
      const idxTithers = indexOf("how many people tithed");
      const idxWho = indexOf("who attended service");
      const idxImages = indexOf("optional picture of service");
      const idxServiceDate2 = indexOf("service date");
      const idxAttendeeName = indexOf("attendee name");

      if (idxDate1 < 0 && idxServiceDate2 < 0) {
        setImportSummary({ created: 0, updated: 0, skipped: 0, errors: 1, messages: ["Could not find a service date column in CSV header."] });
        return;
      }

      const grouped = new Map<string, AggregatedService>();

      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        // Summary/service row using first date column
        const date1Raw = idxDate1 >= 0 ? row[idxDate1] : "";
        const dateIso1 = toIsoFromAny(date1Raw);
        if (dateIso1) {
          const key = dateIso1;
          let agg = grouped.get(key);
          if (!agg) {
            agg = { dateIso: key, attendees: new Set<string>(), imageRefs: [] };
            grouped.set(key, agg);
          }
          if (idxTopic >= 0 && row[idxTopic]) agg.topic = row[idxTopic].trim();
          if (idxAdults >= 0 && row[idxAdults]) agg.adults = parseNumber(row[idxAdults]);
          if (idxFirstTimers >= 0 && row[idxFirstTimers]) agg.firstTimersCount = parseNumber(row[idxFirstTimers]);
          if (idxChildren >= 0 && row[idxChildren]) agg.children = parseNumber(row[idxChildren]);
          if (idxConverts >= 0 && row[idxConverts]) agg.converts = parseNumber(row[idxConverts]);
          if (idxTithers >= 0 && row[idxTithers]) agg.tithers = parseNumber(row[idxTithers]);
          if (idxWho >= 0 && row[idxWho]) addNamesToSet(agg.attendees, row[idxWho]);
          if (idxImages >= 0 && row[idxImages]) {
            const links = row[idxImages]
              .split(/\s+/)
              .map((s) => s.trim())
              .filter((s) => s.startsWith("http"));
            if (links.length) agg.imageRefs.push(...links);
          }
        }

        // Attendee-only row using second date column + attendee name
        const date2Raw = idxServiceDate2 >= 0 ? row[idxServiceDate2] : "";
        const attendeeName = idxAttendeeName >= 0 ? row[idxAttendeeName] : "";
        const dateIso2 = toIsoFromAny(date2Raw);
        if (dateIso2 && attendeeName && attendeeName.trim()) {
          const key = dateIso2;
          let agg = grouped.get(key);
          if (!agg) {
            agg = { dateIso: key, attendees: new Set<string>(), imageRefs: [] };
            grouped.set(key, agg);
          }
          agg.attendees.add(attendeeName.trim());
        }
      }

      // Remove inference of first-timer names from attendee history.
      // We only trust explicit first-timer counts or provided names in the CSV.

      // Build preview rows
      const previewRows = Array.from(grouped.values()).sort((a, b) => a.dateIso.localeCompare(b.dateIso));
      setImportPreview(previewRows);
      setImportMapping([
        { label: "Date of sunday service", found: idxDate1 >= 0 },
        { label: "Sunday - What was preached", found: idxTopic >= 0 },
        { label: "Sunday - Adult Attendance over 12yrs", found: idxAdults >= 0 },
        { label: "Sunday - First timers over 12yrs", found: idxFirstTimers >= 0 },
        { label: "Sunday - Children under 12yrs", found: idxChildren >= 0 },
        { label: "Sunday - How many converts", found: idxConverts >= 0 },
        { label: "How many people tithed", found: idxTithers >= 0 },
        { label: "Who_attended_service", found: idxWho >= 0 },
        { label: "Optional Picture of Service", found: idxImages >= 0 },
        { label: "Service_Date", found: idxServiceDate2 >= 0 },
        { label: "Attendee_Name", found: idxAttendeeName >= 0 },
      ]);
      setShowImportModal(true);
    } finally {
      setImporting(false);
      if (e.target) e.target.value = ""; // allow re-selecting same file
    }
  }

  async function confirmImportFromPreview() {
    if (!importPreview) return;
    setPerformingImport(true);
    try {
      // Build existing by date
      const existingList = ((services as ServiceRecord[] | undefined) ?? [])
        .filter((s) => Boolean(s.service_date))
        .sort((a, b) => a.service_date.localeCompare(b.service_date));
      const existingByDate = new Map<string, ServiceRecord>();
      for (const s of existingList) existingByDate.set(s.service_date, s);

      let created = 0;
      let updated = 0;
      let skipped = 0;
      let errors = 0;
      const messages: string[] = [];

      for (const agg of importPreview) {
        const existing = existingByDate.get(agg.dateIso);
        const attendeesArr = Array.from(agg.attendees);
        const firstTimersList: FirstTimerInline[] = (agg.firstTimerNames ?? []).map((n) => ({ name: n }));
        if (firstTimersList.length === 0) {
          const ftCount = agg.firstTimersCount ?? 0;
          for (let i = 0; i < ftCount; i++) firstTimersList.push({ name: `FT ${i + 1} (import)` });
        }

        try {
          if (existing) {
            await updateService(existing.id, {
              topic: agg.topic ?? existing.topic,
              attendance_adults: agg.adults ?? existing.attendance_adults,
              attendance_children: agg.children ?? existing.attendance_children,
              converts: agg.converts ?? existing.converts,
              tithers: agg.tithers ?? existing.tithers,
              attendees: attendeesArr.length ? Array.from(new Set([...(existing.attendees ?? []), ...attendeesArr])) : existing.attendees,
              first_timers: firstTimersList.length ? Array.from(new Set([...(existing.first_timers ?? []), ...firstTimersList].map((ft) => ft.name))).map((name) => ({ name })) : existing.first_timers,
              service_image_refs: agg.imageRefs.length ? Array.from(new Set([...(existing.service_image_refs ?? []), ...agg.imageRefs])) : existing.service_image_refs,
            });
            updated++;
          } else {
            await createService({
              service_date: agg.dateIso,
              topic: agg.topic,
              attendance_adults: agg.adults,
              attendance_children: agg.children,
              converts: agg.converts,
              tithers: agg.tithers,
              attendees: attendeesArr,
              first_timers: firstTimersList,
            });
            created++;
          }
        } catch (err: any) {
          errors++;
          messages.push(`Error on ${agg.dateIso}: ${err?.message ?? String(err)}`);
        }
      }

      if (created + updated === 0 && errors === 0) skipped = importPreview.length;

      setImportSummary({ created, updated, skipped, errors, messages });
      qc.invalidateQueries({ queryKey: ["services"] });
    } finally {
      setPerformingImport(false);
      setShowImportModal(false);
      setImportPreview(null);
      setImportMapping(null);
    }
  }

  function cancelImportPreview() {
    setShowImportModal(false);
    setImportPreview(null);
    setImportMapping(null);
  }

  // -------------------- Service Detail Modal --------------------
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const { data: detail, isLoading: loadingDetail } = useQuery({
    queryKey: ["service", detailId],
    queryFn: () => getService(detailId as string),
    enabled: Boolean(detailId && showDetail),
  });

  const {
    register: registerDetail,
    handleSubmit: handleSubmitDetail,
    reset: resetDetail,
    formState: { isSubmitting: detailSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (detail && showDetail) {
      const s = detail as ServiceRecord;
      resetDetail({
        service_date: s.service_date,
        topic: s.topic ?? "",
        notes: s.notes ?? "",
        service_type: (s.service_type ?? "Sunday service") as any,
        attendance_adults: (s.attendance_adults ?? "") as any,
        attendance_children: (s.attendance_children ?? "") as any,
        converts: (s.converts ?? "") as any,
        tithers: (s.tithers ?? "") as any,
      });
    }
  }, [detail, showDetail, resetDetail]);

  // Clean up any existing duplicates when detail data loads
  useEffect(() => {
    if (detail && showDetail && detailId) {
      const s = detail as ServiceRecord;
      const attendees = s.attendees ?? [];
      const firstTimers = (s.first_timers ?? []) as FirstTimerInline[];
      
      const firstTimerNames = firstTimers.map(ft => ft.name.toLowerCase());
      const cleanedAttendees = attendees.filter(attendee => !firstTimerNames.includes(attendee.toLowerCase()));
      
      // If we found duplicates, update the service to remove them
      if (cleanedAttendees.length !== attendees.length) {
        console.log(`Cleaning up ${attendees.length - cleanedAttendees.length} duplicate entries from service ${detailId}`);
        updateService(detailId, { 
          attendees: cleanedAttendees
        }).then(() => {
          qc.invalidateQueries({ queryKey: ["service", detailId] });
          qc.invalidateQueries({ queryKey: ["services"] });
        });
      }
    }
  }, [detail, showDetail, detailId, qc]);

  const updateDetailMut = useMutation({
    mutationFn: async (v: FormValues) => {
      if (!detailId) return;
      const toNum = (val?: string) => (val && val.trim() !== "" ? Number(val) : undefined);
      await updateService(detailId, {
        service_date: v.service_date,
        topic: v.topic || undefined,
        notes: v.notes || undefined,
        service_type: (v.service_type ?? "Sunday service") as ServiceType,
        attendance_adults: toNum(v.attendance_adults),
        attendance_children: toNum(v.attendance_children),
        converts: toNum(v.converts),
        tithers: toNum(v.tithers),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service", detailId] });
      qc.invalidateQueries({ queryKey: ["services"] });
      qc.invalidateQueries({ queryKey: ["totals"] });
      setShowDetail(false);
      setDetailId(null);
    },
  });

  function openDetail(id: string) {
    setDetailId(id);
    setShowDetail(true);
  }

  function closeDetail() {
    setShowDetail(false);
    setDetailId(null);
  }

  // Detail modal: attendees and first timers editing
  const [newAttendee, setNewAttendee] = useState("");
  const [newFirstTimer, setNewFirstTimer] = useState("");

  // Typeahead state for attendees input in detail modal
  const [attendeeInputFocused, setAttendeeInputFocused] = useState(false);

  // Build an index of prior attendees across all services with last visit date and visit count
  const priorAttendeeStats = useMemo(() => {
    const list = (services as ServiceRecord[] | undefined) ?? [];
    const map = new Map<string, { name: string; lastDate: string; visits: number }>();
    for (const s of list) {
      const dateIso = s.service_date;
      const attendees = s.attendees ?? [];
      for (const name of attendees) {
        const key = name.toLowerCase().trim();
        if (!map.has(key)) {
          map.set(key, { name, lastDate: dateIso, visits: 1 });
        } else {
          const rec = map.get(key)!;
          rec.visits += 1;
          if (dateIso > rec.lastDate) rec.lastDate = dateIso;
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.lastDate.localeCompare(a.lastDate));
  }, [services]);

  // Suggestions filtered by current query and excluding already added attendees / first timers
  const attendeeSuggestions = useMemo(() => {
    const q = newAttendee.trim().toLowerCase();
    if (!q) return [] as { name: string; lastDate: string; visits: number }[];
    const currentAttendees = ((detail as ServiceRecord | null)?.attendees ?? []).map((n) => n.toLowerCase());
    const currentFirstTimers = (((detail as ServiceRecord | null)?.first_timers ?? []) as FirstTimerInline[]).map((ft) => ft.name.toLowerCase());
    return priorAttendeeStats
      .filter((p) => p.name.toLowerCase().includes(q))
      .filter((p) => !currentAttendees.includes(p.name.toLowerCase()) && !currentFirstTimers.includes(p.name.toLowerCase()))
      .slice(0, 8);
  }, [newAttendee, priorAttendeeStats, detail]);

  function selectAttendeeSuggestion(name: string) {
    setNewAttendee(name);
    setAttendeeInputFocused(false);
  }

  // Live metrics for the detail modal (existing service)
  const detailMetrics = useMemo(() => {
    const a = ((detail as ServiceRecord | null)?.attendees ?? []) as string[];
    const f = (((detail as ServiceRecord | null)?.first_timers ?? []) as FirstTimerInline[]);
    return computeAttendanceMetrics(a, f);
  }, [detail]);

  async function addAttendee(nameOverride?: string) {
    const name = (nameOverride ?? newAttendee).trim();
    if (!name || !detailId) return;
    
    // Check if this person is already a first-timer to prevent double-counting
    const currentFirstTimers = ((detail as ServiceRecord | null)?.first_timers ?? []) as FirstTimerInline[];
    const isFirstTimer = currentFirstTimers.some(ft => ft.name.toLowerCase() === name.toLowerCase());
    
    if (isFirstTimer) {
      alert("This person is already listed as a first-timer. Please remove them from the First Timers section if you want to add them as a regular attendee.");
      return;
    }
    
    const current = (detail as ServiceRecord | null)?.attendees ?? [];
    const next = Array.from(new Set([...current, name]));
    await updateService(detailId, { attendees: next });
    
    // Sync to central members (regular attendee, not first-timer)
    try {
      const serviceDate = (detail as ServiceRecord | null)?.service_date ?? new Date().toISOString().slice(0, 10);
      await syncMemberFromService(name, serviceDate, false); // false = not a first-timer
      qc.invalidateQueries({ queryKey: ["members"] });
    } catch (err) {
      console.warn("Failed to sync member:", err);
    }
    
    setNewAttendee("");
    qc.invalidateQueries({ queryKey: ["service", detailId] });
    qc.invalidateQueries({ queryKey: ["services"] });
  }

  async function removeAttendee(name: string) {
    if (!detailId) return;
    const current = (detail as ServiceRecord | null)?.attendees ?? [];
    const next = current.filter((n) => n !== name);
    await updateService(detailId, { attendees: next });
    qc.invalidateQueries({ queryKey: ["service", detailId] });
    qc.invalidateQueries({ queryKey: ["services"] });
  }

  async function addFirstTimerDetail() {
    const name = newFirstTimer.trim();
    if (!name || !detailId) return;
    
    // Check if this person is already in the attendees list to prevent double-counting
    const currentAttendees = (detail as ServiceRecord | null)?.attendees ?? [];
    const isAttendee = currentAttendees.some(attendee => attendee.toLowerCase() === name.toLowerCase());
    
    if (isAttendee) {
      alert("This person is already listed as an attendee. Please remove them from the Attendees section if you want to add them as a first-timer.");
      return;
    }
    
    const current = ((detail as ServiceRecord | null)?.first_timers ?? []) as FirstTimerInline[];
    const next = Array.from(new Set([...current.map((f) => f.name), name])).map((n) => ({ name: n }));
    await updateService(detailId, { first_timers: next });
    
    // Sync to central members as first-timer (visitor)
    try {
      const serviceDate = (detail as ServiceRecord | null)?.service_date ?? new Date().toISOString().slice(0, 10);
      await syncMemberFromService(name, serviceDate, true); // true = is a first-timer
      qc.invalidateQueries({ queryKey: ["members"] });
    } catch (err) {
      console.warn("Failed to sync first-timer:", err);
    }
    
    setNewFirstTimer("");
    qc.invalidateQueries({ queryKey: ["service", detailId] });
    qc.invalidateQueries({ queryKey: ["services"] });
  }

  async function removeFirstTimerDetail(name: string) {
    if (!detailId) return;
    const current = ((detail as ServiceRecord | null)?.first_timers ?? []) as FirstTimerInline[];
    const next = current.filter((ft) => ft.name !== name);
    await updateService(detailId, { first_timers: next });
    qc.invalidateQueries({ queryKey: ["service", detailId] });
    qc.invalidateQueries({ queryKey: ["services"] });
  }

  // Detail modal: image preview/gallery
  const [imgIndex, setImgIndex] = useState(0);
  function prevImg(total: number) {
    setImgIndex((i) => (i - 1 + total) % total);
  }
  function nextImg(total: number) {
    setImgIndex((i) => (i + 1) % total);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Services"
        description="Track attendance, manage services, and view analytics"
        actions={
          <>
          <Button onClick={() => setShowCreate((v) => !v)} className="bg-neutral-900 text-white border-neutral-900">
            <span className="inline-flex items-center gap-2"><Plus size={16} /> Add New Service</span>
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFileChange} />
          <Button type="button" onClick={triggerImport} disabled={importing} className="hidden md:inline-flex"><span className="inline-flex items-center gap-2"><Upload size={14}/>{importing ? "Importing..." : "Import CSV"}</span></Button>
          <Button type="button" onClick={handleExportCsvTop} className="hidden md:inline-flex"><span className="inline-flex items-center gap-2"><Download size={14}/> Export CSV</span></Button>
          <Button type="button" onClick={handleCopyData} className="hidden md:inline-flex"><span className="inline-flex items-center gap-2"><Copy size={14}/> Copy Data</span></Button>
          <Button 
            type="button" 
            onClick={bulkSyncExistingData} 
            disabled={syncingMembers || loadingServices} 
            className="bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] hidden md:inline-flex"
            title="Sync all existing service attendees and first-timers to Central Members"
          >
            <span className="inline-flex items-center gap-2">
              <User size={14}/> 
              {syncingMembers ? "Syncing..." : "Sync to Members"}
            </span>
          </Button>
          </>
        }
      />
      {(services as ServiceRecord[] | undefined)?.length > 0 && (
        <p className="text-xs" style={{ color: 'var(--accent)' }}>
          💡 Use "Sync to Members" to add unique attendees from all services to Central Members (duplicates handled automatically)
        </p>
      )}

      {importSummary ? (
        <Card>
          <CardHeader>
            <div className="font-medium">Import Summary</div>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <div>Created: {importSummary.created}</div>
              <div>Updated: {importSummary.updated}</div>
              <div>Skipped: {importSummary.skipped}</div>
              <div>Errors: {importSummary.errors}</div>
              {importSummary.messages.length ? (
                <ul className="mt-2 list-disc list-inside text-red-600">
                  {importSummary.messages.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              ) : null}
            </div>

            {/* Service Images */}
            <div>
              <div className="font-medium mb-1">Service Images</div>
              <input type="file" accept="image/*" multiple onChange={onSelectImageFiles} />
              {imageFiles.length ? (
                <div className="mt-2 text-sm">
                  <div className="text-neutral-600">{imageFiles.length} file(s) selected</div>
                  <ul className="list-disc list-inside">
                    {imageFiles.map((f) => (
                      <li key={f.name} className="flex items-center justify-between gap-2">
                        <span className="truncate">{f.name}</span>
                        <button type="button" className="text-red-600" onClick={() => removeSelectedImage(f.name)}>Remove</button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {imageUploadMsg ? <div className="mt-2 text-xs text-red-600">{imageUploadMsg}</div> : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Sync Progress Modal */}
      {syncProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative w-full max-w-md px-4" onClick={(e) => e.stopPropagation()}>
            <Card>
              <CardHeader>
                <div className="font-medium">Syncing to Central Members</div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-neutral-600">{syncProgress.message}</div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300" 
                      style={{ backgroundColor: 'var(--primary)' }}
                      style={{ width: `${Math.round((syncProgress.current / syncProgress.total) * 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-neutral-500 text-center">
                    {syncProgress.current} of {syncProgress.total} people processed
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {showImportModal && importPreview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={cancelImportPreview} />
          <div className="relative w-full max-w-5xl px-4" onClick={(e) => e.stopPropagation()}>
            <Card>
              <CardHeader>
                <div className="font-medium">Import Preview</div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-1">Detected columns</div>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm">
                      {(importMapping ?? []).map((m) => (
                        <li key={m.label} className={m.found ? "text-green-600" : "text-red-600"}>{m.label}: {m.found ? "Found" : "Missing"}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-sm font-medium">Rows to process ({importPreview.length})</div>
                  <div className="max-h-80 overflow-auto border rounded-md">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b">
                          <th className="py-2 px-2">Action</th>
                          <th className="py-2 px-2">Date</th>
                          <th className="py-2 px-2">Topic</th>
                          <th className="py-2 px-2">Adults</th>
                          <th className="py-2 px-2">1st Timers</th>
                          <th className="py-2 px-2">First Timer Names</th>
                          <th className="py-2 px-2">Children</th>
                          <th className="py-2 px-2">Converts</th>
                          <th className="py-2 px-2">Tithers</th>
                          <th className="py-2 px-2">Attendees</th>
                          <th className="py-2 px-2">Images</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((r) => {
                          const exists = ((services as ServiceRecord[] | undefined) ?? []).some((s) => s.service_date === r.dateIso);
                          return (
                            <tr key={r.dateIso} className="border-b">
                              <td className="py-2 px-2 whitespace-nowrap">{exists ? "Update" : "Create"}</td>
                              <td className="py-2 px-2 whitespace-nowrap">{formatDateHumanUK(r.dateIso)}</td>
                              <td className="py-2 px-2">{r.topic ?? "-"}</td>
                              <td className="py-2 px-2">{r.adults ?? 0}</td>
                              <td className="py-2 px-2">{r.firstTimersCount ?? (r.firstTimerNames?.length ?? 0)}</td>
                              <td className="py-2 px-2">{(r.firstTimerNames ?? []).join(", ") || "-"}</td>
                              <td className="py-2 px-2">{r.children ?? 0}</td>
                              <td className="py-2 px-2">{r.converts ?? 0}</td>
                              <td className="py-2 px-2">{r.tithers ?? 0}</td>
                              <td className="py-2 px-2">{r.attendees.size}</td>
                              <td className="py-2 px-2">{r.imageRefs.length}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button type="button" onClick={cancelImportPreview}>Cancel</Button>
                    <Button type="button" onClick={confirmImportFromPreview} disabled={performingImport} className="bg-neutral-900 text-white border-neutral-900">{performingImport ? "Importing..." : "Confirm & Import"}</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div className="font-medium flex items-center gap-2">Filters</div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" onClick={() => applyQuickRange("week")} className={`${quickRange === "week" ? "bg-neutral-900 text-white border-neutral-900" : ""}`}>This Week</Button>
              <Button type="button" onClick={() => applyQuickRange("month")} className={`${quickRange === "month" ? "bg-neutral-900 text-white border-neutral-900" : ""}`}>This Month</Button>
              <Button type="button" onClick={() => applyQuickRange("year")} className={`${quickRange === "year" ? "bg-neutral-900 text-white border-neutral-900" : ""}`}>This Year</Button>
              <Button type="button" onClick={() => applyQuickRange("last7")} className={`${quickRange === "last7" ? "bg-neutral-900 text-white border-neutral-900" : ""}`}>Last 7 Days</Button>
              <Button type="button" onClick={() => applyQuickRange("lastMonth")} className={`${quickRange === "lastMonth" ? "bg-neutral-900 text-white border-neutral-900" : ""}`}>Last Month</Button>
              <Button type="button" onClick={() => applyQuickRange("qtd")} className={`${quickRange === "qtd" ? "bg-neutral-900 text-white border-neutral-900" : ""}`}>QTD</Button>
              <Button type="button" onClick={() => applyQuickRange("ytd")} className={`${quickRange === "ytd" ? "bg-neutral-900 text-white border-neutral-900" : ""}`}>YTD</Button>
              <Button type="button" onClick={clearQuickRange}>Clear</Button>
            </div>
            <div>
              <Label>Search by Topic</Label>
              <Input value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} placeholder="Enter topic keywords..." className="mt-1" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Service Date From</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>To</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                <Button type="button" onClick={() => { const now = new Date(); setSelectedYear(String(now.getFullYear())); setSelectedMonth(String(now.getMonth() + 1)); }}>This Month</Button>
                <Button type="button" onClick={() => { const now = new Date(); setSelectedYear(String(now.getFullYear())); setSelectedMonth("all"); }}>This Year</Button>
                <Button type="button" onClick={() => { setSelectedMonth("all"); setSelectedYear("all"); }}>Clear</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent>
            <div className="text-sm text-neutral-500">Total Services</div>
            <div className="text-3xl font-semibold">{totals.totalServices}</div>
            <div className="text-xs text-neutral-400">All time</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-sm text-neutral-500">Avg Attendance</div>
            <div className="text-3xl font-semibold">{totals.avgAttendance}</div>
            <div className="text-xs text-neutral-400">Per service</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-sm text-neutral-500">Total Converts</div>
            <div className="text-3xl font-semibold">{totals.totalConverts}</div>
            <div className="text-xs text-neutral-400">Souls won</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-sm text-neutral-500">First Timers</div>
            <div className="text-3xl font-semibold">{totals.totalFirstTimers}</div>
            <div className="text-xs text-neutral-400">New visitors</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <button className={`pb-2 border-b-2 ${activeTab === "list" ? "border-neutral-900 dark:border-neutral-100" : "border-transparent text-neutral-500"}`} onClick={() => setActiveTab("list")}>Service List</button>
          <button className={`pb-2 border-b-2 ${activeTab === "dashboard" ? "border-neutral-900 dark:border-neutral-100" : "border-transparent text-neutral-500"}`} onClick={() => setActiveTab("dashboard")}>Visual Dashboard</button>
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label="Sort by date"
            value={dateSort}
            onChange={(e) => setDateSort(e.target.value as "asc" | "desc")}
            className="border border-neutral-200 dark:border-neutral-800 rounded px-2 py-1 text-sm bg-white dark:bg-neutral-900"
          >
            <option value="desc">Date: newest first</option>
            <option value="asc">Date: oldest first</option>
          </select>
          <Button type="button" onClick={triggerImport} disabled={importing} className="inline-flex items-center gap-2"><Upload size={14}/>{importing ? "Importing..." : "Import"}</Button>
          <Button type="button" onClick={() => download(`services_export.csv`, toCsv(filteredServices), "text/csv")} className="inline-flex items-center gap-2"><Download size={14}/> Export</Button>
          <Button 
            type="button" 
            onClick={bulkSyncExistingData} 
            disabled={syncingMembers || loadingServices} 
            className="bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] inline-flex items-center gap-2 md:hidden"
            title="Sync all existing service attendees and first-timers to Central Members"
          >
            <User size={14}/> 
            {syncingMembers ? "Syncing..." : "Sync Members"}
          </Button>
          <div className="relative">
            <Button type="button" onClick={() => setShowColumns((v) => !v)}>{`Columns`}</Button>
            {showColumns && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md p-2 z-10">
                {Object.entries(columns).map(([key, value]) => (
                  <label key={key} className="flex items-center justify-between py-1 text-sm">
                    <span className="capitalize">{key}</span>
                    <input type="checkbox" checked={value as boolean} onChange={() => setColumns((c) => ({ ...(c as any), [key]: !(c as any)[key] }))} />
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {activeTab === "dashboard" ? (
        <ServiceTimelineChart services={filteredServices} />
      ) : null}

      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeDetail} />
          <div className="relative w-full max-w-5xl px-4" onClick={(e) => e.stopPropagation()}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="font-medium">Service Details</div>
                  <button onClick={closeDetail} aria-label="Close" className="p-1 hover:opacity-80"><X size={18} /></button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingDetail || !detail ? (
                  <div className="text-sm text-neutral-500">Loading...</div>
                ) : (
                  <div className="space-y-4">
                    <form onSubmit={handleSubmitDetail((v) => updateDetailMut.mutate(v))} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <Label>Date</Label>
                        <Input className="mt-1" type="date" {...registerDetail("service_date")} />
                      </div>
                      <div>
                        <Label>Service Type</Label>
                        <Select className="mt-1" defaultValue={(detail as ServiceRecord).service_type ?? "Sunday service"} {...registerDetail("service_type" as const)}>
                          <option value="Sunday service">Sunday service</option>
                          <option value="Bacenta">Bacenta</option>
                          <option value="Special event">Special event</option>
                          <option value="Other">Other</option>
                        </Select>
                      </div>
                      <div>
                        <Label>Topic</Label>
                        <Input className="mt-1" {...registerDetail("topic")} />
                      </div>
                      <div>
                        <Label>Notes</Label>
                        <Input className="mt-1" {...registerDetail("notes")} />
                      </div>
                      <div>
                        <Label>Adults</Label>
                        <Input className="mt-1" type="number" min={0} {...registerDetail("attendance_adults")} />
                      </div>
                      <div>
                        <Label>Children</Label>
                        <Input className="mt-1" type="number" min={0} {...registerDetail("attendance_children")} />
                      </div>
                      <div>
                        <Label>Converts</Label>
                        <Input className="mt-1" type="number" min={0} {...registerDetail("converts")} />
                      </div>
                      <div>
                        <Label>Tithers</Label>
                        <Input className="mt-1" type="number" min={0} {...registerDetail("tithers")} />
                      </div>
                      <div className="md:col-span-4 flex items-center justify-end gap-2">
                        <Button type="button" onClick={closeDetail}>Close</Button>
                        <Button disabled={detailSubmitting || updateDetailMut.isPending} className="bg-black text-white border-black">Save Changes</Button>
                      </div>
                    </form>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-md p-3">
                        <div className="font-medium mb-2">Attendees</div>
                        <div className="flex items-center gap-2 mb-2 relative">
                          <Input 
                            placeholder="Add attendee name" 
                            value={newAttendee} 
                            onChange={(e) => setNewAttendee(e.target.value)} 
                            onFocus={() => setAttendeeInputFocused(true)}
                            onBlur={() => setTimeout(() => setAttendeeInputFocused(false), 150)}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAttendee(newAttendee); } }}
                          />
                          <Button type="button" onClick={() => addAttendee(newAttendee)}>Add</Button>

                          {attendeeInputFocused && newAttendee.trim() !== "" && attendeeSuggestions.length > 0 ? (
                            <div className="absolute left-0 right-0 top-full mt-1 border rounded-md bg-white dark:bg-neutral-900 shadow z-20 max-h-48 overflow-auto">
                              <ul className="divide-y divide-neutral-200 dark:divide-neutral-800 text-sm">
                                {attendeeSuggestions.map((s) => (
                                  <li key={s.name}>
                                    <button 
                                      type="button" 
                                      className="w-full text-left px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                                      onMouseDown={(e) => { e.preventDefault(); selectAttendeeSuggestion(s.name); }}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium">{s.name}</span>
                                        <span className="text-xs text-neutral-500">{s.visits} visit{s.visits === 1 ? "" : "s"}</span>
                                      </div>
                                      <div className="text-xs text-neutral-500">Last: {formatDateUK(s.lastDate)}</div>
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                        <div className="max-h-48 overflow-auto text-sm">
                          {((detail as ServiceRecord).attendees ?? []).length === 0 ? (
                            <div className="text-neutral-500">No attendees captured</div>
                          ) : (
                            <ul className="list-disc list-inside">
                              {((detail as ServiceRecord).attendees ?? []).map((name, idx) => (
                                <li key={`${name}-${idx}`} className="flex items-center justify-between">
                                  <span>{name}</span>
                                  <button type="button" className="text-red-600" onClick={() => removeAttendee(name)}>Remove</button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                      <div className="border rounded-md p-3">
                        <div className="font-medium mb-2">First Timers</div>
                        <div className="flex items-center gap-2 mb-2">
                          <Input placeholder="Add first-timer name" value={newFirstTimer} onChange={(e) => setNewFirstTimer(e.target.value)} />
                          <Button type="button" onClick={addFirstTimerDetail}>Add</Button>
                        </div>
                        <div className="max-h-48 overflow-auto text-sm">
                          {((detail as ServiceRecord).first_timers ?? []).length === 0 ? (
                            <div className="text-neutral-500">No first timers captured</div>
                          ) : (
                            <ul className="list-disc list-inside">
                              {(((detail as ServiceRecord).first_timers ?? []) as FirstTimerInline[]).map((ft) => (
                                <li key={`${ft.name}-${ft.added_at ?? "na"}`} className="flex items-center justify-between">
                                  <span>{ft.name}</span>
                                  <button type="button" className="text-red-600" onClick={() => removeFirstTimerDetail(ft.name)}>Remove</button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>

                  {/* Live derived totals for detail modal */}
                  <div className="text-sm text-neutral-700 dark:text-neutral-300">
                    <div className="font-medium mb-1">Attendance Totals</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="border rounded-md p-2">Members: {detailMetrics.attendance_breakdown.members}</div>
                      <div className="border rounded-md p-2">First Timers: {detailMetrics.attendance_breakdown.first_timers}</div>
                      <div className="border rounded-md p-2">Total: {detailMetrics.total_attendance}</div>
                    </div>
                  </div>

                  {/* Image preview/gallery */}
                    {((detail as ServiceRecord).service_image_refs ?? []).length ? (
                      <div className="border rounded-md p-3">
                        <div className="font-medium mb-2">Image Preview</div>
                        <div className="flex items-center gap-3">
                          <Button type="button" onClick={() => prevImg(((detail as ServiceRecord).service_image_refs ?? []).length)}><ChevronLeft size={16} /></Button>
                          <div className="flex-1 border rounded overflow-hidden" style={{ maxHeight: 300 }}>
                            <img src={(detail as ServiceRecord).service_image_refs![imgIndex]} alt="Service" className="w-full object-contain" />
                          </div>
                          <Button type="button" onClick={() => nextImg(((detail as ServiceRecord).service_image_refs ?? []).length)}><ChevronRight size={16} /></Button>
                        </div>
                        <div className="mt-2 text-xs text-neutral-600">{imgIndex + 1} / {((detail as ServiceRecord).service_image_refs ?? []).length}</div>
                        <div className="mt-2 grid grid-cols-6 gap-2">
                          {(((detail as ServiceRecord).service_image_refs ?? []) as string[]).map((u, i) => (
                            <button key={`${u}-${i}`} type="button" className={`border rounded ${i === imgIndex ? "border-neutral-900" : "border-transparent"}`} onClick={() => setImgIndex(i)}>
                              <img src={u} alt={`thumb-${i}`} className="w-full h-16 object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-4xl px-4" onClick={(e) => e.stopPropagation()}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="font-medium">Add New Service</div>
                  <button onClick={() => setShowCreate(false)} aria-label="Close" className="p-1 hover:opacity-80">
                    <X size={18} />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit((v) => createMut.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label>Date</Label>
                <Input className="mt-1" type="date" {...register("service_date")} />
                {errors.service_date && <p className="text-xs text-red-600">{errors.service_date.message}</p>}
              </div>
              <div>
                <Label>Service Type</Label>
                <Select className="mt-1" defaultValue="Sunday service" {...register("service_type" as const)}>
                  <option value="Sunday service">Sunday service</option>
                  <option value="Bacenta">Bacenta</option>
                  <option value="Special event">Special event</option>
                  <option value="Other">Other</option>
                </Select>
              </div>
              <div>
                <Label>Topic</Label>
                <Input className="mt-1" placeholder="Sermon topic" {...register("topic")} />
              </div>
              <div>
                <Label>Notes</Label>
                <Input className="mt-1" placeholder="Notes" {...register("notes")} />
              </div>

              <div>
                <Label>Adults</Label>
                <Input className="mt-1" type="number" min={0} placeholder="0" {...register("attendance_adults")} />
              </div>
              <div>
                <Label>Children</Label>
                <Input className="mt-1" type="number" min={0} placeholder="0" {...register("attendance_children")} />
              </div>
              <div>
                <Label>Converts</Label>
                <Input className="mt-1" type="number" min={0} placeholder="0" {...register("converts")} />
              </div>
              <div>
                <Label>Tithers</Label>
                <Input className="mt-1" type="number" min={0} placeholder="0" {...register("tithers")} />
              </div>
            </div>

            {/* Attendee Manager */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Central Members</div>
                  <div className="text-xs text-neutral-500">{loadingMembers ? "Loading..." : `${filteredMembers.length} listed`}</div>
                </div>
                <Input placeholder="Search members by name, phone, or role" value={memberQuery} onChange={(e) => setMemberQuery(e.target.value)} className="mb-2" />
                <div className="max-h-64 overflow-auto divide-y">
                  {(filteredMembers as MemberRecord[]).map((m) => {
                    const fullName = m.full_name ?? `${m.first_name}${m.surname ? ` ${m.surname}` : ""}`;
                    const checked = selectedAttendees.includes(fullName);
                    return (
                      <label key={m.id} className="flex items-center justify-between py-2 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{fullName}</div>
                          <div className="text-xs text-neutral-500 flex gap-2">
                            {m.church_role && <span>• {m.church_role}</span>}
                            {m.phone_number && <span>• {m.phone_number}</span>}
                            <span className={`px-1 rounded text-xs ${
                              m.member_type === "member" ? "bg-green-100 text-green-800" :
                              m.member_type === "potential" ? "bg-yellow-100 text-yellow-800" :
                              ""
                            }`}>
                              <span style={m.member_type === "visitor" ? { backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)', padding: '2px 6px', borderRadius: '9999px' } : undefined}>
                                {m.member_type}
                              </span>
                            </span>
                          </div>
                        </div>
                        <input type="checkbox" checked={checked} onChange={() => toggleAttendee(fullName)} />
                      </label>
                    );
                  })}
                </div>
                <div className="mt-2 text-xs text-neutral-600">Selected: {selectedAttendees.length}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Button 
                    type="button" 
                    onClick={() => {
                      // Get recent attendees from last service
                      const recentService = (services as ServiceRecord[] | undefined)?.[0];
                      if (recentService?.attendees) {
                        setSelectedAttendees([...new Set([...selectedAttendees, ...recentService.attendees])]);
                      }
                    }} 
                    className="text-xs"
                  >
                    + Last Service
                  </Button>
                  <Button type="button" onClick={() => setSelectedAttendees(filteredMembers.filter(m => m.member_type === "member").map((m) => m.full_name ?? `${m.first_name}${m.surname ? ` ${m.surname}` : ""}`))} className="text-xs">Members Only</Button>
                  <Button type="button" onClick={() => setSelectedAttendees(filteredMembers.map((m) => m.full_name ?? `${m.first_name}${m.surname ? ` ${m.surname}` : ""}`))} className="text-xs">Select All</Button>
                  <Button type="button" onClick={() => setSelectedAttendees([])} className="text-xs">Clear</Button>
                </div>
              </div>

              <div className="border rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">First Timers</div>
                  <div className="text-xs text-neutral-500">{firstTimers.length} added</div>
                </div>
                <div className="flex gap-2 mb-2">
                  <Input placeholder="Enter name e.g. Sarah Johnson" value={firstTimerName} onChange={(e) => setFirstTimerName(e.target.value)} />
                  <Button type="button" onClick={addFirstTimer}>Add</Button>
                </div>
                <div className="max-h-64 overflow-auto divide-y">
                  {firstTimers.map((ft) => (
                    <div key={`${ft.name}-${ft.added_at}`} className="flex items-center justify-between py-2">
                      <span className="text-sm">{ft.name}</span>
                      <button type="button" className="text-red-600 text-sm" onClick={() => removeFirstTimer(ft.name)}>Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Derived metrics preview */}
            <div className="text-sm text-neutral-700 dark:text-neutral-300">
              <div className="font-medium mb-1">Attendance Preview</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="border rounded-md p-2">Members: {metrics.attendance_breakdown.members}</div>
                <div className="border rounded-md p-2">First Timers: {metrics.attendance_breakdown.first_timers}</div>
                <div className="border rounded-md p-2">Total: {metrics.total_attendance}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button disabled={isSubmitting || createMut.isPending || imageUploadBusy} className="bg-black text-white border-black">{imageUploadBusy ? "Uploading..." : "Save Service"}</Button>
            </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

      )}

      {activeTab === "list" ? (
        <Card>
          <CardHeader>
            <div className="font-medium">Service List</div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loadingServices ? (
              <div className="flex items-center gap-2 text-sm text-neutral-500">Loading...</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    {columns.date && <th className="py-2 pr-4">DATE</th>}
                    {columns.type && <th className="py-2 pr-4">TYPE</th>}
                    {columns.topic && <th className="py-2 pr-4">TOPIC</th>}
                    {columns.total && <th className="py-2 pr-4">TOTAL ATTENDANCE</th>}
                    {columns.firstTimers && <th className="py-2 pr-4">FIRST TIMERS</th>}
                    {columns.converts && <th className="py-2 pr-4">CONVERTS</th>}
                    {columns.who && <th className="py-2 pr-4">WHO ATTENDED</th>}
                    {columns.images && <th className="py-2 pr-4">IMAGES</th>}
                    {columns.actions && <th className="py-2 pr-4">ACTIONS</th>}
                  </tr>
                </thead>
                <tbody>
                  {sortedServices.map((s) => {
                    const inferredFirstTimers = (s.first_timers?.length ?? (s.attendance_first_timers ?? 0));
                    const total = (s.attendees?.length ?? 0) + inferredFirstTimers;
                    const firstTimerCount = inferredFirstTimers;
                    const whoSummary = `${s.attendees?.length ?? 0} members${firstTimerCount ? `, ${firstTimerCount} first timers` : ""}`;
                    return (
                      <tr key={s.id} className="border-b">
                        {columns.date && <td className="py-2 pr-4 whitespace-nowrap"><button className="underline" style={{ color: 'var(--accent)' }} onClick={() => openDetail(s.id)}>{formatDateHumanUK(s.service_date)}</button></td>}
                        {columns.type && <td className="py-2 pr-4">{s.service_type ?? "Sunday service"}</td>}
                        {columns.topic && <td className="py-2 pr-4"><button className="underline" style={{ color: 'var(--accent)' }} onClick={() => openDetail(s.id)}>{s.topic ?? "-"}</button></td>}
                        {columns.total && <td className="py-2 pr-4">{total}</td>}
                        {columns.firstTimers && <td className="py-2 pr-4">{firstTimerCount}</td>}
                        {columns.converts && <td className="py-2 pr-4">{s.converts ?? 0}</td>}
                        {columns.who && <td className="py-2 pr-4">{whoSummary}</td>}
                        {columns.images && <td className="py-2 pr-4">{s.service_image_refs?.length ?? 0}</td>}
                        {columns.actions && (
                          <td 
                            className="py-2 pr-4 text-right cursor-pointer"
                            onClick={() => openDetail(s.id)}
                          >
                            <span onClick={(e) => e.stopPropagation()}>
                              <RowImageUpload service={s} />
                            </span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); deleteMut.mutate(s.id); }} 
                              className="ml-3 text-red-600"
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

