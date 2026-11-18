import {
  SuperAdminPlanDTO,
  CreateOrUpdatePlanDTO,
  PlanImpactCheckResultDTO,
  SuperAdminSubscriptionsFilterDTO,
  SuperAdminSubscriptionsResponseDTO,
} from "../application/dtos/SuperAdminSubscriptionDTO.ts";

export interface IsuperAdminSubscriptionsRepository {
  getAllPlans(): Promise<SuperAdminPlanDTO[]>;
  checkPlanImpact(planId: string, newMaxWorkspaces: number): Promise<PlanImpactCheckResultDTO>;
  createPlan(dto: CreateOrUpdatePlanDTO, actorId?: string, actorEmail?: string): Promise<SuperAdminPlanDTO>;
  updatePlan(planId: string, dto: CreateOrUpdatePlanDTO, actorId?: string, actorEmail?: string): Promise<SuperAdminPlanDTO>;
  updatePlanStatus(
    planId: string,
    status: "active" | "inactive" | "archived",
    actorId?: string,
    actorEmail?: string
  ): Promise<SuperAdminPlanDTO>;
  setDefaultPlan(planId: string, actorId?: string, actorEmail?: string): Promise<SuperAdminPlanDTO>;
  deletePlan(planId: string, actorId?: string, actorEmail?: string): Promise<{ success: boolean; message: string }>;
  getSubscriptions(filter: SuperAdminSubscriptionsFilterDTO): Promise<SuperAdminSubscriptionsResponseDTO>;
  changeOrganizationPlan(
    organizationId: string,
    targetPlanId: string,
    actorId?: string,
    actorEmail?: string
  ): Promise<{ success: boolean; message: string }>;
}
