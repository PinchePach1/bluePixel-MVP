import { Suspense } from "react";
import RequestDetail from "@/components/RequestDetail";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Suspense fallback={<div>Cargando...</div>}>
        <RequestDetail id={id} />
      </Suspense>
    </div>
  );
}