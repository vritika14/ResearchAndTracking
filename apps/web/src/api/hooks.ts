import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError, apiClient, responseData } from "@/api/client";

/**
 * None of the API's controllers annotate their response bodies with
 * @ApiResponse({ type }) (nest-cli.json also has no swagger plugin
 * configured to infer them), so the generated OpenAPI schema has no typed
 * response shape for any endpoint (`content?: never`) — these interfaces
 * are hand-written to match what each service actually returns.
 */
export interface Me {
  id: string;
  email: string;
  displayName: string;
  jobTitle: string | null;
  institution: string | null;
  department: string | null;
  phone: string | null;
  researchInterests: string | null;
  status: string;
  profileComplete: boolean;
  missingProfileFields: ("jobTitle" | "institution" | "department")[];
}
export interface UpdateProfile {
  displayName?: string;
  jobTitle?: string;
  institution?: string;
  department?: string;
  phone?: string;
  researchInterests?: string;
}
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  status: string;
  ownerUserId: string;
  membershipRole: "owner" | "limited_member";
  createdAt: string;
  updatedAt: string;
}
export interface InvitationPreview {
  workspaceName: string;
  invitedEmail: string;
  role: "limited_member";
  expiresAt: string;
}
export interface Membership {
  id: string;
  tenantId: string;
  userId: string;
  email: string;
  displayName: string;
  role: "owner" | "limited_member";
  status: "active" | "revoked";
  invitedAt: string;
  joinedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface Invitation {
  id: string;
  tenantId: string;
  email: string;
  role: "limited_member";
  invitedBy: string;
  status: "pending";
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}
export interface CreatedInvitation {
  invitation: Invitation;
  acceptanceToken: string;
  emailSent: true;
}

// See apps/api/src/modules/{projects,project-modules,tasks,notes} for the source of truth.
export interface ApiProject {
  id: string;
  displayId: string | null;
  userId: string;
  tenantId: string;
  title: string;
  description: string | null;
  researchArea: string | null;
  status: string | null;
  pipelineStage: string | null;
  importance: string | null;
  scheduledFor: string | null;
  dueDate: string | null;
  totalBudget: string | null;
  targetJournals: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** The calling user's collaborator role on this project, if any. */
  role: string | null;
}

export interface ApiCollaborator {
  id: string;
  tenantId: string;
  userId: string;
  role: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiModule {
  id: string;
  displayId: string | null;
  tenantId: string;
  projectId: string | null;
  title: string;
  description: string | null;
  tag: string | null;
  status: string | null;
  assignedToUserId: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiTask {
  id: string;
  displayId: string | null;
  tenantId: string;
  projectId: string | null;
  moduleId: string | null;
  createdBy: string;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  visibility: string | null;
  workingWith: string | null;
  estimatedHours: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiNote {
  id: string;
  displayId: string | null;
  tenantId: string;
  projectId: string | null;
  moduleId: string | null;
  createdBy: string;
  title: string;
  content: string | null;
  visibility: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiMember {
  id: string;
  tenantId: string;
  userId: string;
  createdAt: string;
}

export const apiKeys = {
  me: ["api", "me"] as const,
  workspaces: ["api", "workspaces"] as const,
  currentWorkspace: ["api", "workspace", "current"] as const,
  invitation: (token: string) => ["api", "invitation", token] as const,
  members: (tenantId: string) =>
    ["api", "tenant", tenantId, "members"] as const,
  projects: (tenantId: string) =>
    ["api", "tenant", tenantId, "projects"] as const,
  project: (tenantId: string, projectId: string) =>
    ["api", "tenant", tenantId, "projects", projectId] as const,
  projectCollaborators: (tenantId: string, projectId: string) =>
    ["api", "tenant", tenantId, "projects", projectId, "collaborators"] as const,
  modules: (tenantId: string, projectId?: string) =>
    ["api", "tenant", tenantId, "modules", projectId ?? "all"] as const,
  module: (tenantId: string, moduleId: string) =>
    ["api", "tenant", tenantId, "modules", "detail", moduleId] as const,
  moduleCollaborators: (tenantId: string, moduleId: string) =>
    ["api", "tenant", tenantId, "modules", moduleId, "collaborators"] as const,
  tasks: (tenantId: string, projectId?: string) =>
    ["api", "tenant", tenantId, "tasks", projectId ?? "all"] as const,
  task: (tenantId: string, taskId: string) =>
    ["api", "tenant", tenantId, "tasks", "detail", taskId] as const,
  taskMembers: (tenantId: string, taskId: string) =>
    ["api", "tenant", tenantId, "tasks", taskId, "members"] as const,
  notes: (tenantId: string, projectId?: string) =>
    ["api", "tenant", tenantId, "notes", projectId ?? "all"] as const,
  note: (tenantId: string, noteId: string) =>
    ["api", "tenant", tenantId, "notes", "detail", noteId] as const,
  noteMembers: (tenantId: string, noteId: string) =>
    ["api", "tenant", tenantId, "notes", noteId, "members"] as const,
};

export function useMe(enabled = true) {
  return useQuery({
    queryKey: apiKeys.me,
    enabled,
    queryFn: async () =>
      responseData<Me>(await apiClient.GET("/api/v1/me")),
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UpdateProfile) =>
      responseData<Me>(
        await apiClient.PATCH("/api/v1/me", {
          body: profile,
        }),
      ),
    onSuccess(profile) {
      queryClient.setQueryData(apiKeys.me, profile);
    },
  });
}

export function useCurrentWorkspace() {
  return useQuery({
    queryKey: apiKeys.currentWorkspace,
    queryFn: async () => {
      const result = await apiClient.GET("/api/v1/workspaces/current");
      if (result.response.status === 404) return null;
      return responseData<Workspace>(result);
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
      responseData<Workspace[]>(await apiClient.GET("/api/v1/workspaces")),
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

      return responseData<Workspace>(result);
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

      return responseData<Workspace>(result);
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

      return responseData<InvitationPreview>(result);
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

      return responseData<CreatedInvitation>(result);
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
    queryFn: async () => {
      const result = await apiClient.GET("/api/v1/tenant/{tenantId}/members", {
        params: { path: { tenantId } },
      });
      // The generated MembershipResponseDto mis-describes `joinedAt` as `{}`
      // (the backend DTO lacks an explicit Swagger type hint on that Date
      // field) — joinedAt isn't used anywhere in the UI, so trust our own
      // shape here rather than the lossy generated one.
      return responseData<Membership[]>(result as never);
    },
  });
}

export function useCreateInvitation(tenantId: string) {
  return useMutation({
    mutationFn: async (email: string) =>
      responseData<CreatedInvitation>(
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

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export interface CreateProjectInput {
  title: string;
  description?: string;
  researchArea?: string;
  status?: string;
  pipelineStage?: string;
  importance?: string;
  scheduledFor?: string;
  dueDate?: string;
  totalBudget?: string;
  targetJournals?: string;
}
export type UpdateProjectInput = Partial<CreateProjectInput>;

export function useProjects(tenantId: string, enabled = true) {
  return useQuery({
    queryKey: apiKeys.projects(tenantId),
    enabled: Boolean(tenantId) && enabled,
    queryFn: async () =>
      responseData<ApiProject[]>(
        await apiClient.GET("/api/v1/tenant/{tenantId}/projects", {
          params: { path: { tenantId } },
        }),
      ),
  });
}

export function useProject(tenantId: string, projectId: string, enabled = true) {
  return useQuery({
    queryKey: apiKeys.project(tenantId, projectId),
    enabled: Boolean(tenantId) && Boolean(projectId) && enabled,
    queryFn: async () =>
      responseData<ApiProject>(
        await apiClient.GET("/api/v1/tenant/{tenantId}/projects/{projectId}", {
          params: { path: { tenantId, projectId } },
        }),
      ),
  });
}

export function useCreateProject(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProjectInput) =>
      responseData<ApiProject>(
        await apiClient.POST("/api/v1/tenant/{tenantId}/projects", {
          params: { path: { tenantId } },
          body: input,
        }),
      ),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: apiKeys.projects(tenantId) });
    },
  });
}

export function useUpdateProject(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      input,
    }: {
      projectId: string;
      input: UpdateProjectInput;
    }) =>
      responseData<ApiProject>(
        await apiClient.PATCH("/api/v1/tenant/{tenantId}/projects/{projectId}", {
          params: { path: { tenantId, projectId } },
          body: input,
        }),
      ),
    async onSuccess(project) {
      queryClient.setQueryData(apiKeys.project(tenantId, project.id), project);
      await queryClient.invalidateQueries({ queryKey: apiKeys.projects(tenantId) });
    },
  });
}

