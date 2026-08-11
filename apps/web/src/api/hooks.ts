import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError, apiClient, responseData } from "@/api/client";
import type { components } from "@/api/schema";

export type Me = components["schemas"]["Me"];
export type Workspace = components["schemas"]["Workspace"];
export type InvitationPreview = components["schemas"]["InvitationPreview"];
export type Membership = components["schemas"]["Membership"];
export type CreatedInvitation = components["schemas"]["CreatedInvitation"];

export const apiKeys = {
  me: ["api", "me"] as const,
  workspaces: ["api", "workspaces"] as const,
  currentWorkspace: ["api", "workspace", "current"] as const,
  invitation: (token: string) => ["api", "invitation", token] as const,
  members: (tenantId: string) =>
    ["api", "tenant", tenantId, "members"] as const,
};

export function useMe(enabled = true) {
  return useQuery({
    queryKey: apiKeys.me,
    enabled,
    queryFn: async () => responseData(await apiClient.GET("/api/v1/me")),
  });
}

export function useCurrentWorkspace() {
  return useQuery({
    queryKey: apiKeys.currentWorkspace,
    queryFn: async () => {
      const result = await apiClient.GET("/api/v1/workspaces/current");
      if (result.response.status === 404) return null;
      return responseData(result);
    },
    retry(failureCount, error) {
      return (
        !(error instanceof ApiError && error.status < 500) && failureCount < 2
      );
    },
  });
}

export function useWorkspaces() {
  return useQuery({
    queryKey: apiKeys.workspaces,
    queryFn: async () =>
      responseData(await apiClient.GET("/api/v1/workspaces")),
  });
}

export function useSwitchWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (workspaceId: string) => {
      const result = await apiClient.PUT("/api/v1/workspaces/current", {
        body: { workspaceId },
      });

      if (result.response.status !== 200) {
        await responseData(result);
        throw new ApiError(
          result.response.status,
          `Workspace switch returned unexpected status ${result.response.status}`,
        );
      }

      return responseData(result);
    },
    async onSuccess(workspace) {
      queryClient.setQueryData(apiKeys.currentWorkspace, workspace);
      await queryClient.invalidateQueries({ queryKey: ["api", "tenant"] });
    },
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const result = await apiClient.POST("/api/v1/workspaces", {
        body: { name },
      });

      if (result.response.status !== 201) {
        throw new ApiError(
          result.response.status,
          `Workspace creation returned unexpected status ${result.response.status}`,
        );
      }

      return responseData(result);
    },
    async onSuccess(workspace) {
      queryClient.setQueryData(apiKeys.currentWorkspace, workspace);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: apiKeys.me }),
        queryClient.invalidateQueries({ queryKey: apiKeys.workspaces }),
      ]);
    },
  });
}

export function useInvitationPreview(token: string | undefined) {
  return useQuery({
    queryKey: apiKeys.invitation(token ?? ""),
    enabled: Boolean(token),
    queryFn: async () => {
      const result = await apiClient.GET("/api/v1/invitations/{token}", {
        params: { path: { token: token! } },
      });

      if (result.response.status !== 200) {
        await responseData(result);
        throw new ApiError(
          result.response.status,
          `Invitation preview returned status ${result.response.status}`,
        );
      }

      return responseData(result);
    },
    retry: false,
  });
}

export function useAcceptInvitation(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const result = await apiClient.POST(
        "/api/v1/invitations/{token}/accept",
        {
          params: { path: { token } },
        },
      );

      if (result.response.status !== 201) {
        await responseData(result);
        throw new ApiError(
          result.response.status,
          `Invitation acceptance returned status ${result.response.status}`,
        );
      }

      return responseData(result);
    },
    async onSuccess() {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: apiKeys.me }),
        queryClient.invalidateQueries({ queryKey: apiKeys.currentWorkspace }),
        queryClient.invalidateQueries({ queryKey: apiKeys.workspaces }),
      ]);
    },
  });
}

export function useMembers(tenantId: string, enabled = true) {
  return useQuery({
    queryKey: apiKeys.members(tenantId),
    enabled: Boolean(tenantId) && enabled,
    queryFn: async () =>
      responseData(
        await apiClient.GET("/api/v1/tenant/{tenantId}/members", {
          params: { path: { tenantId } },
        }),
      ),
  });
}

export function useCreateInvitation(tenantId: string) {
  return useMutation({
    mutationFn: async (email: string) =>
      responseData(
        await apiClient.POST("/api/v1/tenant/{tenantId}/invitations", {
          params: { path: { tenantId } },
          body: { email },
        }),
      ),
  });
}

export function useRevokeMember(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (membershipId: string) =>
      responseData(
        await apiClient.DELETE(
          "/api/v1/tenant/{tenantId}/members/{membershipId}",
          {
            params: { path: { tenantId, membershipId } },
          },
        ),
      ),
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: apiKeys.members(tenantId),
      });
    },
  });
}
