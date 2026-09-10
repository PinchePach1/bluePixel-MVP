"use client";

import { useRequests } from "@/hooks/useRequests";
import type { Request } from "@/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const statusColors = {
  DRAFT: "bg-gray-500",
  SUBMITTED: "bg-blue-500",
  APPROVED: "bg-green-500",
  REJECTED: "bg-red-500",
};

export default function RequestsListPage() {
  const { data: requests, isLoading, error } = useRequests();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Solicitudes</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return <div>Error al cargar las solicitudes</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Solicitudes</h1>
        <Link href="/dashboard/requests/new">
          <Button>Nueva solicitud</Button>
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Creado por</TableHead>
              <TableHead>Fecha de creación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No hay solicitudes
                </TableCell>
              </TableRow>
            ) : (
              requests?.map((request: Request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.title}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[request.status as keyof typeof statusColors]}>
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{request.createdBy.name}</TableCell>
                  <TableCell>
                    {format(new Date(request.createdAt), "PPP", { locale: es })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/requests/${request.id}`}>
                      <Button variant="outline" size="sm">
                        Ver
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}