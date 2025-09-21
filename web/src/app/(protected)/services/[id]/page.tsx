"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { getService, updateService } from "@/services/services";
import type { ServiceRecord, FirstTimerInline, ServiceType } from "@/types/service";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button, Input, Label } from "@/components/ui";

const schema = z.object({
  service_date: z.string().min(1),
  topic: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  attendance_adults: z.string().optional().or(z.literal("")),
  attendance_children: z.string().optional().or(z.literal("")),
  converts: z.string().optional().or(z.literal("")),
  tithers: z.string().optional().or(z.literal("")),
  service_type: z.enum(["Sunday service", "Bacenta", "Special event", "Other"]).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ServiceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const qc = useQueryClient();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["service", id],
    queryFn: () => getService(id),
    enabled: Boolean(id),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const s = data as ServiceRecord | null;
    if (s) {
      reset({
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
  }, [data, reset]);

  const updateMut = useMutation({
    mutationFn: async (v: FormValues) => {
      const toNum = (val?: string) => (val && val.trim() !== "" ? Number(val) : undefined);
      await updateService(id, {
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
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["service", id] });
      await qc.invalidateQueries({ queryKey: ["services"] });
    },
  });

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!data) return <div className="p-6">Service not found</div>;
  const s = data as ServiceRecord;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Service on {s.service_date}</h1>
          <p className="text-neutral-500 text-sm">Edit details and view images</p>
        </div>
        <Button type="button" onClick={() => router.push("/services")}>Back</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="font-medium">Edit Service</div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((v) => updateMut.mutate(v))} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label>Date</Label>
              <Input className="mt-1" type="date" {...register("service_date")} />
            </div>
            <div>
              <Label>Service Type</Label>
              <select className="mt-1 border border-neutral-200 rounded-xl px-3 py-2 bg-white dark:bg-neutral-900" {...register("service_type" as const)} defaultValue={s.service_type ?? "Sunday service"}>
                <option value="Sunday service">Sunday service</option>
                <option value="Bacenta">Bacenta</option>
                <option value="Special event">Special event</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <Label>Topic</Label>
              <Input className="mt-1" {...register("topic")} />
            </div>
            <div>
              <Label>Notes</Label>
              <Input className="mt-1" {...register("notes")} />
            </div>
            <div>
              <Label>Adults</Label>
              <Input className="mt-1" type="number" min={0} {...register("attendance_adults")} />
            </div>
            <div>
              <Label>Children</Label>
              <Input className="mt-1" type="number" min={0} {...register("attendance_children")} />
            </div>
            <div>
              <Label>Converts</Label>
              <Input className="mt-1" type="number" min={0} {...register("converts")} />
            </div>
            <div>
              <Label>Tithers</Label>
              <Input className="mt-1" type="number" min={0} {...register("tithers")} />
            </div>
            <div className="md:col-span-4">
              <Button disabled={isSubmitting || updateMut.isPending} className="bg-black text-white border-black">Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="font-medium">Images</div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(s.service_image_refs ?? []).map((url, i) => (
              <a key={`${url}-${i}`} href={url} target="_blank" rel="noreferrer" className="block border rounded overflow-hidden">
                <img src={url} alt={`Service ${s.service_date} ${i + 1}`} className="w-full h-40 object-cover" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



