import {
  SuperAdminOrgQueryDTO,
  SuperAdminOrgListResponseDTO,
  OrganizationDetailResponseDTO,
} from "../application/dtos/SuperAdminOrganizationDTO.ts";

export interface IsuperAdminOrganizationsRepository {
  getOrganizations(
    query: SuperAdminOrgQueryDTO
  ): Promise<SuperAdminOrgListResponseDTO>;

  getOrganizationById(id: string): Promise<OrganizationDetailResponseDTO | null>;

  updateOrganizationStatus(
    id: string,
    status: "active" | "suspended" | "archived",
    actorId: string,
    reason?: string
  ): Promise<void>;

  updateOrganizationPlan(
    id: string,
    planId: string,
    actorId: string
  ): Promise<void>;

  updateOrganizationDetails(
    id: string,
    data: { companyName?: string; slug?: string; ownerName?: string; ownerEmail?: string },
    actorId: string
  ): Promise<void>;

  archiveOrganization(id: string, actorId: string): Promise<void>;
}
