import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SettingsPage from "@/pages/settings";

const mockMutate = vi.fn();
const mockMe = {
  id: "user-1",
  email: "researcher@example.com",
  displayName: "Avi Researcher",
  jobTitle: null,
  institution: null,
  department: null,
  phone: null,
  researchInterests: null,
  status: "active",
  profileComplete: false,
  missingProfileFields: ["jobTitle", "institution", "department"],
};

vi.mock("@/api/hooks", () => ({
  useMe: () => ({
    data: mockMe,
    isPending: false,
    isError: false,
  }),
  useCurrentWorkspace: () => ({
    data: {
      name: "Research Operations",
      slug: "research-operations",
      membershipRole: "owner",
    },
    isPending: false,
  }),
  useUpdateMe: () => ({
    mutate: mockMutate,
    isPending: false,
    isError: false,
    isSuccess: false,
  }),
}));

vi.mock("@/components/settings/workspace-members", () => ({
  WorkspaceMembers: () => null,
}));

const mockSetTheme = vi.hoisted(() => vi.fn());
const mockSetColorTheme = vi.hoisted(() => vi.fn());

vi.mock("@/theme/design-theme", () => ({
  DESIGN_THEMES: [
    { value: "modern", label: "Modern", description: "The default look.", layout: "sidebar" },
    { value: "minimal", label: "Minimal", description: "A compact icon rail.", layout: "sidebar-compact" },
    { value: "executive", label: "Executive", description: "A top navigation bar.", layout: "topnav" },
  ],
  useDesignTheme: () => ({ theme: "modern", layout: "sidebar", setTheme: mockSetTheme }),
}));

vi.mock("@/theme/color-theme", () => ({
  COLOR_THEMES: [
    { value: "ocean", label: "Ocean Blue" },
    { value: "violet", label: "Violet" },
    { value: "emerald", label: "Emerald" },
    { value: "rose", label: "Rose" },
  ],
  useColorTheme: () => ({ theme: "ocean", setTheme: mockSetColorTheme }),
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    mockMutate.mockClear();
    mockSetTheme.mockClear();
    mockSetColorTheme.mockClear();
  });

  it("reminds an incomplete user and saves their professional profile", () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Complete your profile");
    expect(screen.getByLabelText(/Job title/)).toBeRequired();
    expect(screen.getByLabelText(/Institution/)).toBeRequired();
    expect(screen.getByLabelText(/Department/)).toBeRequired();
    expect(screen.getByLabelText("Phone (optional)")).not.toBeRequired();

    fireEvent.change(screen.getByLabelText(/Job title/), {
      target: { value: "Research Fellow" },
    });
    fireEvent.change(screen.getByLabelText(/Institution/), {
      target: { value: "University of Sydney" },
    });
    fireEvent.change(screen.getByLabelText(/Department/), {
      target: { value: "Medical Sciences" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Profile" }));

    expect(mockMutate).toHaveBeenCalledWith({
      displayName: "Avi Researcher",
      jobTitle: "Research Fellow",
      institution: "University of Sydney",
      department: "Medical Sciences",
      phone: "",
      researchInterests: "",
    });
  });

  it("selects a design theme from the preview picker", () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Executive/ }));

    expect(mockSetTheme).toHaveBeenCalledWith("executive");
  });

  it("selects a color theme independently of the design theme", () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("combobox", { name: "Theme" }));
    fireEvent.click(screen.getByRole("option", { name: "Violet" }));

    expect(mockSetColorTheme).toHaveBeenCalledWith("violet");
  });
});