export function useArchiveProject(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) =>
      responseData<{ project: ApiProject; warning: string }>(
        await apiClient.DELETE("/api/v1/tenant/{tenantId}/projects/{projectId}", {
          params: { path: { tenantId, projectId } },
        }),
      ),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: apiKeys.projects(tenantId) });
    },
  });
}

export function useProjectCollaborators(
  tenantId: string,
  projectId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: apiKeys.projectCollaborators(tenantId, projectId),
    enabled: Boolean(tenantId) && Boolean(projectId) && enabled,
    queryFn: async () =>
      responseData<ApiCollaborator[]>(
        await apiClient.GET(
          "/api/v1/tenant/{tenantId}/projects/{projectId}/collaborators",
          { params: { path: { tenantId, projectId } } },
        ),
      ),
  });
}

export function useAddProjectCollaborator(tenantId: string, projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: string; role: string }) =>
      responseData<ApiCollaborator>(
        await apiClient.POST(
          "/api/v1/tenant/{tenantId}/projects/{projectId}/collaborators",
          { params: { path: { tenantId, projectId } }, body: input },
        ),
      ),
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: apiKeys.projectCollaborators(tenantId, projectId),
      });
    },
  });
}

export function useRemoveProjectCollaborator(tenantId: string, projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) =>
      responseData(
        await apiClient.DELETE(
          "/api/v1/tenant/{tenantId}/projects/{projectId}/collaborators/{userId}",
          { params: { path: { tenantId, projectId, userId } } },
        ),
      ),
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: apiKeys.projectCollaborators(tenantId, projectId),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Modules
// ---------------------------------------------------------------------------

