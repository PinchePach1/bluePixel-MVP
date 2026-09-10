"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const schema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(5).max(500),
});

type FormData = z.infer<typeof schema>;
type Request = {
  id: string;
  title: string;
  description: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  histories?: Array<{
    id: string;
    oldStatus: string | null;
    newStatus: string;
    createdAt: string;
  }>;
};

export default function RequestDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [request, setRequest] = useState<Request | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const isAdmin = session?.user?.role === "ADMIN";
  const canEdit = request?.status === "DRAFT";

  useEffect(() => {
    fetch(`/api/requests/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("No se pudo cargar la solicitud");
        const data = await res.json();
        setRequest(data);
        reset({ title: data.title, description: data.description });
      })
      .catch((error) =>
        setError(error instanceof Error ? error.message : "No se pudo cargar la solicitud")
      )
      .finally(() => setIsLoading(false));
  }, [id, reset]);

  const onSave = async (data: FormData) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error al guardar");
      const updated = await res.json();
      setRequest(updated);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const changeStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Error al cambiar estado");
      }
      const updated = await res.json();
      setRequest(updated);
      const message =
        status === "APPROVED"
          ? "Solicitud aprobada correctamente"
          : status === "REJECTED"
            ? "Solicitud rechazada correctamente"
            : "Solicitud actualizada correctamente";
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al cambiar estado");
    }
  };

  if (isLoading) return <div>Cargando...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!request) return <div>No encontrada</div>;

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        onClick={() => router.push("/dashboard/requests")}
        className="mb-2"
      >
        ← Volver al listado
      </Button>

      {successMessage && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Detalle de solicitud</CardTitle>
          <Badge>{request.status}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" disabled={!canEdit} {...register("title")} />
            {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input id="description" disabled={!canEdit} {...register("description")} />
            {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
          </div>

          {canEdit && (
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
          )}
        </form>

        <div className="flex flex-wrap gap-2 border-t pt-4">
          {canEdit && (
            <Button variant="outline" onClick={() => changeStatus("SUBMITTED")}>
              Enviar
            </Button>
          )}
          {isAdmin && request.status === "SUBMITTED" && (
            <>
              <Button onClick={() => changeStatus("APPROVED")}>Aprobar</Button>
              <Button variant="destructive" onClick={() => changeStatus("REJECTED")}>
                Rechazar
              </Button>
            </>
          )}
        </div>

        {request.histories && request.histories.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Historial</h3>
            <ul className="text-sm space-y-1">
              {request.histories.map((history) => (
                <li key={history.id}>
                  {new Date(history.createdAt).toLocaleString()} — {history.oldStatus ?? "—"} → {history.newStatus}
                </li>
              ))}
            </ul>
          </div>
        )}
        </CardContent>
      </Card>
    </div>
  );
}