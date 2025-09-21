"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listMembers, promoteMember, updateMember } from "@/services/members";
import { Card } from "@/components/ui/Card";
import { Button, Input, Select } from "@/components/ui";
import { Copy, Download, Columns } from "lucide-react";
import { MemberRecord } from "@/types/member";
import { PageHeader } from "@/components/ui/PageHeader";

export default function FirstTimersPage() {
  const [selectedMember, setSelectedMember] = useState<MemberRecord | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const qc = useQueryClient();

  const { data: allMembers = [], isLoading, error } = useQuery({
    queryKey: ["members"],
    queryFn: listMembers,
  });

  // Basic filters
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Filter for first-timers (visitors only)
  const firstTimers = useMemo(() => {
    return allMembers
      .filter(m => m.member_type === "visitor")
      .filter(m => {
        const q = search.trim().toLowerCase();
        const matchesSearch = !q || (m.full_name || "").toLowerCase().includes(q);
        let matchesGender = true;
        if (gender !== "all") {
          matchesGender = (m.gender as any) === gender;
        }
        const firstVisit = m.visitor_info?.first_visit_date ? new Date(m.visitor_info.first_visit_date) : undefined;
        const fromOk = !dateFrom || (firstVisit && firstVisit >= new Date(dateFrom));
        const toOk = !dateTo || (firstVisit && firstVisit <= new Date(dateTo));
        return matchesSearch && matchesGender && fromOk && toOk;
      });
  }, [allMembers, search, gender, dateFrom, dateTo]);

  // Mutation to promote visitor to potential member
  const promoteMut = useMutation({
    mutationFn: (memberId: string) => promoteMember(memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      setShowProfile(false);
      setSelectedMember(null);
    },
  });

  // Mutation to add follow-up notes
  const addNotesMut = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => 
      updateMember(id, { 
        visitor_info: { 
          ...selectedMember?.visitor_info, 
          follow_up_notes: notes 
        } 
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
    },
  });

  const copyList = async () => {
    await navigator.clipboard.writeText(JSON.stringify(firstTimers, null, 2));
    alert("First timers copied to clipboard");
  };

  const exportCsv = () => {
    const header = ["full_name","phone_number","first_visit","last_visit","visit_count"];
    const rows = firstTimers.map(ft => [
      ft.full_name ?? "",
      ft.phone_number ?? "",
      ft.visitor_info?.first_visit_date ?? "",
      ft.visitor_info?.last_visit_date ?? "",
      String(ft.visitor_info?.total_visits ?? 1)
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v ?? "").replace(/"/g,'\"')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "first_timers.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long", 
      year: "numeric"
    });
  };

  if (isLoading) return <div className="p-6" style={{ color: 'var(--foreground)' }}>Loading first-timers...</div>;
  if (error) return <div className="p-6" style={{ color: 'var(--destructive)' }}>Error loading first-timers</div>;

  return (
    <div className="space-y-8">
      <PageHeader
        title="First Timers"
        description="Visitors who need follow-up and potential promotion to membership"
        actions={
          <>
            <Button type="button" onClick={copyList}><span className="inline-flex items-center gap-2"><Copy size={14}/> Copy</span></Button>
            <Button type="button" onClick={exportCsv}><span className="inline-flex items-center gap-2"><Download size={14}/> CSV</span></Button>
          </>
        }
      />

      {/* Filters */}
      <Card className="mb-4">
        <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} />
          <Select value={gender} onChange={e => setGender(e.target.value)}>
            <option value="all">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </Select>
          <Input placeholder="dd/mm/yyyy" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <Input placeholder="dd/mm/yyyy" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
      </Card>

      {firstTimers.length === 0 ? (
        <Card className="p-8 text-center">
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--card-foreground)' }}>No First-Timers Yet</h3>
          <p style={{ color: 'var(--muted-foreground)' }}>
            First-time visitors will appear here when they attend a Sunday service.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {firstTimers.map((member) => (
            <Card key={member.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--card-foreground)' }}>{member.full_name}</h3>
                    <span 
                      className="px-2 py-1 text-xs rounded-full"
                      style={{ 
                        backgroundColor: 'var(--accent)', 
                        color: 'var(--accent-foreground)' 
                      }}
                    >
                      Visitor
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium" style={{ color: 'var(--card-foreground)' }}>First Visit:</span>
                      <p style={{ color: 'var(--muted-foreground)' }}>
                        {formatDate(member.visitor_info?.first_visit_date)}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: 'var(--card-foreground)' }}>Last Visit:</span>
                      <p style={{ color: 'var(--muted-foreground)' }}>
                        {formatDate(member.visitor_info?.last_visit_date)}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: 'var(--card-foreground)' }}>Total Visits:</span>
                      <p style={{ color: 'var(--muted-foreground)' }}>
                        {member.visitor_info?.total_visits || 1}
                      </p>
                    </div>
                  </div>

                  {member.phone_number && (
                    <div className="mt-2 text-sm">
                      <span className="font-medium" style={{ color: 'var(--card-foreground)' }}>Phone:</span>
                      <span style={{ color: 'var(--muted-foreground)' }} className="ml-1">{member.phone_number}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedMember(member);
                      setShowProfile(true);
                    }}
                    className="px-3 py-1 text-sm rounded-md transition-colors hover:opacity-80"
                    style={{ 
                      backgroundColor: 'var(--muted)', 
                      color: 'var(--muted-foreground)' 
                    }}
                  >
                    View Details
                  </button>
                  
                  {(member.visitor_info?.total_visits || 1) >= 2 && (
                    <button
                      onClick={() => promoteMut.mutate(member.id)}
                      disabled={promoteMut.isPending}
                      className="px-3 py-1 text-sm rounded-md disabled:opacity-50 transition-colors hover:opacity-80"
                      style={{ 
                        backgroundColor: 'var(--success)', 
                        color: 'var(--success-foreground)' 
                      }}
                    >
                      {promoteMut.isPending ? "Promoting..." : "Promote to Potential"}
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Member Profile Modal */}
      {showProfile && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div 
            className="rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            style={{ 
              backgroundColor: 'var(--card)', 
              color: 'var(--card-foreground)' 
            }}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold" style={{ color: 'var(--card-foreground)' }}>First-Timer Profile</h2>
                <button
                  onClick={() => {
                    setShowProfile(false);
                    setSelectedMember(null);
                  }}
                  className="transition-colors hover:opacity-70"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium" style={{ color: 'var(--card-foreground)' }}>Full Name</label>
                    <p style={{ color: 'var(--card-foreground)' }}>{selectedMember.full_name}</p>
                  </div>
                  <div>
                    <label className="font-medium" style={{ color: 'var(--card-foreground)' }}>Phone Number</label>
                    <p style={{ color: 'var(--card-foreground)' }}>{selectedMember.phone_number || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="font-medium" style={{ color: 'var(--card-foreground)' }}>First Visit</label>
                    <p style={{ color: 'var(--card-foreground)' }}>{formatDate(selectedMember.visitor_info?.first_visit_date)}</p>
                  </div>
                  <div>
                    <label className="font-medium" style={{ color: 'var(--card-foreground)' }}>Last Visit</label>
                    <p style={{ color: 'var(--card-foreground)' }}>{formatDate(selectedMember.visitor_info?.last_visit_date)}</p>
                  </div>
                  <div>
                    <label className="font-medium" style={{ color: 'var(--card-foreground)' }}>Total Visits</label>
                    <p style={{ color: 'var(--card-foreground)' }}>{selectedMember.visitor_info?.total_visits || 1}</p>
                  </div>
                  <div>
                    <label className="font-medium" style={{ color: 'var(--card-foreground)' }}>Status</label>
                    <span 
                      className="px-2 py-1 text-xs rounded-full"
                      style={{ 
                        backgroundColor: 'var(--primary)', 
                        color: 'var(--primary-foreground)' 
                      }}
                    >
                      First-Timer (Visitor)
                    </span>
                  </div>
                </div>

                {/* Follow-up Notes */}
                <div>
                  <label className="font-medium mb-2 block" style={{ color: 'var(--card-foreground)' }}>Follow-up Notes</label>
                  <textarea
                    defaultValue={selectedMember.visitor_info?.follow_up_notes || ""}
                    placeholder="Add notes about this first-timer (contact attempts, interests, etc.)"
                    className="w-full p-3 rounded-md"
                    style={{ 
                      backgroundColor: 'var(--input)', 
                      borderColor: 'var(--border)', 
                      color: 'var(--foreground)',
                      border: '1px solid'
                    }}
                    rows={3}
                    onBlur={(e) => {
                      if (e.target.value !== (selectedMember.visitor_info?.follow_up_notes || "")) {
                        addNotesMut.mutate({ 
                          id: selectedMember.id, 
                          notes: e.target.value 
                        });
                      }
                    }}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  {(selectedMember.visitor_info?.total_visits || 1) >= 2 && (
                    <button
                      onClick={() => promoteMut.mutate(selectedMember.id)}
                      disabled={promoteMut.isPending}
                      className="px-4 py-2 rounded-md disabled:opacity-50 transition-colors hover:opacity-80"
                      style={{ 
                        backgroundColor: 'var(--success)', 
                        color: 'var(--success-foreground)' 
                      }}
                    >
                      {promoteMut.isPending ? "Promoting..." : "Promote to Potential Member"}
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setShowProfile(false);
                      setSelectedMember(null);
                    }}
                    className="px-4 py-2 rounded-md transition-colors hover:opacity-80"
                    style={{ 
                      backgroundColor: 'var(--muted)', 
                      color: 'var(--muted-foreground)' 
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


