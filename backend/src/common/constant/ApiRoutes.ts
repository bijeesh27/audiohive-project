export const API_ROUTES = {
  AUTH: {
    REFRESH: "/refresh",
    REGISTER: "/register",
    VERIFY_OTP: "/verify-otp",
    RESEND_OTP: "/resend-otp",
    LOGIN: "/login",
    FORGET_PASSWORD: "/forget-password",
    CHANGE_PASSWORD: "/change-password",
    RESET_PASSWORD: "/reset-password",
    LOGOUT: "/logout",

    GET_INVITATION: "/invitation/:token",
    INVITATION: "/invitation/:token",

    REGISTER_ADMIN: "/register-admin",
    REGISTER_WORKSPACE_ADMIN: "/register-admin",

    REGISTER_ORANIZATION_OWNER: "/create-owner",
    REGISTER_USER: "/register-user",
  },

  SUPER_ADMIN: {
    GET_USERS: "/get-users",
    GET_USER: "/users/:id",
    APPROVE_WORKSPACE: "/approve-workspace",
    DASHBOARD_STATS: "/dashboard-stats",
  },

  WORKSPACE_ADMIN: {
    GET_USERS: "/get-users",
    INVITE_USER: "/invite-user",
    DASHBOARD_STATS: "/dashboard-stats",
    PROFILE: "/profile",
    UPDATE_USER: "/users/:id",
    GET_ACTIVE_USERS: "/activeusers/:workspaceId",
  },

  MEMBER: {},

  SUBSCRIPTION: {
    CREATE_SUBSCRIPTION: "/createsubcription",
    UPDATE_SUBSCRIPTION: "/updatesubscription",
    DELETE_SUBSCRIPTION: "/deletesubscription",
    GET_ALL_SUBSCRIPTIONS: "/getallsubscriptions",
    CREATE_CHECKOUT_SESSION: "/create-checkout-session",
    VERIFY_SESSION: "/verify-session",
  },

  ORGANIZATION: {
    CREATE_ORGANIZATION: "/create-organization",
    UPDATE_ORGANIZATION: "/update-organization/:id",
    DELETE_ORGANIZATION: "/delete-organization/:id",
    GET_ALL_ORGANIZATIONS: "/getall-organizations",
    GET_USERS: "/get-users",
    GET_MY_ORGANIZATION: "/my-organization",
    DASHBOARD_STATS: "/dashboard-stats",
    SEND_INVITATION: "/send-invitation",
  },

  WORKSPACE: {
    CREATE_WORKSPACE: "/createworkspace",
    UPDATE_WORKSPACE: "/updateworkspace/:id",
    DELETE_WORKSPACE: "/deleteworkspace/:id",
    GET_ALL_WORKSPACES: "/getallworkspaces",
    GET_MY_WORKSPACES: "/my-workspaces",
    INVITE: "/:id/invite",
    GET_WORKSPACE: "/getworkspace/:id",
    GET_USERS: "/:id/users",
    REMOVE_USER: "/:id/users/:userId",
  },

  ROOM: {
    CREATE_ROOM: "/",
    UPDATE_ROOM: "/:id",
    DELETE_ROOM: "/:id",
    GET_ALL_ROOMS: "/",
    GET_ROOM: "/:id",
    ALLOCATE_USERS: "/:id/members",
    GET_PARTICIPANTS: "/:id/participants",
    REMOVE_USER: "/:id/members/:userId",
  },

  ANNOUNCEMENT: {
    CREATE_ANNOUNCEMENT: "/",
    UPDATE_ANNOUNCEMENT: "/:id",
    DELETE_ANNOUNCEMENT: "/:id",
    PIN_ANNOUNCEMENT: "/:id/pin",
    UNREAD_COUNT: "/unread-count",
    GET_BY_ROOM: "/room/:roomId",
    GET_ALL: "/",
    GET_ONE: "/:id",
    MARK_READ: "/:id/read",
  },

  DOCUMENT: {
    UPLOAD_DOCUMENT: "/:roomId/documents",
    GET_ROOM_DOCUMENTS: "/:roomId/documents",
    DELETE_DOCUMENT: "/:roomId/documents/:documentId",
  },
  ACTIVITY:{
    RECORD_ACTIVITY:'/record'
  }
};