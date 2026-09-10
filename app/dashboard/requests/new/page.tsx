import { Suspense } from "react";
import NewRequestForm from "@/components/NewRequestForm";

export default function NewRequestPage() {
  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Nueva solicitud</h1>
      <Suspense fallback={<div>Cargando...</div>}>
        <NewRequestForm />
      </Suspense>
    </div>
  );
}