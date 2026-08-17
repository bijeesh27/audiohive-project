export const API_ROUTES = {
  PUBLIC: {
    LANDING: "/*",
    LOGIN: "login",
    REGISTER: "register",
    FORGOT_PASSWORD:"forgot-password",
    RESET_PASSWORD:"reset-password",
    OTP: "otp",
    PRICING:'pricing',
    NAV:{
      LANDING:'/',
      LOGIN:"/login",
      RESET_PASSWORD:"/reset-password",
      OTP:"/otp",
      PENDING_APPROVAL:"/pendingapproval",
      PAYMENT:"/payment"
    }

  },
  SUPER_ADMIN: {
    ROOT: "/superadmin/*",
    DASHBOARD: "dashboard",
    GET_USERS: "get-users",
    GET_SUBSCRIPTIONS:"subscriptions",
    GET_WORKSPACES:'workspaces',
    GET_ORGANIZATIONS:'organizations',
    NAV: {
      DASHBOARD: "/superadmin/dashboard",
      GET_USERS: "/superadmin/get-users",
      SUBSCRIPTIONS:"/superadmin/subscriptions",
      WORKSPACES:"/superadmin/workspaces",
      ORGANIZATIONS:"/superadmin/organizations"
    },
  },
  WORKSPACE_ADMIN: {
    ROOT: "/workspaceadmin/*",
    DASHBOARD: "dashboard",
    GET_USERS: "get-users",
    NAV: {
      DASHBOARD: "/workspaceadmin/dashboard",
      GET_USERS: "/workspaceadmin/get-users"
    },
  },
  ORGANIZATION_ADMIN: {
    ROOT: "/organization-owner/*",
    DASHBOARD: "dashboard",
    WORKSPACES:"workspace",
    SUBSCRIPTION:"subscription",
    NAV: {
       DASHBOARD: "/organization-owner/dashboard",
       WORKSPACES:"/organization-owner/workspace",
       SUBSCRIPTION:"/organization-owner/subscription"
    },
  },
  MODERATOR: {
    ROOT: "/moderator/*",
    DASHBOARD: "dashboard",
    GET_USERS: "get-users",
    NAV: {
      DASHBOARD: "/moderator/dashboard",
      GET_USERS: "/moderator/get-users"
    },
  },
  MEMBER: {
    ROOT: "/member/*",
    DASHBOARD: "dashboard",
    GET_USERS: "get-users",
    NAV: {
      DASHBOARD: "/member/dashboard",
    },
  },
  WORKSPACE:{
    NAV:{
      CREATE_WORKSPACE:"/createworkspace",
      PENDING_APPROVAL:"/pendingapproval"
    }
  },
  ORGANIZATION:{
    NAV:{
      CREATE_ORGANIZATION:'/create-organization',

    }
  }
};


export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    VERIFY_OTP: "/api/auth/verify-otp",
    RESEND_OTP: "/api/auth/resend-otp",
    FORGOT_PASSWORD: "/api/auth/forget-password",
    RESET_PASSWORD: "/api/auth/reset-password",
    LOGOUT: "/api/auth/logout",
    INVITATION_DETAILS: (token: string) => `/api/auth/invitation/${token}`,
    REGISTER_ADMIN: "/api/auth/register-admin",
    UPDATE_USER:(userId:string)=>`/api/super-admin/users/${userId}`
  },
  SUPER_ADMIN: {
    GET_USERS: "/api/super-admin/get-users",
    APPROVE_WORKSPACE: "/api/super-admin/approve-workspace",
  },
  WORKSPACE_ADMIN: {
    GET_USERS: "/api/workspaceadmin/get-users",
  },
  MODERATOR: {
    GET_USERS: "/api/moderator/get-users",
  },
  SUBSCRIPTION: {
    GET_ALL: "/api/subscription/getallsubscriptions",
    CREATE: "/api/subscription/createsubcription",
    UPDATE: "/api/subscription/updatesubscription",
    DELETE: "/api/subscription/deletesubscription",
  },
  WORKSPACE: {
    GET_ALL: "/api/workspace/getallworkspaces",
    GET_MY: "/api/workspace/my-workspaces",
    CREATE: "/api/workspace/createworkspace",
    UPDATE: (workspaceId: string) => `/api/workspace/updateworkspace/${workspaceId}`,
  },
};