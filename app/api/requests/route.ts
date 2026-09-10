import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { RequestCreateSchema } from "@/lib/validations";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");

    const whereClause: Prisma.RequestWhereInput = { tenantId };
    if (status && ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"].includes(status)) {
      whereClause.status = status as Prisma.RequestWhereInput["status"];
    }

    const requests = await prisma.request.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        histories: {
          orderBy: { createdAt: "desc" },
          take: 1, // solo el último historial para mostrar estado actual, pero ya tenemos status
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error GET /api/requests:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.tenantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: userId, tenantId } = session.user;

    const body = await req.json();
    const validatedData = RequestCreateSchema.parse(body);

    const newRequest = await prisma.request.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        status: "DRAFT",
        createdById: userId,
        tenantId,
        // No es necesario pasar organizationId porque tenantId es la organización
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error POST /api/requests:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}