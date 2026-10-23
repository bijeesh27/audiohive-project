export interface RegisterDTO{
    username:string;
    email:string;
    password:string,
    role?:string;
    workspaceIds?: string[];
    /** @deprecated Used only when reading pre-migration account data. */
    workspaceId?: string;
}

export interface OtpDTO{
    email:string,
    otp:string,
    purpose:string
}

export interface LoginDTO{
    email:string;
    password:string;
}

export interface SwitchWorkspaceDTO {
  workspaceId: string;
}

export interface ForgetPasswordDTO{
    email:string
}
export interface ChangePasswordDTO {
  oldPassword: string;
  password?: string;
}

export interface ResetPasswordDTO {
  email: string;
  password?: string;
}

export interface ResendOtpDTO {
  email: string;
}

export interface RegisterOwnerDTO {
  token: string;
  password: string;
}

export interface RegisterWorkspaceAdminDTO {
  token: string;
  username: string;
  password: string;
}

export interface RegisterWorkspaceUserDTO {
  token: string;
  username: string;
  password: string;
}

export type InvitationType = "workspace-user" | "workspace" | "organization";

export interface InvitationDetailsDTO {
  token: string;
  email?: string;
  role?: string;
  workspaceId?: string;
  organizationId?: string;
  type: InvitationType;
  workspaceAdminName?: string;
  invitedName?: string;
  ownerName?: string;
  ownerEmail?: string;
}