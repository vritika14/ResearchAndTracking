import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

const mockUseCurrentWorkspace = vi.fn();
const mockUseAnalyticsSummary = vi.fn();

vi.mock("@/api/hooks", () => ({
  useCurrentWorkspace: () => mockUseCurrentWorkspace(),
  useAnalyticsSummary: () => mockUseAnalyticsSummary(),
}));

import UsagePage from "@/pages/usage";

describe("UsagePage", () => {
  it("tells non-owners that usage is owner-only", () => {
    mockUseCurrentWorkspace.mockReturnValue({
      data: { id: "tenant-1", membershipRole: "limited_member" },
      isPending: false,
    });
    mockUseAnalyticsSummary.mockReturnValue({ isPending: false, isError: false });

    render(
      <MemoryRouter>
        <UsagePage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Only the workspace owner can view usage analytics."),
    ).toBeInTheDocument();
  });

  it("shows the summary for the workspace owner", () => {
    mockUseCurrentWorkspace.mockReturnValue({
      data: { id: "tenant-1", membershipRole: "owner" },
      isPending: false,
    });
    mockUseAnalyticsSummary.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        windowDays: 30,
        totalEvents: 12,
        byName: [
          { name: "page_view", count: 9 },
          { name: "project_created", count: 3 },
        ],
        byDay: [{ day: "2026-01-01", count: 12 }],
      },
    });

    render(
      <MemoryRouter>
        <UsagePage />
      </MemoryRouter>,
    );

    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("page_view")).toBeInTheDocument();
    expect(screen.getByText("project_created")).toBeInTheDocument();
  });
});