export interface CreateModuleInput {
  title: string;
  description?: string;
  projectId?: string;
  tag?: string;
  status?: string;
  assignedToUserId?: string;
}
export type UpdateModuleInput = Partial<CreateModuleInput>;

export function useModules(tenantId: string, projectId?: string, enabled = true) {
  return useQuery({
    queryKey: apiKeys.modules(tenantId, projectId),
    enabled: Boolean(tenantId) && enabled,
    queryFn: async () =>
      responseData<ApiModule[]>(
        await apiClient.GET("/api/v1/tenant/{tenantId}/modules", {
          params: {
            path: { tenantId },
            // The generated type marks this required despite the controller's
            // @ApiQuery({ required: false }) — it's genuinely optional at runtime.
            query: (projectId ? { projectId } : {}) as { projectId: string },
          },
        }),
      ),
  });
}

export function useModule(tenantId: string, moduleId: string, enabled = true) {
  return useQuery({
    queryKey: apiKeys.module(tenantId, moduleId),
    enabled: Boolean(tenantId) && Boolean(moduleId) && enabled,
    queryFn: async () =>
      responseData<ApiModule>(
        await apiClient.GET("/api/v1/tenant/{tenantId}/modules/{moduleId}", {
          params: { path: { tenantId, moduleId } },
        }),
      ),
  });
}

export function useCreateModule(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateModuleInput) =>
      responseData<ApiModule>(
        await apiClient.POST("/api/v1/tenant/{tenantId}/modules", {
          params: { path: { tenantId } },
          body: input,
        }),
      ),
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: ["api", "tenant", tenantId, "modules"],
      });
    },
  });
}

