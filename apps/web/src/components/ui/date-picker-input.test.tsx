import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { DatePickerInput } from "@/components/ui/date-picker-input";

function TestDatePicker() {
  const [value, setValue] = useState("");
  return <DatePickerInput id="test-date" label="Test date" value={value} onChange={setValue} />;
}

describe("DatePickerInput", () => {
  it("displays a picked date as DD/MM/YYYY and allows it to be cleared", () => {
    const { container } = render(<TestDatePicker />);
    const nativeDateInput = container.querySelector<HTMLInputElement>('input[type="date"]');

    expect(nativeDateInput).not.toBeNull();
    fireEvent.change(nativeDateInput!, { target: { value: "2026-08-05" } });

    expect(screen.getByRole("textbox")).toHaveValue("05/08/2026");

    fireEvent.click(screen.getByRole("button", { name: "Clear test date" }));

    expect(screen.getByRole("textbox")).toHaveValue("");
  });
});
