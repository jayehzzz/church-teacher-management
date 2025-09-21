"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createContact, listContacts, removeContact } from "@/services/contacts";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button, Input, Label, Checkbox } from "@/components/ui";
import type { ContactRecord } from "@/types/contact";
import { PageHeader } from "@/components/ui/PageHeader";

const schema = z.object({
  name: z.string().min(1),
  phone: z.string().min(5),
  category: z.string().optional(),
  saved: z.boolean().optional(),
  attendedChurch: z.boolean().optional(),
  likelyToCome: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function EvangelismPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["contacts"], queryFn: listContacts });
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const createMut = useMutation({
    mutationFn: (v: FormValues) => createContact(v as any),
    onSuccess: () => { reset(); qc.invalidateQueries({ queryKey: ["contacts"] }); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => removeContact(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts"] }),
  });

  return (
    <div className="space-y-8">
      <PageHeader title="Evangelism Contacts" />

      <Card>
      <CardHeader>
        <div className="font-medium">Add Contact</div>
      </CardHeader>
      <CardContent>
      <form onSubmit={handleSubmit((v) => createMut.mutate(v))} className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <div className="md:col-span-2">
          <Label>Name</Label>
          <Input className="mt-1" {...register("name")} />
          {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
        </div>
        <div className="md:col-span-2">
          <Label>Phone</Label>
          <Input className="mt-1" {...register("phone")} />
        </div>
        <div>
          <Label>Category</Label>
          <Input className="mt-1" {...register("category")} />
        </div>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm"><Checkbox {...register("saved")} /> Saved</label>
          <label className="inline-flex items-center gap-2 text-sm"><Checkbox {...register("attendedChurch")} /> Attended</label>
          <label className="inline-flex items-center gap-2 text-sm"><Checkbox {...register("likelyToCome")} /> Likely</label>
        </div>
        <div className="md:col-span-6">
          <Button disabled={isSubmitting} className="bg-black text-white border-black">Add Contact</Button>
        </div>
      </form>
      </CardContent>
      </Card>

      {isLoading ? (
        <div>Loading contacts...</div>
      ) : (
        <Card>
        <CardHeader>
          <div className="font-medium">Contacts</div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Phone</th>
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4">Saved</th>
                <th className="py-2 pr-4">Attended</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {(data as ContactRecord[] | undefined)?.map((c) => (
                <tr key={c.id} className="border-b">
                  <td className="py-2 pr-4">{c.name}</td>
                  <td className="py-2 pr-4">{c.phone}</td>
                  <td className="py-2 pr-4">{c.category}</td>
                  <td className="py-2 pr-4">{c.saved ? "Yes" : "No"}</td>
                  <td className="py-2 pr-4">{c.attendedChurch ? "Yes" : "No"}</td>
                  <td className="py-2 pr-4 text-right">
                    <button onClick={() => deleteMut.mutate(c.id)} className="text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
        </Card>
      )}
    </div>
  );
}