export function useUpdateModule(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      moduleId,
      input,
    }: {
      moduleId: string;
      input: UpdateModuleInput;
    }) =>
      responseData<ApiModule>(
        await apiClient.PATCH("/api/v1/tenant/{tenantId}/modules/{moduleId}", {
          params: { path: { tenantId, moduleId } },
          body: input,
        }),
      ),
    async onSuccess(module) {
      queryClient.setQueryData(apiKeys.module(tenantId, module.id), module);
      await queryClient.invalidateQueries({
        queryKey: ["api", "tenant", tenantId, "modules"],
      });
    },
  });
}

export function useArchiveModule(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (moduleId: string) =>
      responseData<{ module: ApiModule; warning: string }>(
        await apiClient.DELETE("/api/v1/tenant/{tenantId}/modules/{moduleId}", {
          params: { path: { tenantId, moduleId } },
        }),
      ),
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: ["api", "tenant", tenantId, "modules"],
      });
    },
  });
}

export function useModuleCollaborators(
  tenantId: string,
  moduleId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: apiKeys.moduleCollaborators(tenantId, moduleId),
    enabled: Boolean(tenantId) && Boolean(moduleId) && enabled,
    queryFn: async () =>
      responseData<ApiCollaborator[]>(
        await apiClient.GET(
          "/api/v1/tenant/{tenantId}/modules/{moduleId}/collaborators",
          { params: { path: { tenantId, moduleId } } },
        ),
      ),
  });
}

export function useAddModuleCollaborator(tenantId: string, moduleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: string; role: string }) =>
      responseData<ApiCollaborator>(
        await apiClient.POST(
          "/api/v1/tenant/{tenantId}/modules/{moduleId}/collaborators",
          { params: { path: { tenantId, moduleId } }, body: input },
        ),
      ),
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: apiKeys.moduleCollaborators(tenantId, moduleId),
      });
    },
  });
}

export function useRemoveModuleCollaborator(tenantId: string, moduleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) =>
      responseData(
        await apiClient.DELETE(
          "/api/v1/tenant/{tenantId}/modules/{moduleId}/collaborators/{userId}",
          { params: { path: { tenantId, moduleId, userId } } },
        ),
      ),
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: apiKeys.moduleCollaborators(tenantId, moduleId),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export interface CreateTaskInput {
  title: string;
  description?: string;
  projectId?: string;
  moduleId?: string;
  status?: string;
  priority?: string;
  visibility?: string;
  workingWith?: string;
  estimatedHours?: string;
  dueDate?: string;
}
export type UpdateTaskInput = Partial<CreateTaskInput>;

export function useTasks(tenantId: string, projectId?: string, enabled = true) {
  return useQuery({
    queryKey: apiKeys.tasks(tenantId, projectId),
    enabled: Boolean(tenantId) && enabled,
    queryFn: async () =>
      responseData<ApiTask[]>(
        await apiClient.GET("/api/v1/tenant/{tenantId}/tasks", {
          params: {
            path: { tenantId },
            // The generated type marks this required despite the controller's
            // @ApiQuery({ required: false }) — it's genuinely optional at runtime.
            query: (projectId ? { projectId } : {}) as { projectId: string },
          },
        }),
      ),
  });
}

export function useTask(tenantId: string, taskId: string, enabled = true) {
  return useQuery({
    queryKey: apiKeys.task(tenantId, taskId),
    enabled: Boolean(tenantId) && Boolean(taskId) && enabled,
    queryFn: async () =>
      responseData<ApiTask>(
        await apiClient.GET("/api/v1/tenant/{tenantId}/tasks/{taskId}", {
          params: { path: { tenantId, taskId } },
        }),
      ),
  });
}

export function useCreateTask(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTaskInput) =>
      responseData<ApiTask>(
        await apiClient.POST("/api/v1/tenant/{tenantId}/tasks", {
          params: { path: { tenantId } },
          body: input,
        }),
      ),
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: ["api", "tenant", tenantId, "tasks"],
      });
    },
  });
}

