"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createMember, listMembers, removeMember, updateMember, findDuplicateMembers } from "@/services/members";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button, Input, Label, Select } from "@/components/ui";
import { Download, Copy } from "lucide-react";
import { Plus, User, X, Edit3 } from "lucide-react";
import type { MemberRecord } from "@/types/member";
import { PageHeader } from "@/components/ui/PageHeader";

const schema = z.object({
  first_name: z.string().min(1, "First name is required"),
  surname: z.string().optional(),
  phone_number: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  age: z.string().optional(),
  member_type: z.enum(["visitor", "potential", "member"]).default("member"),
  member_status: z.enum(["Regular", "Irregular", "Dormant"]).optional(),
  church_role: z.string().optional(),
  marital_status: z.enum(["Single", "Married", "Divorced", "Widowed"]).optional(),
  degree: z.string().optional(),
  employed: z.enum(["Yes", "No"]).optional(),
  tithe_payer: z.enum(["Yes", "No"]).optional(),
  baptised: z.enum(["Yes", "No"]).optional(),
  schools: z.array(z.string()).optional(), // Array of selected schools
  date_of_birth: z.string().optional(),
  join_date: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const SCHOOL_OPTIONS = [
  "Annual Global Exams",
  "Proof of Shepherding Exam",
  "School of the Word",
  "Fruitful believers school",
  "School Of The World",
  "School of victorious living",
  "No School",
  "School of Prayer"
];

export default function MembersPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberRecord | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "dashboard">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "visitor" | "potential" | "member">("all");
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [dashMemberStatus, setDashMemberStatus] = useState<string>("All");
  const [dashAgeGroup, setDashAgeGroup] = useState<string>("All");
  const [dashBaptised, setDashBaptised] = useState<string>("All");

  const { data: members, isLoading, error } = useQuery({
    queryKey: ["members"],
    queryFn: listMembers,
  });

  // Edit profile state & form
  const [isEditing, setIsEditing] = useState(false);
  const [editSelectedSchools, setEditSelectedSchools] = useState<string[]>([]);
  const { 
    register: registerEdit, 
    handleSubmit: handleSubmitEdit, 
    reset: resetEdit, 
    formState: { errors: editErrors, isSubmitting: isSubmittingEdit } 
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const copyMembers = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(filteredMembers, null, 2));
      alert("Members copied to clipboard");
    } catch (e) {
      console.error(e);
      alert("Failed to copy");
    }
  };

  const exportCsv = () => {
    const header = [
      "full_name","first_name","surname","phone_number","email","member_type","member_status","church_role","address","age","tithe_payer","baptised","join_date","date_of_birth"
    ];
    const rows = filteredMembers.map(m => [
      m.full_name ?? `${m.first_name}${m.surname ? ` ${m.surname}` : ""}`,
      m.first_name ?? "",
      m.surname ?? "",
      m.phone_number ?? "",
      m.email ?? "",
      m.member_type ?? "",
      m.member_status ?? "",
      m.church_role ?? "",
      m.address ?? "",
      m.age ?? "",
      m.tithe_payer === true ? "Yes" : m.tithe_payer === false ? "No" : "",
      m.baptised === true ? "Yes" : m.baptised === false ? "No" : "",
      formatDate(m.join_date),
      formatDate(m.date_of_birth)
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v ?? "").replace(/"/g,'\"')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "members.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const [showColumns, setShowColumns] = useState(false);
  const [columns, setColumns] = useState({
    name: true,
    phone: true,
    email: true,
    type: true,
    status: true,
    role: true,
    actions: true,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({ 
    resolver: zodResolver(schema),
    defaultValues: {
      member_type: "member",
      join_date: new Date().toISOString().slice(0, 10)
    }
  });

  const createMut = useMutation({
    mutationFn: (v: FormValues) => {
      const emergency_contact = (v.emergency_contact_name || v.emergency_contact_phone || v.emergency_contact_relationship) ? {
        name: v.emergency_contact_name,
        phone: v.emergency_contact_phone,
        relationship: v.emergency_contact_relationship
      } : undefined;

      return createMember({ 
        ...v, 
        full_name: `${v.first_name}${v.surname ? ` ${v.surname}` : ""}`,
        schools: selectedSchools.length > 0 ? selectedSchools : undefined,
        emergency_contact,
        age: v.age ? (isNaN(Number(v.age)) ? v.age : Number(v.age)) : undefined,
        employed: v.employed === "Yes" ? true : v.employed === "No" ? false : undefined,
        tithe_payer: v.tithe_payer === "Yes" ? true : v.tithe_payer === "No" ? false : undefined,
        baptised: v.baptised === "Yes" ? true : v.baptised === "No" ? false : undefined,
      } as any);
    },
    onSuccess: () => {
      reset({
        member_type: "member",
        join_date: new Date().toISOString().slice(0, 10)
      });
      setSelectedSchools([]);
      qc.invalidateQueries({ queryKey: ["members"] });
      setShowCreate(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MemberRecord> }) => updateMember(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      setShowProfile(false);
      setSelectedMember(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => removeMember(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      setShowProfile(false);
      setSelectedMember(null);
    },
  });

  const filteredMembers = (members as MemberRecord[] | undefined)?.filter(m => {
    const matchesSearch = !searchQuery || 
      (m.full_name ?? `${m.first_name}${m.surname ? ` ${m.surname}` : ""}`).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.phone_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === "all" || m.member_type === filterType;
    
    return matchesSearch && matchesType;
  }) || [];

  // Dashboard helpers
  const parseAge = (age: MemberRecord["age"]) => {
    if (age === undefined || age === null) return undefined;
    if (typeof age === "number") return age;
    // try extract first number from string like "19-24yrs"
    const n = Number(String(age).match(/\d+/)?.[0] ?? NaN);
    return Number.isFinite(n) ? n : undefined;
  };

  const inDashFilters = (m: MemberRecord) => {
    const byStatus = dashMemberStatus === "All" || (m.member_status ?? "") === dashMemberStatus;
    const byBaptised =
      dashBaptised === "All" ||
      ((m.baptised === true ? "Yes" : m.baptised === false ? "No" : m.baptised ?? "") === dashBaptised);
    const a = parseAge(m.age);
    let byAge = true;
    if (dashAgeGroup !== "All") {
      if (dashAgeGroup === "Under 18") byAge = (a ?? 0) < 18;
      else if (dashAgeGroup === "19-24yrs") byAge = (a ?? 0) >= 19 && (a ?? 0) <= 24;
      else if (dashAgeGroup === "25-34yrs") byAge = (a ?? 0) >= 25 && (a ?? 0) <= 34;
      else if (dashAgeGroup === "35-44yrs") byAge = (a ?? 0) >= 35 && (a ?? 0) <= 44;
      else if (dashAgeGroup === "45+") byAge = (a ?? 0) >= 45;
    }
    return byStatus && byAge && byBaptised;
  };

  const dashboardMembers = filteredMembers.filter(inDashFilters);

  const totalMembers = dashboardMembers.length;
  const activeMembers = dashboardMembers.filter(m => m.member_status === "Regular").length;
  const newThisMonth = dashboardMembers.filter(m => {
    const d = m.join_date ? new Date(m.join_date) : undefined;
    if (!d || isNaN(d.getTime())) return false;
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const membersByRole = new Set(dashboardMembers.map(m => m.church_role).filter(Boolean)).size;

  const openProfile = (member: MemberRecord) => {
    setSelectedMember(member);
    setShowProfile(true);
    setIsEditing(false);
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) return value.join(", ") || "-";
    return String(value) || "-";
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return "-";
    try {
      // Check if it's already in UK format (DD/MM/YYYY)
      if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) return dateStr;
      
      // Convert ISO date to UK format
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Ensure UK date placeholders
  const ukPlaceholder = "dd/mm/yyyy";

  const checkForDuplicates = async () => {
    if (checkingDuplicates) return;
    
    setCheckingDuplicates(true);
    try {
      const { duplicates, total } = await findDuplicateMembers();
      
      if (total === 0) {
        alert("Great! No duplicate members found.");
      } else {
        const duplicatesList = duplicates.map(group => 
          `• ${group[0].full_name ?? `${group[0].first_name} ${group[0].surname || ''}`} (${group.length} entries)`
        ).join('\n');
        
        const message = `Found ${total} duplicate entries across ${duplicates.length} people:\n\n${duplicatesList}\n\nTo clean these up, you may need to manually review and delete duplicate entries in the Central Members list.`;
        alert(message);
      }
    } catch (err) {
      console.error("Error checking duplicates:", err);
      alert("Error checking for duplicates. Please try again.");
    } finally {
      setCheckingDuplicates(false);
    }
  };

  const toggleSchool = (school: string) => {
    setSelectedSchools(prev => 
      prev.includes(school) 
        ? prev.filter(s => s !== school)
        : [...prev, school]
    );
  };

  const toggleEditSchool = (school: string) => {
    setEditSelectedSchools(prev => 
      prev.includes(school)
        ? prev.filter(s => s !== school)
        : [...prev, school]
    );
  };

  const startEditProfile = () => {
    if (!selectedMember) return;
    setIsEditing(true);
    setEditSelectedSchools(selectedMember.schools ?? []);
    resetEdit({
      first_name: selectedMember.first_name ?? "",
      surname: selectedMember.surname ?? "",
      phone_number: selectedMember.phone_number ?? "",
      email: selectedMember.email ?? "",
      address: selectedMember.address ?? "",
      age: selectedMember.age !== undefined && selectedMember.age !== null 
        ? (typeof selectedMember.age === "number" ? String(selectedMember.age) : String(selectedMember.age)) 
        : "",
      member_type: (selectedMember.member_type as any) ?? "member",
      member_status: (selectedMember.member_status as any) ?? "",
      church_role: selectedMember.church_role ?? "",
      marital_status: (selectedMember.marital_status as any) ?? "",
      degree: selectedMember.degree ?? "",
      employed: selectedMember.employed === true ? "Yes" : selectedMember.employed === false ? "No" : "",
      tithe_payer: selectedMember.tithe_payer === true ? "Yes" : selectedMember.tithe_payer === false ? "No" : "",
      baptised: selectedMember.baptised === true ? "Yes" : selectedMember.baptised === false ? "No" : "",
      date_of_birth: selectedMember.date_of_birth ?? "",
      join_date: selectedMember.join_date ?? "",
      emergency_contact_name: selectedMember.emergency_contact?.name ?? "",
      emergency_contact_phone: selectedMember.emergency_contact?.phone ?? "",
      emergency_contact_relationship: selectedMember.emergency_contact?.relationship ?? "",
    } as any);
  };

  const onSubmitEdit = (v: FormValues) => {
    if (!selectedMember) return;
    const emergency_contact = (v.emergency_contact_name || v.emergency_contact_phone || v.emergency_contact_relationship) ? {
      name: v.emergency_contact_name,
      phone: v.emergency_contact_phone,
      relationship: v.emergency_contact_relationship
    } : undefined;

    const patch: Partial<MemberRecord> = {
      first_name: v.first_name,
      surname: v.surname || undefined,
      full_name: `${v.first_name}${v.surname ? ` ${v.surname}` : ""}`,
      phone_number: v.phone_number || "",
      email: v.email || undefined,
      address: v.address || undefined,
      age: v.age ? (isNaN(Number(v.age)) ? v.age : Number(v.age)) : undefined,
      member_type: v.member_type,
      member_status: (v.member_status as any) || undefined,
      church_role: v.church_role || undefined,
      marital_status: (v.marital_status as any) || undefined,
      degree: v.degree || undefined,
      employed: v.employed === "Yes" ? true : v.employed === "No" ? false : undefined,
      tithe_payer: v.tithe_payer === "Yes" ? true : v.tithe_payer === "No" ? false : undefined,
      baptised: v.baptised === "Yes" ? true : v.baptised === "No" ? false : undefined,
      schools: editSelectedSchools.length > 0 ? editSelectedSchools : [],
      date_of_birth: v.date_of_birth || undefined,
      join_date: v.join_date || undefined,
      emergency_contact,
    };

    updateMut.mutate({ id: selectedMember.id, data: patch });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Central Members"
        description="Manage church members and their profiles"
        actions={
          <>
            <Button 
              onClick={checkForDuplicates} 
              disabled={checkingDuplicates}
              className="bg-yellow-600 text-white border-yellow-600"
            >
              <span className="inline-flex items-center gap-2">
                <User size={16} /> 
                {checkingDuplicates ? "Checking..." : "Check Duplicates"}
              </span>
            </Button>
            <Button type="button" onClick={copyMembers}>
              <span className="inline-flex items-center gap-2"><Copy size={14}/> Copy</span>
            </Button>
            <Button type="button" onClick={exportCsv}>
              <span className="inline-flex items-center gap-2"><Download size={14}/> CSV</span>
            </Button>
            <div className="relative">
              <Button type="button" onClick={() => setShowColumns(v => !v)}>Columns</Button>
              {showColumns && (
                <div className="absolute right-0 mt-2 w-56 rounded-md border p-2 z-10" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                  {Object.entries(columns).map(([key, value]) => (
                    <label key={key} className="flex items-center justify-between py-1 text-sm">
                      <span className="capitalize">{key}</span>
                      <input type="checkbox" checked={value as boolean} onChange={() => setColumns(c => ({ ...(c as any), [key]: !(c as any)[key] }))} />
                    </label>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={() => setShowCreate(true)} className="bg-neutral-900 text-white border-neutral-900">
              <span className="inline-flex items-center gap-2"><Plus size={16} /> Add Member</span>
            </Button>
          </>
        }
      />

      {/* Tab Switcher */}
      <div className="flex gap-2">
        <Button
          className={activeTab === "list" ? "" : "opacity-70"}
          onClick={() => setActiveTab("list")}
        >
          Member List
        </Button>
        <Button
          className={activeTab === "dashboard" ? "" : "opacity-70"}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </Button>
      </div>

      {/* Filters (List view) */}
      {activeTab === "list" && (
      <Card>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input 
                placeholder="Search by name, phone, or email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={filterType} onChange={(e) => setFilterType(e.target.value as any)}>
                <option value="all">All Types</option>
                <option value="member">Members</option>
                <option value="visitor">Visitors</option>
                <option value="potential">Potential</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Members List */}
      {activeTab === "list" && (isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-neutral-500">Loading members...</div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-red-500">Error loading members: {String(error)}</div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="font-medium">Members ({filteredMembers.length})</div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  {columns.name && <th className="py-2 pr-4">Name</th>}
                  {columns.phone && <th className="py-2 pr-4">Phone</th>}
                  {columns.email && <th className="py-2 pr-4">Email</th>}
                  {columns.type && <th className="py-2 pr-4">Type</th>}
                  {columns.status && <th className="py-2 pr-4">Status</th>}
                  {columns.role && <th className="py-2 pr-4">Church Role</th>}
                  {columns.actions && <th className="py-2 pr-4">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((m) => (
                  <tr key={m.id} className="border-b hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    {columns.name && <td className="py-2 pr-4">
                      <button 
                        onClick={() => openProfile(m)}
                        className="font-medium flex items-center gap-2 underline"
                        style={{ color: 'var(--accent)' }}
                      >
                        <User size={14} />
                        {m.full_name ?? `${m.first_name}${m.surname ? ` ${m.surname}` : ""}`}
                      </button>
                    </td>}
                    {columns.phone && <td className="py-2 pr-4">{m.phone_number || "-"}</td>}
                    {columns.email && <td className="py-2 pr-4">{m.email || "-"}</td>}
                    {columns.type && <td className="py-2 pr-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        m.member_type === "member" ? "bg-green-100 text-green-800" :
                        m.member_type === "potential" ? "bg-yellow-100 text-yellow-800" :
                        ""
                      }`} style={m.member_type === "visitor" ? { backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' } : undefined}>
                        {m.member_type}
                      </span>
                    </td>}
                    {columns.status && <td className="py-2 pr-4">{m.member_status || "-"}</td>}
                    {columns.role && <td className="py-2 pr-4">{m.church_role || "-"}</td>}
                    {columns.actions && <td 
                      className="py-2 pr-4 text-right cursor-pointer"
                      onClick={() => openProfile(m)}
                    >
                      <button 
                        onClick={(e) => { e.stopPropagation(); openProfile(m); }}
                        className="mr-3 underline"
                        style={{ color: 'var(--accent)' }}
                      >
                        View
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteMut.mutate(m.id); }} 
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredMembers.length === 0 && (
              <div className="text-center py-8 text-neutral-500">
                No members found matching your criteria.
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Dashboard View */}
      {activeTab === "dashboard" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Map */}
          <div className="xl:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="font-medium">Member Distribution Map</div>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[420px] rounded-md border" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}>
                  <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--muted-foreground)' }}>
                    Map coming soon. Markers will show member locations.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Filters and KPIs */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Card><CardContent><div className="text-sm text-neutral-500">Total Members</div><div className="text-2xl font-semibold">{totalMembers}</div></CardContent></Card>
              <Card><CardContent><div className="text-sm text-neutral-500">Active Members</div><div className="text-2xl font-semibold">{activeMembers}</div></CardContent></Card>
              <Card><CardContent><div className="text-sm text-neutral-500">New This Month</div><div className="text-2xl font-semibold">{newThisMonth}</div></CardContent></Card>
              <Card><CardContent><div className="text-sm text-neutral-500">Members by Role</div><div className="text-2xl font-semibold">{membersByRole}</div></CardContent></Card>
            </div>

            <Card>
              <CardHeader>
                <div className="font-medium">Dashboard Filters</div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label>Member Status</Label>
                    <Select value={dashMemberStatus} onChange={(e) => setDashMemberStatus(e.target.value)}>
                      <option>All</option>
                      <option>Regular</option>
                      <option>Irregular</option>
                      <option>Dormant</option>
                    </Select>
                  </div>
                  <div>
                    <Label>Age Group</Label>
                    <Select value={dashAgeGroup} onChange={(e) => setDashAgeGroup(e.target.value)}>
                      <option>All</option>
                      <option>Under 18</option>
                      <option>19-24yrs</option>
                      <option>25-34yrs</option>
                      <option>35-44yrs</option>
                      <option>45+</option>
                    </Select>
                  </div>
                  <div>
                    <Label>Baptism Status</Label>
                    <Select value={dashBaptised} onChange={(e) => setDashBaptised(e.target.value)}>
                      <option>All</option>
                      <option>Yes</option>
                      <option>No</option>
                    </Select>
                  </div>
                  <div className="pt-2">
                    <Button type="button" onClick={() => { setDashMemberStatus("All"); setDashAgeGroup("All"); setDashBaptised("All"); }}>
                      Reset All
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Create Member Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-4xl px-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="font-medium">Add New Member</div>
                  <button onClick={() => setShowCreate(false)} aria-label="Close" className="p-1 hover:opacity-80">
                    <X size={18} />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit((v) => createMut.mutate(v))} className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="font-medium mb-3">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label>First Name *</Label>
                        <Input className="mt-1" {...register("first_name")} />
                        {errors.first_name && <p className="text-xs text-red-600">{errors.first_name.message}</p>}
                      </div>
                      <div>
                        <Label>Surname</Label>
                        <Input className="mt-1" {...register("surname")} />
                      </div>
                      <div>
                        <Label>Age</Label>
                        <Input className="mt-1" placeholder="e.g. 25 or 25-34yrs" {...register("age")} />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="font-medium mb-3">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label>Phone Number</Label>
                        <Input className="mt-1" type="tel" {...register("phone_number")} />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input className="mt-1" type="email" {...register("email")} />
                        {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
                      </div>
                      <div className="md:col-span-2">
                        <Label>Address</Label>
                        <Input className="mt-1" {...register("address")} />
                      </div>
                    </div>
                  </div>

                  {/* Church Information */}
                  <div>
                    <h3 className="font-medium mb-3">Church Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label>Member Type</Label>
                        <Select className="mt-1" {...register("member_type")}>
                          <option value="visitor">Visitor</option>
                          <option value="potential">Potential</option>
                          <option value="member">Member</option>
                        </Select>
                      </div>
                      <div>
                        <Label>Member Status</Label>
                        <Select className="mt-1" {...register("member_status")}>
                          <option value="">Select Status</option>
                          <option value="Regular">Regular</option>
                          <option value="Irregular">Irregular</option>
                          <option value="Dormant">Dormant</option>
                        </Select>
                      </div>
                      <div>
                        <Label>Church Role</Label>
                        <Input className="mt-1" placeholder="e.g. Elder, Deacon, Usher" {...register("church_role")} />
                      </div>
                      <div>
                        <Label>Join Date</Label>
                        <Input className="mt-1" type="date" {...register("join_date")} />
                      </div>
                      <div>
                        <Label>Date of Birth</Label>
                        <Input className="mt-1" type="date" {...register("date_of_birth")} />
                      </div>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div>
                    <h3 className="font-medium mb-3">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label>Marital Status</Label>
                        <Select className="mt-1" {...register("marital_status")}>
                          <option value="">Select Status</option>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Divorced">Divorced</option>
                          <option value="Widowed">Widowed</option>
                        </Select>
                      </div>
                      <div>
                        <Label>Employed</Label>
                        <Select className="mt-1" {...register("employed")}>
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </Select>
                      </div>
                      <div>
                        <Label>Degree</Label>
                        <Input className="mt-1" placeholder="e.g. Bachelor's, Master's, PhD" {...register("degree")} />
                      </div>
                    </div>
                  </div>

                  {/* Spiritual Information */}
                  <div>
                    <h3 className="font-medium mb-3">Spiritual Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label>Tithe Payer</Label>
                        <Select className="mt-1" {...register("tithe_payer")}>
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </Select>
                      </div>
                      <div>
                        <Label>Baptised</Label>
                        <Select className="mt-1" {...register("baptised")}>
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Education & Emergency Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-3">Schools Attended</h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {SCHOOL_OPTIONS.map((school) => (
                          <label key={school} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedSchools.includes(school)}
                              onChange={() => toggleSchool(school)}
                              className="rounded border-gray-300 accent-[var(--accent)]"
                            />
                            <span className="text-sm">{school}</span>
                          </label>
                        ))}
                      </div>
                      {selectedSchools.length > 0 && (
                        <div className="mt-2 text-xs text-neutral-600">
                          Selected: {selectedSchools.join(", ")}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium mb-3">Emergency Contact</h3>
                      <div className="space-y-3">
                        <div>
                          <Label>Contact Name</Label>
                          <Input className="mt-1" {...register("emergency_contact_name")} />
                        </div>
                        <div>
                          <Label>Contact Phone</Label>
                          <Input className="mt-1" type="tel" {...register("emergency_contact_phone")} />
                        </div>
                        <div>
                          <Label>Relationship</Label>
                          <Input className="mt-1" placeholder="e.g. Spouse, Parent, Sibling" {...register("emergency_contact_relationship")} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-4">
                    <Button type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
                    <Button disabled={isSubmitting} className="bg-black text-white border-black">
                      {isSubmitting ? "Creating..." : "Create Member"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Member Profile Modal */}
      {showProfile && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowProfile(false)} />
          <div className="relative w-full max-w-4xl px-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center">
                      <User size={20} />
                    </div>
                    <div>
                      <div className="font-medium text-lg">
                        {selectedMember.full_name ?? `${selectedMember.first_name}${selectedMember.surname ? ` ${selectedMember.surname}` : ""}`}
                      </div>
                      <div className="text-sm text-neutral-500 capitalize">{selectedMember.member_type}</div>
                    </div>
                  </div>
                  <button onClick={() => setShowProfile(false)} aria-label="Close" className="p-1 hover:opacity-80">
                    <X size={18} />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {!isEditing ? (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <User size={16} />
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-neutral-500">Full Name</div>
                        <div className="font-medium">{formatValue(selectedMember.full_name ?? `${selectedMember.first_name}${selectedMember.surname ? ` ${selectedMember.surname}` : ""}`)}</div>
                      </div>
                      <div>
                        <div className="text-neutral-500">Age</div>
                        <div className="font-medium">{formatValue(selectedMember.age)}</div>
                      </div>
                      <div>
                        <div className="text-neutral-500">Date of Birth</div>
                        <div className="font-medium">{formatDate(selectedMember.date_of_birth)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="font-medium mb-3">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-neutral-500">Phone Number</div>
                        <div className="font-medium">{formatValue(selectedMember.phone_number)}</div>
                      </div>
                      <div>
                        <div className="text-neutral-500">Email</div>
                        <div className="font-medium">{formatValue(selectedMember.email)}</div>
                      </div>
                      <div className="md:col-span-2">
                        <div className="text-neutral-500">Address</div>
                        <div className="font-medium">{formatValue(selectedMember.address)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Church Information */}
                  <div>
                    <h3 className="font-medium mb-3">Church Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-neutral-500">Member Type</div>
                        <div className="font-medium capitalize">{formatValue(selectedMember.member_type)}</div>
                      </div>
                      <div>
                        <div className="text-neutral-500">Member Status</div>
                        <div className="font-medium">{formatValue(selectedMember.member_status)}</div>
                      </div>
                      <div>
                        <div className="text-neutral-500">Church Role</div>
                        <div className="font-medium">{formatValue(selectedMember.church_role)}</div>
                      </div>
                      <div>
                        <div className="text-neutral-500">Join Date</div>
                        <div className="font-medium">{formatDate(selectedMember.join_date)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div>
                    <h3 className="font-medium mb-3">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-neutral-500">Marital Status</div>
                        <div className="font-medium">{formatValue(selectedMember.marital_status)}</div>
                      </div>
                      <div>
                        <div className="text-neutral-500">Employed</div>
                        <div className="font-medium">{formatValue(selectedMember.employed)}</div>
                      </div>
                      <div>
                        <div className="text-neutral-500">Degree</div>
                        <div className="font-medium">{formatValue(selectedMember.degree)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Spiritual Information */}
                  <div>
                    <h3 className="font-medium mb-3">Spiritual Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-neutral-500">Tithe Payer</div>
                        <div className="font-medium">{formatValue(selectedMember.tithe_payer)}</div>
                      </div>
                      <div>
                        <div className="text-neutral-500">Baptised</div>
                        <div className="font-medium">{formatValue(selectedMember.baptised)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Education */}
                  <div>
                    <h3 className="font-medium mb-3">Education</h3>
                    <div className="text-sm">
                      <div className="text-neutral-500">Schools</div>
                      <div className="font-medium">{formatValue(selectedMember.schools)}</div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  {selectedMember.emergency_contact && (
                    <div>
                      <h3 className="font-medium mb-3">Emergency Contact</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-neutral-500">Name</div>
                          <div className="font-medium">{formatValue(selectedMember.emergency_contact.name)}</div>
                        </div>
                        <div>
                          <div className="text-neutral-500">Phone</div>
                          <div className="font-medium">{formatValue(selectedMember.emergency_contact.phone)}</div>
                        </div>
                        <div>
                          <div className="text-neutral-500">Relationship</div>
                          <div className="font-medium">{formatValue(selectedMember.emergency_contact.relationship)}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-4">
                    <Button type="button" onClick={() => setShowProfile(false)}>Close</Button>
                    <Button className="bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]" onClick={startEditProfile}>
                      <Edit3 size={14} className="mr-2" /> Edit Profile
                    </Button>
                  </div>
                </div>
                ) : (
                <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="font-medium mb-3">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label>First Name *</Label>
                        <Input className="mt-1" {...registerEdit("first_name")} />
                        {editErrors.first_name && <p className="text-xs text-red-600">{editErrors.first_name.message as any}</p>}
                      </div>
                      <div>
                        <Label>Surname</Label>
                        <Input className="mt-1" {...registerEdit("surname")} />
                      </div>
                      <div>
                        <Label>Age</Label>
                        <Input className="mt-1" placeholder="e.g. 25 or 25-34yrs" {...registerEdit("age")} />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="font-medium mb-3">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label>Phone Number</Label>
                        <Input className="mt-1" type="tel" {...registerEdit("phone_number")} />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input className="mt-1" type="email" {...registerEdit("email")} />
                        {editErrors.email && <p className="text-xs text-red-600">{editErrors.email.message as any}</p>}
                      </div>
                      <div className="md:col-span-2">
                        <Label>Address</Label>
                        <Input className="mt-1" {...registerEdit("address")} />
                      </div>
                    </div>
                  </div>

                  {/* Church Information */}
                  <div>
                    <h3 className="font-medium mb-3">Church Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label>Member Type</Label>
                        <Select className="mt-1" {...registerEdit("member_type")}>
                          <option value="visitor">Visitor</option>
                          <option value="potential">Potential</option>
                          <option value="member">Member</option>
                        </Select>
                      </div>
                      <div>
                        <Label>Member Status</Label>
                        <Select className="mt-1" {...registerEdit("member_status")}>
                          <option value="">Select Status</option>
                          <option value="Regular">Regular</option>
                          <option value="Irregular">Irregular</option>
                          <option value="Dormant">Dormant</option>
                        </Select>
                      </div>
                      <div>
                        <Label>Church Role</Label>
                        <Input className="mt-1" placeholder="e.g. Elder, Deacon, Usher" {...registerEdit("church_role")} />
                      </div>
                      <div>
                        <Label>Join Date</Label>
                        <Input className="mt-1" type="date" {...registerEdit("join_date")} />
                      </div>
                      <div>
                        <Label>Date of Birth</Label>
                        <Input className="mt-1" type="date" {...registerEdit("date_of_birth")} />
                      </div>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div>
                    <h3 className="font-medium mb-3">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label>Marital Status</Label>
                        <Select className="mt-1" {...registerEdit("marital_status")}>
                          <option value="">Select Status</option>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Divorced">Divorced</option>
                          <option value="Widowed">Widowed</option>
                        </Select>
                      </div>
                      <div>
                        <Label>Employed</Label>
                        <Select className="mt-1" {...registerEdit("employed")}>
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </Select>
                      </div>
                      <div>
                        <Label>Degree</Label>
                        <Input className="mt-1" placeholder="e.g. Bachelor's, Master's, PhD" {...registerEdit("degree")} />
                      </div>
                    </div>
                  </div>

                  {/* Spiritual Information */}
                  <div>
                    <h3 className="font-medium mb-3">Spiritual Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label>Tithe Payer</Label>
                        <Select className="mt-1" {...registerEdit("tithe_payer")}>
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </Select>
                      </div>
                      <div>
                        <Label>Baptised</Label>
                        <Select className="mt-1" {...registerEdit("baptised")}>
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Education & Emergency Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-3">Schools Attended</h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {SCHOOL_OPTIONS.map((school) => (
                          <label key={school} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editSelectedSchools.includes(school)}
                              onChange={() => toggleEditSchool(school)}
                              className="rounded border-gray-300 accent-[var(--accent)]"
                            />
                            <span className="text-sm">{school}</span>
                          </label>
                        ))}
                      </div>
                      {editSelectedSchools.length > 0 && (
                        <div className="mt-2 text-xs text-neutral-600">
                          Selected: {editSelectedSchools.join(", ")}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium mb-3">Emergency Contact</h3>
                      <div className="space-y-3">
                        <div>
                          <Label>Contact Name</Label>
                          <Input className="mt-1" {...registerEdit("emergency_contact_name")} />
                        </div>
                        <div>
                          <Label>Contact Phone</Label>
                          <Input className="mt-1" type="tel" {...registerEdit("emergency_contact_phone")} />
                        </div>
                        <div>
                          <Label>Relationship</Label>
                          <Input className="mt-1" placeholder="e.g. Spouse, Parent, Sibling" {...registerEdit("emergency_contact_relationship")} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-4">
                    <Button type="button" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button disabled={isSubmittingEdit} className="bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]">
                      {isSubmittingEdit ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}


