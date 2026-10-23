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
      PAYMENT:"/payment",
      CHOOSE_PLAN: "/choose-plan",
      INVITATION_SENT: "/invitation-sent",
      PRICING: "/pricing"
    }

  },
  SUPER_ADMIN: {
    ROOT: "/superadmin/*",
    DASHBOARD: "dashboard",
    GET_USERS: "get-users",
    GET_SUBSCRIPTIONS:"subscriptions",
    GET_WORKSPACES:'workspaces',
    GET_ORGANIZATIONS:'organizations',
    ACTIVITY_LOGS: "activity-logs",
    NAV: {
      DASHBOARD: "/superadmin/dashboard",
      GET_USERS: "/superadmin/get-users",
      SUBSCRIPTIONS:"/superadmin/subscriptions",
      WORKSPACES:"/superadmin/workspaces",
      ORGANIZATIONS:"/superadmin/organizations",
      ACTIVITY_LOGS: "/superadmin/activity-logs",
    },
  },
  WORKSPACE_ADMIN: {
    ROOT: "/workspaceadmin/*",
    DASHBOARD: "dashboard",
    GET_USERS: "get-users",
    ROOMS: "rooms",
    ROOM_DETAIL: "rooms/:id",
    ANNOUNCEMENTS: "announcements",
    ACTIVITY_LOGS: "activity-logs",
    NAV: {
      DASHBOARD: "/workspaceadmin/dashboard",
      GET_USERS: "/workspaceadmin/get-users",
      ROOMS: "/workspaceadmin/rooms",
      ROOM_DETAIL: (id: string) => `/workspaceadmin/rooms/${id}`,
      ANNOUNCEMENTS: "/workspaceadmin/announcements",
      ACTIVITY_LOGS: "/workspaceadmin/activity-logs",
    },
  },
  ORGANIZATION_ADMIN: {
    ROOT: "/organization-owner/*",
    DASHBOARD: "dashboard",
    WORKSPACES:"workspace",
    SUBSCRIPTION:"subscription",
    USERS:"users",
    ACTIVITY_LOGS: "activity-logs",
    NAV: {
       DASHBOARD: "/organization-owner/dashboard",
       WORKSPACES:"/organization-owner/workspace",
       SUBSCRIPTION:"/organization-owner/subscription",
       USERS:"/organization-owner/users",
       CREATE_WORKSPACE: "/organization-owner/create-workspace",
       WORKSPACE_DETAIL: (id: string) => `/organization-owner/getworkspace/${id}`,
       ACTIVITY_LOGS: "/organization-owner/activity-logs",
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
    SWITCH_WORKSPACE: "/api/auth/switch-workspace",
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
    PROFILE: "/api/workspaceadmin/profile",
    UPDATE_USER: (userId: string) => `/api/workspaceadmin/users/${userId}`,
    INVITE_USER: "/api/workspaceadmin/invite-user",
    ACTIVE_USERS: (workspaceId: string) => `/api/workspaceadmin/activeusers/${workspaceId}`,
  },
  ORGANIZATION_ADMIN: {
    GET_USERS: "/api/organization/get-users",
    SET_USER_WORKSPACES: (userId: string) => `/api/organization/users/${userId}/workspaces`,
    DASHBOARD_STATS: "/api/organization/dashboard-stats",
    CREATE: "/api/organization/create-organization",
    GET_ALL: "/api/organization/getall-organizations",
    UPDATE: (id: string) => `/api/organization/update-organization/${id}`,
    MY_ORGANIZATION: "/api/organization/my-organization",
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
    GET_MEMBER_WORKSPACES: "/api/workspace/available-to-me",
    CREATE: "/api/workspace/createworkspace",
    UPDATE: (workspaceId: string) => `/api/workspace/updateworkspace/${workspaceId}`,
    GET_ONE: (workspaceId: string) => `/api/workspace/getworkspace/${workspaceId}`,
    DELETE: (workspaceId: string) => `/api/workspace/deleteworkspace/${workspaceId}`,
    INVITE: (workspaceId: string) => `/api/workspace/${workspaceId}/invite`,
    GET_USERS: (workspaceId: string) => `/api/workspace/${workspaceId}/users`,
    REMOVE_USER: (workspaceId: string, userId: string) => `/api/workspace/${workspaceId}/users/${userId}`,
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
  DOCUMENT: {
    UPLOAD: (roomId: string) => `/api/rooms/${roomId}/documents`,
    GET_ALL: (roomId: string) => `/api/rooms/${roomId}/documents`,
    GET_FILE: (roomId: string, documentId: string) => `/api/rooms/${roomId}/documents/${documentId}/file`,
    DELETE: (roomId: string, documentId: string) => `/api/rooms/${roomId}/documents/${documentId}`,
  },
  CHAT: {
    GET_MESSAGES: (roomId: string) => `/api/chat/${roomId}/messages`,
    SEND_MESSAGE: (roomId: string) => `/api/chat/${roomId}/messages`,
    DELETE_MESSAGE: (roomId: string, messageId: string) => `/api/chat/${roomId}/messages/${messageId}`,
  },
  ACTIVITY: {
    RECORD: "/api/activitylog/record",
    GET_WORKSPACE_LOGS: "/api/activitylog/workspace",
    GET_ORGANIZATION_LOGS: (organizationId: string) => `/api/activitylog/organization/${organizationId}`,
    GET_SYSTEM_LOGS: "/api/activitylog/system",
  },
};
