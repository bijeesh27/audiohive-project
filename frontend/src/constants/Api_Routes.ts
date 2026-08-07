export const API_ROUTES = {
  PUBLIC: {
    LANDING: "/*",
    LOGIN: "login",
    REGISTER: "register",
    OTP: "otp",
    PRICING:'pricing'

  },
  SUPER_ADMIN: {
    ROOT: "/superadmin/*",
    DASHBOARD: "dashboard",
    GET_USERS: "get-users",
    GET_SUBSCRIPTIONS:"subscriptions",
    NAV: {
      DASHBOARD: "/superadmin/dashboard",
      GET_USERS: "/superadmin/get-users",
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
};
