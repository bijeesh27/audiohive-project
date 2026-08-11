export const API_ROUTES = {
  AUTH: {
    REFRESH: "/refresh",
    REGISTER: "/register",
    VERIFY_OTP: "/verify-otp",
    RESEND_OTP:'/resend-otp',
    LOGIN: "/login",
    FORGET_PASSWORD: "/forget-password",
    CHANGE_PASSWORD: "/change-password",
    RESET_PASSWORD:'/reset-password',
    LOGOUT:'/logout',
    GET_INVITATION: '/invitation/:token',
    REGISTER_ADMIN: '/register-admin', 
    REGISTER_WORKSPACE_ADMIN  :'/register-admin',
    INVITATION:'/invitation/:token'
  },
  SUPER_ADMIN: {
    GET_USERS: "/get-users",
    APPROVE_WORKSPACE: "/approve-workspace",
  },
  WORKSPACE_ADMIN: {
    GET_USERS: "/get-users",
  },
  MODERATOR: {
    GET_USERS: "/get-users",
  },
  MEMBER: {},
  SUBSCRIPTION:{
    CREATE_SUBSCRIPTION:'/createsubcription',
    UPDATE_SUBSCRIPTION:'/updatesubscription',
    DELETE_SUBSCRIPTION:'/deletesubscription',
    GET_ALL_SUBSCRIPTIONS:'/getallsubscriptions'
  }
};
