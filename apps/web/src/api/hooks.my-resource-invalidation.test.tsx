import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/client", async () => {
  const actual = await vi.importActual<typeof import("@/api/client")>("@/api/client");
  return {
    ...actual,
    apiClient: {
      PATCH: vi.fn().mockResolvedValue({ data: { id: "resource-1", title: "Updated" } }),
      DELETE: vi.fn().mockResolvedValue({ data: { id: "resource-1", warning: "" } }),
    },
  };
});

import {
  apiKeys,
  useArchiveMyModule,
  useArchiveMyProject,
  useDeleteMyTask,
  useUpdateMyModule,
  useUpdateMyProject,
  useUpdateMyTask,
} from "@/api/hooks";

const tenantId = "tenant-1";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("'My*' mutations invalidate the matching tenant-scoped list", () => {
  it("useUpdateMyProject invalidates apiKeys.projects(tenantId)", async () => {
    const queryClient = makeQueryClient();
    queryClient.setQueryData(apiKeys.projects(tenantId), { data: [], meta: {} });

    const { result } = renderHook(() => useUpdateMyProject(), {
      wrapper: wrapperFor(queryClient),
    });
    await result.current.mutateAsync({ projectId: "resource-1", input: { title: "Updated" } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryState(apiKeys.projects(tenantId))?.isInvalidated).toBe(true);
  });

  it("useArchiveMyProject invalidates apiKeys.projects(tenantId)", async () => {
    const queryClient = makeQueryClient();
    queryClient.setQueryData(apiKeys.projects(tenantId), { data: [], meta: {} });

    const { result } = renderHook(() => useArchiveMyProject(), {
      wrapper: wrapperFor(queryClient),
    });
    await result.current.mutateAsync("resource-1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryState(apiKeys.projects(tenantId))?.isInvalidated).toBe(true);
  });

  it("useUpdateMyModule invalidates apiKeys.modules(tenantId)", async () => {
    const queryClient = makeQueryClient();
    queryClient.setQueryData(apiKeys.modules(tenantId), []);

    const { result } = renderHook(() => useUpdateMyModule(), {
      wrapper: wrapperFor(queryClient),
    });
    await result.current.mutateAsync({ moduleId: "resource-1", input: { title: "Updated" } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryState(apiKeys.modules(tenantId))?.isInvalidated).toBe(true);
  });

  it("useArchiveMyModule invalidates apiKeys.modules(tenantId)", async () => {
    const queryClient = makeQueryClient();
    queryClient.setQueryData(apiKeys.modules(tenantId), []);

    const { result } = renderHook(() => useArchiveMyModule(), {
      wrapper: wrapperFor(queryClient),
    });
    await result.current.mutateAsync("resource-1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryState(apiKeys.modules(tenantId))?.isInvalidated).toBe(true);
  });

  it("useUpdateMyTask invalidates apiKeys.tasks(tenantId)", async () => {
    const queryClient = makeQueryClient();
    queryClient.setQueryData(apiKeys.tasks(tenantId), []);

    const { result } = renderHook(() => useUpdateMyTask(), {
      wrapper: wrapperFor(queryClient),
    });
    await result.current.mutateAsync({ taskId: "resource-1", input: { title: "Updated" } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryState(apiKeys.tasks(tenantId))?.isInvalidated).toBe(true);
  });

  it("useDeleteMyTask invalidates apiKeys.tasks(tenantId)", async () => {
    const queryClient = makeQueryClient();
    queryClient.setQueryData(apiKeys.tasks(tenantId), []);

    const { result } = renderHook(() => useDeleteMyTask(), {
      wrapper: wrapperFor(queryClient),
    });
    await result.current.mutateAsync("resource-1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryState(apiKeys.tasks(tenantId))?.isInvalidated).toBe(true);
  });
});