export function useUpdateTask(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      input,
    }: {
      taskId: string;
      input: UpdateTaskInput;
    }) =>
      responseData<ApiTask>(
        await apiClient.PATCH("/api/v1/tenant/{tenantId}/tasks/{taskId}", {
          params: { path: { tenantId, taskId } },
          body: input,
        }),
      ),
    async onSuccess(task) {
      queryClient.setQueryData(apiKeys.task(tenantId, task.id), task);
      await queryClient.invalidateQueries({
        queryKey: ["api", "tenant", tenantId, "tasks"],
      });
    },
  });
}

export function useDeleteTask(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) =>
      responseData<ApiTask>(
        await apiClient.DELETE("/api/v1/tenant/{tenantId}/tasks/{taskId}", {
          params: { path: { tenantId, taskId } },
        }),
      ),
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: ["api", "tenant", tenantId, "tasks"],
      });
    },
  });
}

export function useTaskMembers(tenantId: string, taskId: string, enabled = true) {
  return useQuery({
    queryKey: apiKeys.taskMembers(tenantId, taskId),
    enabled: Boolean(tenantId) && Boolean(taskId) && enabled,
    queryFn: async () =>
      responseData<ApiMember[]>(
        await apiClient.GET("/api/v1/tenant/{tenantId}/tasks/{taskId}/members", {
          params: { path: { tenantId, taskId } },
        }),
      ),
  });
}

export function useAddTaskMember(tenantId: string, taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) =>
      responseData<ApiMember>(
        await apiClient.POST("/api/v1/tenant/{tenantId}/tasks/{taskId}/members", {
          params: { path: { tenantId, taskId } },
          body: { userId },
        }),
      ),
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: apiKeys.taskMembers(tenantId, taskId),
      });
    },
  });
}

export function useRemoveTaskMember(tenantId: string, taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) =>
      responseData(
        await apiClient.DELETE(
          "/api/v1/tenant/{tenantId}/tasks/{taskId}/members/{userId}",
          { params: { path: { tenantId, taskId, userId } } },
        ),
      ),
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: apiKeys.taskMembers(tenantId, taskId),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export interface CreateNoteInput {
  title: string;
  content?: string;
  projectId?: string;
  moduleId?: string;
  visibility?: string;
}
export type UpdateNoteInput = Partial<CreateNoteInput>;

export function useNotes(tenantId: string, projectId?: string, enabled = true) {
  return useQuery({
    queryKey: apiKeys.notes(tenantId, projectId),
    enabled: Boolean(tenantId) && enabled,
    queryFn: async () =>
      responseData<ApiNote[]>(
        await apiClient.GET("/api/v1/tenant/{tenantId}/notes", {
          params: {
            path: { tenantId },
            // The generated type marks this required despite the controller's
            // @ApiQuery({ required: false }) — it's genuinely optional at runtime.
            query: (projectId ? { projectId } : {}) as { projectId: string },
          },
        }),
      ),
  });
}

export function useNote(tenantId: string, noteId: string, enabled = true) {
  return useQuery({
    queryKey: apiKeys.note(tenantId, noteId),
    enabled: Boolean(tenantId) && Boolean(noteId) && enabled,
    queryFn: async () =>
      responseData<ApiNote>(
        await apiClient.GET("/api/v1/tenant/{tenantId}/notes/{noteId}", {
          params: { path: { tenantId, noteId } },
        }),
      ),
  });
}

export function useCreateNote(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateNoteInput) =>
      responseData<ApiNote>(
        await apiClient.POST("/api/v1/tenant/{tenantId}/notes", {
          params: { path: { tenantId } },
          body: input,
        }),
      ),
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: ["api", "tenant", tenantId, "notes"],
      });
    },
  });
}

export function useUpdateNote(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      noteId,
      input,
    }: {
      noteId: string;
      input: UpdateNoteInput;
    }) =>
      responseData<ApiNote>(
        await apiClient.PATCH("/api/v1/tenant/{tenantId}/notes/{noteId}", {
          params: { path: { tenantId, noteId } },
          body: input,
        }),
      ),
    async onSuccess(note) {
      queryClient.setQueryData(apiKeys.note(tenantId, note.id), note);
      await queryClient.invalidateQueries({
        queryKey: ["api", "tenant", tenantId, "notes"],
      });
    },
  });
}

