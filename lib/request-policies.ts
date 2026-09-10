export const requestStatuses = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
] as const;

export type RequestStatus = (typeof requestStatuses)[number];
export type UserRole = "ADMIN" | "MEMBER";

export interface RequestPolicyUser {
  id: string;
  tenantId: string;
  role: UserRole;
}

export interface RequestPolicyRecord {
  tenantId: string;
  createdById: string;
  status: RequestStatus;
}

export interface RequestPolicyInput {
  title?: string;
  description?: string;
  status?: RequestStatus;
}

export interface RequestHistoryData {
  oldStatus: RequestStatus;
  newStatus: RequestStatus;
  changedById: string;
}

export type RequestPolicyResult =
  | { allowed: true; history: RequestHistoryData | null }
  | { allowed: false; statusCode: 400 | 403 | 404; error: string };

export function canAccessRequest(
  user: Pick<RequestPolicyUser, "tenantId">,
  request: Pick<RequestPolicyRecord, "tenantId">
) {
  return user.tenantId === request.tenantId;
}

export function authorizeRequestUpdate(
  user: RequestPolicyUser,
  request: RequestPolicyRecord,
  input: RequestPolicyInput
): RequestPolicyResult {
  if (!canAccessRequest(user, request)) {
    return {
      allowed: false,
      statusCode: 404,
      error: "Solicitud no encontrada",
    };
  }

  const nextStatus = input.status;

  if (
    nextStatus &&
    (nextStatus === "APPROVED" || nextStatus === "REJECTED") &&
    user.role !== "ADMIN"
  ) {
    return {
      allowed: false,
      statusCode: 403,
      error: "No tienes permisos para aprobar/rechazar solicitudes",
    };
  }

  if (nextStatus === "SUBMITTED") {
    if (user.role !== "ADMIN" && request.createdById !== user.id) {
      return {
        allowed: false,
        statusCode: 403,
        error: "Solo el creador puede enviar la solicitud",
      };
    }

    if (request.status !== "DRAFT") {
      return {
        allowed: false,
        statusCode: 400,
        error: "Solo las solicitudes en borrador pueden ser enviadas",
      };
    }
  }

  if (
    (input.title !== undefined || input.description !== undefined) &&
    request.status !== "DRAFT"
  ) {
    return {
      allowed: false,
      statusCode: 400,
      error: "No se puede editar una solicitud que no está en borrador",
    };
  }

  if (
    nextStatus &&
    nextStatus !== request.status &&
    !isAllowedStatusTransition(request.status, nextStatus)
  ) {
    return {
      allowed: false,
      statusCode: 400,
      error: "Transición de estado no permitida",
    };
  }

  return {
    allowed: true,
    history:
      nextStatus && nextStatus !== request.status
        ? {
            oldStatus: request.status,
            newStatus: nextStatus,
            changedById: user.id,
          }
        : null,
  };
}

function isAllowedStatusTransition(
  currentStatus: RequestStatus,
  nextStatus: RequestStatus
) {
  const allowedTransitions: Record<RequestStatus, readonly RequestStatus[]> = {
    DRAFT: ["SUBMITTED"],
    SUBMITTED: ["APPROVED", "REJECTED"],
    APPROVED: [],
    REJECTED: [],
  };

  return allowedTransitions[currentStatus].includes(nextStatus);
}