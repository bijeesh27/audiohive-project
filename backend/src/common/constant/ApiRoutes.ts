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
    GET_USER:"/users/:id"
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
  },
  ORGANIZATION:{
    CREATE_ORGANIZATION:'/create-organization',
    UPDATE_ORGANIZATION:'/update-organization/:id',
    DELETE_ORGANIZATION:'/delete-organization/:id',
    GET_ALL_ORGANIZATIONS:'/getall-organizations'
  },
  WORKSSPACE:{
    CREATE_WORKSPACE:"/createworkspace",
    UPDATE_WORKSPACE:"/updateworkspace/:id",
    DELETE_WORKSPACE:"/deleteworkspace/:id",
    GET_ALL_WORKSPACES:"/getallworkspaces",
    GET_MY_WORKSPACES:"/my-workspaces"
  }
};
