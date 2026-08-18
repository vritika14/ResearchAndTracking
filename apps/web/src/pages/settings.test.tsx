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

vi.mock("@/theme/color-theme", () => ({
  COLOR_THEMES: [{ value: "ocean", label: "Ocean" }],
  useColorTheme: () => ({ theme: "ocean", setTheme: vi.fn() }),
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    mockMutate.mockClear();
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
});
