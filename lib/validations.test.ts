import { describe, expect, it } from "vitest";
import { RequestCreateSchema, RequestUpdateSchema } from "./validations";

describe("request validation", () => {
  it("rejects invalid create input", () => {
    expect(
      RequestCreateSchema.safeParse({ title: "Hi", description: "No" }).success
    ).toBe(false);
  });

  it("rejects unknown statuses", () => {
    expect(
      RequestUpdateSchema.safeParse({ status: "PENDING" }).success
    ).toBe(false);
  });

  it("accepts a valid update", () => {
    expect(
      RequestUpdateSchema.safeParse({
        title: "A valid request",
        status: "SUBMITTED",
      }).success
    ).toBe(true);
  });
});