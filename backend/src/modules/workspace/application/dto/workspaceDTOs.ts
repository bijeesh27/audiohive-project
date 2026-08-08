

export interface createWorkspaceDTO {
  companyName: string;
  workspaceAdminName: string;
  workspaceAdminEmail: string;
  planId: string;
  status: string;
  workspaceSlug: string;
  paymentStatus: string;
  amountPaid: number;
}
export interface updateWorkspaceDTO {
  companyName?: string;
  workspaceAdminName?: string;
  workspaceAdminEmail?: string;
  planId?: string;
  status?: string;
  workspaceSlug?: string;
  paymentStatus?: string;
  amountPaid?: number;
}

export interface deleteWorkspaceDTO{
  workspaceId:string
}
