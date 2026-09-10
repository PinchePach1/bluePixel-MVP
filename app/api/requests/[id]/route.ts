import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  authorizeRequestUpdate,
  type RequestPolicyInput,
  type RequestStatus,
} from "@/lib/request-policies";
import { RequestUpdateSchema } from "@/lib/validations";
import { z } from "zod";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }

    const request = await prisma.request.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        histories: {
          orderBy: { createdAt: "asc" },
          include: {
            changedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!request) {
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(request);
  } catch (error) {
    console.error("Error GET /api/requests/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;
    const userId = session.user.id;
    const userRole = session.user.role;

    if (!userId || !tenantId) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }

    // Primero, obtener la solicitud actual para verificar permisos y estado
    const existingRequest = await prisma.request.findFirst({
      where: { id, tenantId },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = RequestUpdateSchema.parse(body);

    const policyResult = authorizeRequestUpdate(
      {
        id: userId,
        tenantId,
        role: userRole as "ADMIN" | "MEMBER",
      },
      {
        tenantId: existingRequest.tenantId,
        createdById: existingRequest.createdById,
        status: existingRequest.status as RequestStatus,
      },
      validatedData as RequestPolicyInput
    );

    if (!policyResult.allowed) {
      return NextResponse.json(
        { error: policyResult.error },
        { status: policyResult.statusCode }
      );
    }

    const newStatus = validatedData.status;
    const historyData = policyResult.history
      ? {
          ...policyResult.history,
          comment: body.comment || null,
        }
      : null;

    // Actualizar la solicitud
    const updateData: Parameters<typeof prisma.request.update>[0]["data"] = {};
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined)
      updateData.description = validatedData.description;
    if (newStatus) {
      updateData.status = newStatus as NonNullable<typeof updateData.status>;
    }

    const updatedRequest = await prisma.$transaction(async (prisma) => {
      const updated = await prisma.request.update({
        where: { id },
        data: {
          ...updateData,
          histories: historyData
            ? {
                create: historyData,
              }
            : undefined,
        },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          histories: {
            orderBy: { createdAt: "asc" },
            include: {
              changedBy: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      });
      return updated;
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error PATCH /api/requests/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Opcional: DELETE solo admin
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Solo administradores pueden eliminar" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }

    const existing = await prisma.request.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    await prisma.request.delete({ where: { id } });
    return NextResponse.json({ message: "Eliminada" }, { status: 200 });
  } catch (error) {
    console.error("Error DELETE /api/requests/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}