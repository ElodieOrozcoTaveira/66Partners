import { dateFromHHMM, toHHMM, validateTimeSlot } from "../timeSlot";

describe("timeSlot", () => {
  it("convertit dans les deux sens", () => {
    expect(toHHMM(dateFromHHMM("07:05"))).toBe("07:05");
    expect(toHHMM(dateFromHHMM("18:30"))).toBe("18:30");
  });

  it("exige une fin après le début", () => {
    expect(validateTimeSlot("18:00", "20:00")).toBeNull();
    expect(validateTimeSlot("20:00", "18:00")).toMatch(/après/);
    expect(validateTimeSlot("18:00", "18:00")).toMatch(/après/);
  });

  it("refuse un format invalide", () => {
    expect(validateTimeSlot("24:00", "25:00")).toMatch(/invalide/);
  });
});
