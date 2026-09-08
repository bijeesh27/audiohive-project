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
    ROOMS: "rooms",
    ROOM_DETAIL: "rooms/:id",
    ANNOUNCEMENTS: "announcements",
    NAV: {
      DASHBOARD: "/workspaceadmin/dashboard",
      GET_USERS: "/workspaceadmin/get-users",
      ROOMS: "/workspaceadmin/rooms",
      ROOM_DETAIL: (id: string) => `/workspaceadmin/rooms/${id}`,
      ANNOUNCEMENTS: "/workspaceadmin/announcements",
    },
  },
  ORGANIZATION_ADMIN: {
    ROOT: "/organization-owner/*",
    DASHBOARD: "dashboard",
    WORKSPACES:"workspace",
    SUBSCRIPTION:"subscription",
    USERS:"users",
    NAV: {
       DASHBOARD: "/organization-owner/dashboard",
       WORKSPACES:"/organization-owner/workspace",
       SUBSCRIPTION:"/organization-owner/subscription",
       USERS:"/organization-owner/users"
    },
  },
  MEMBER: {
    ROOT: "/member/*",
    DASHBOARD: "dashboard",
    GET_USERS: "get-users",
    ROOMS: "rooms",
    ROOM_DETAIL: "rooms/:id",
    ANNOUNCEMENTS: "announcements",
    NAV: {
      DASHBOARD: "/member/dashboard",
      ROOMS: "/member/rooms",
      ROOM_DETAIL: (id: string) => `/member/rooms/${id}`,
      ANNOUNCEMENTS: "/member/announcements",
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
    REGISTER_OWNER: "/api/auth/create-owner",
    REGISTER_USER: "/api/auth/register-user",
    UPDATE_USER:(userId:string)=>`/api/super-admin/users/${userId}`
  },
  SUPER_ADMIN: {
    GET_USERS: "/api/super-admin/get-users",
    APPROVE_WORKSPACE: "/api/super-admin/approve-workspace",
    DASHBOARD_STATS: "/api/super-admin/dashboard-stats",
  },
  WORKSPACE_ADMIN: {
    GET_USERS: "/api/workspaceadmin/get-users",
    DASHBOARD_STATS: "/api/workspaceadmin/dashboard-stats",
  },
  ORGANIZATION_ADMIN: {
    GET_USERS: "/api/organization/get-users",
    DASHBOARD_STATS: "/api/organization/dashboard-stats",
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
  ROOM: {
    GET_ALL: "/api/room",
    GET_ONE: (roomId: string) => `/api/room/${roomId}`,
    CREATE: "/api/room",
    UPDATE: (roomId: string) => `/api/room/${roomId}`,
    DELETE: (roomId: string) => `/api/room/${roomId}`,
    ALLOCATE: (roomId: string) => `/api/room/${roomId}/members`,
    GET_PARTICIPANTS: (roomId: string) => `/api/room/${roomId}/participants`,
    REMOVE_USER: (roomId: string, userId: string) => `/api/room/${roomId}/members/${userId}`,
  },
  ANNOUNCEMENT: {
    GET_ALL: "/api/announcement",
    GET_ONE: (id: string) => `/api/announcement/${id}`,
    CREATE: "/api/announcement",
    UPDATE: (id: string) => `/api/announcement/${id}`,
    DELETE: (id: string) => `/api/announcement/${id}`,
    PIN: (id: string) => `/api/announcement/${id}/pin`,
    MARK_READ: (id: string) => `/api/announcement/${id}/read`,
    UNREAD_COUNT: "/api/announcement/unread-count",
    BY_ROOM: (roomId: string) => `/api/announcement/room/${roomId}`,
  },
};