export const API_ROUTES = {
  PUBLIC: {
    LANDING: "/*",
    LOGIN: "login",
    REGISTER: "register",
    OTP: "otp",
  },
  SUPER_ADMIN: {
    ROOT: "/superadmin/*",
    DASHBOARD: "dashboard",
    GET_USERS: "get-users",
    NAV: {
      DASHBOARD: "/superadmin/dashboard",
      GET_USERS: "/superadmin/get-users",
    },
  },
  WORKSPACE_ADMIN: {
    ROOT: "/workspaceadmin/*",
    DASHBOARD: "dasboard",
    GET_USERS: "get-users",
    NAV: {
      DASHBOARD: "/workspaceadmin/dashboard",
    },
  },
  MODERATOR: {
    ROOT: "/moderator/*",
    DASHBOARD: "dashboard",
    GET_USERS: "get-users",
    NAV: {
      DASHBOARD: "/moderator/dashboard",
    },
  },
  MEMBER: {
    ROOT: "/member/*",
    DASHBOARD: "dashboard",
    NAV: {
      DASHBOARD: "/member/dashboard",
    },
  },
};