export function useDeleteNote(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (noteId: string) =>
      responseData<ApiNote>(
        await apiClient.DELETE("/api/v1/tenant/{tenantId}/notes/{noteId}", {
          params: { path: { tenantId, noteId } },
        }),
      ),
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: ["api", "tenant", tenantId, "notes"],
      });
    },
  });
}

export function useNoteMembers(tenantId: string, noteId: string, enabled = true) {
  return useQuery({
    queryKey: apiKeys.noteMembers(tenantId, noteId),
    enabled: Boolean(tenantId) && Boolean(noteId) && enabled,
    queryFn: async () =>
      responseData<ApiMember[]>(
        await apiClient.GET("/api/v1/tenant/{tenantId}/notes/{noteId}/members", {
          params: { path: { tenantId, noteId } },
        }),
      ),
  });
}

export function useAddNoteMember(tenantId: string, noteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) =>
      responseData<ApiMember>(
        await apiClient.POST("/api/v1/tenant/{tenantId}/notes/{noteId}/members", {
          params: { path: { tenantId, noteId } },
          body: { userId },
        }),
      ),
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: apiKeys.noteMembers(tenantId, noteId),
      });
    },
  });
}

export function useRemoveNoteMember(tenantId: string, noteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) =>
      responseData(
        await apiClient.DELETE(
          "/api/v1/tenant/{tenantId}/notes/{noteId}/members/{userId}",
          { params: { path: { tenantId, noteId, userId } } },
        ),
      ),
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: apiKeys.noteMembers(tenantId, noteId),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Generic enum values (e.g. module_type)
// ---------------------------------------------------------------------------

export interface ApiEnumValue {
  id: string;
  tenantId: string | null;
  category: string;
  value: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export function useEnumValues(category: string, enabled = true) {
  return useQuery({
    queryKey: ["api", "enum", category] as const,
    enabled: Boolean(category) && enabled,
    queryFn: async () =>
      responseData<ApiEnumValue[]>(
        await apiClient.GET("/api/v1/enum", { params: { query: { category } } }),
      ),
  });
}

// ---------------------------------------------------------------------------
// Pipeline stages
// ---------------------------------------------------------------------------

export interface ApiPipelineStage {
  id: string;
  tenantId: string | null;
  category: string;
  value: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const pipelineStagesKey = (tenantId: string) =>
  ["api", "tenant", tenantId, "pipeline-stages"] as const;

export function usePipelineStages(tenantId: string, enabled = true) {
  return useQuery({
    queryKey: pipelineStagesKey(tenantId),
    enabled: Boolean(tenantId) && enabled,
    queryFn: async () =>
      responseData<ApiPipelineStage[]>(
        await apiClient.GET("/api/v1/tenant/{tenantId}/pipeline-stages", {
          params: { path: { tenantId } },
        }),
      ),
  });
}

export function useCreatePipelineStage(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { value: string; sortOrder?: number }) =>
      responseData<ApiPipelineStage>(
        await apiClient.POST("/api/v1/tenant/{tenantId}/pipeline-stages", {
          params: { path: { tenantId } },
          body: input,
        }),
      ),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: pipelineStagesKey(tenantId) });
    },
  });
}

export function useUpdatePipelineStage(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: { value?: string; sortOrder?: number };
    }) =>
      responseData<ApiPipelineStage>(
        await apiClient.PATCH("/api/v1/tenant/{tenantId}/pipeline-stages/{id}", {
          params: { path: { tenantId, id } },
          body: input,
        }),
      ),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: pipelineStagesKey(tenantId) });
    },
  });
}

export function useDeletePipelineStage(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      responseData<ApiPipelineStage>(
        await apiClient.DELETE("/api/v1/tenant/{tenantId}/pipeline-stages/{id}", {
          params: { path: { tenantId, id } },
        }),
      ),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: pipelineStagesKey(tenantId) });
    },
  });
}
