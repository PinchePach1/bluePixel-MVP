import { describe, expect, it } from "vitest";
import { authorizeRequestUpdate, canAccessRequest } from "./request-policies";

const member = {
  id: "member-1",
  tenantId: "tenant-1",
  role: "MEMBER" as const,
};

const admin = { ...member, id: "admin-1", role: "ADMIN" as const };

const draft = {
  tenantId: "tenant-1",
  createdById: "member-1",
  status: "DRAFT" as const,
};

describe("request policies", () => {
  it("denies access across organizations", () => {
    expect(canAccessRequest(member, { tenantId: "tenant-2" })).toBe(false);
    expect(
      authorizeRequestUpdate(member, { ...draft, tenantId: "tenant-2" }, {})
    ).toMatchObject({ allowed: false, statusCode: 404 });
  });

  it("does not allow members to approve or reject", () => {
    expect(
      authorizeRequestUpdate(member, { ...draft, status: "SUBMITTED" }, {
        status: "APPROVED",
      })
    ).toMatchObject({ allowed: false, statusCode: 403 });
  });

  it("allows only the creator to submit a draft", () => {
    expect(
      authorizeRequestUpdate(
        { ...member, id: "member-2" },
        draft,
        { status: "SUBMITTED" }
      )
    ).toMatchObject({ allowed: false, statusCode: 403 });

    expect(
      authorizeRequestUpdate(member, draft, { status: "SUBMITTED" })
    ).toMatchObject({ allowed: true });
  });

  it("rejects edits outside draft and transitions from terminal states", () => {
    expect(
      authorizeRequestUpdate(member, { ...draft, status: "SUBMITTED" }, {
        title: "Updated title",
      })
    ).toMatchObject({ allowed: false, statusCode: 400 });

    expect(
      authorizeRequestUpdate(admin, { ...draft, status: "APPROVED" }, {
        status: "REJECTED",
      })
    ).toMatchObject({ allowed: false, statusCode: 400 });
  });

  it("allows an admin to approve a submitted request and records history", () => {
    expect(
      authorizeRequestUpdate(
        admin,
        { ...draft, status: "SUBMITTED" },
        { status: "APPROVED" }
      )
    ).toEqual({
      allowed: true,
      history: {
        oldStatus: "SUBMITTED",
        newStatus: "APPROVED",
        changedById: "admin-1",
      },
    });
  });
});