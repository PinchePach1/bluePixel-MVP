export interface Request {
  id: string;
  title: string;
  description: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  createdById: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  histories: RequestHistory[];
}

export interface RequestHistory {
  id: string;
  requestId: string;
  oldStatus?: string;
  newStatus: string;
  changedById: string;
  changedBy: {
    id: string;
    name: string;
    email: string;
  };
  comment?: string;
  createdAt: string;
}

export type RequestCreateInput = {
  title: string;
  description: string;
};

export type RequestUpdateInput = {
  title?: string;
  description?: string;
  status?: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  comment?: string;
};