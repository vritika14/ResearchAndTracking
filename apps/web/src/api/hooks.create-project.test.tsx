import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/client", async () => {
  const actual = await vi.importActual<typeof import("@/api/client")>("@/api/client");
  return {
    ...actual,
    apiClient: {
      POST: vi.fn().mockResolvedValue({
        data: { id: "project-new", title: "New project" },
      }),
    },
  };
});

import { apiKeys, useCreateProject, type ApiProject } from "@/api/hooks";

const EXISTING_PROJECT = { id: "project-1", title: "Existing project" } as ApiProject;

describe("useCreateProject", () => {
  it("does not crash the paginated projects cache on success", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const tenantId = "tenant-1";

    // Seed the cache the way a real paginated response looks — this is the
    // shape that broke `current.some is not a function` when the mutation's
    // onSuccess still assumed a plain array.
    queryClient.setQueryData(apiKeys.projects(tenantId), {
      data: [EXISTING_PROJECT],
      meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
    });

    function wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useCreateProject(tenantId), { wrapper });

    await result.current.mutateAsync({
      title: "New project",
      status: "Active",
      importance: "Medium",
      pipelineStages: ["Concept"],
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // The paginated cache should still be a well-formed { data, meta } object,
    // not corrupted or replaced with a bare array.
    const cached = queryClient.getQueryData<{ data: unknown[] }>(apiKeys.projects(tenantId));
    expect(Array.isArray(cached?.data)).toBe(true);
  });
});
