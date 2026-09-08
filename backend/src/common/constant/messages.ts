export const MESSAGES = {
  ERRORS: {
    USER_ALREADY_EXISTS: "User already exists",
    USER_NOT_FOUND: "User not found",

    INVALID_OTP: "Invalid OTP",
    PASSWORD_MISMATCH: "Passwords do not match",
    VALIDATION_FAILED: "Validation failed",

    INVALID_TOKEN: "Invalid token",
    REFRESH_TOKEN_NOT_FOUND: "Refresh token not found",
    INVALID_REFRESH_TOKEN: "Invalid or expired refresh token",
    SESSION_EXPIRED: "Session expired. Please log in again.",

    ACCESS_DENIED: "Access denied. Insufficient permissions.",
    ACCOUNT_DISABLED: "Your account has been disabled",

    SUBSCRIPTION_EXISIT: "Subscription already exists",
    SUBSCRIPTION_UPDATE_FAILED: "Failed to update subscription",
    SUBCRIPTION_NAME_UNDEFINED: "Subscription name is required",
    SUBSCRIPTION_NOT_FOUND: "Subscription not found",
    SUBSCRIPTION_DELETE_FAILED: "Failed to delete subscription",
    SUBSCRIPTION_PLAN_EXIST: "Subscription plan already exists",
    SUBSCRIPTION_ID_NOT_FOUND: "Subscription ID is required",

    WORKSPACE_CREATION_FAILED: "Failed to create workspace",
    WORKSPACE_INVALID_DATA: "Invalid workspace data",
    WORKSPACE_INVALID_ID: "Invalid workspace ID",
    WORKSPACE_NOT_FOUND: "Workspace not found",

    ORANIZATION_NOT_FOUND: "Organization not found",
    ROOM_NOT_FOUND: "Room not found",
    PRIVATE_ROOM_ACCESS_DENIED: "You do not have access to this private room. Please ask your Workspace Admin to grant you access.",
    WORKSPACE_ADMIN_NOT_FOUND: "Workspace not found for this admin",
    USER_NOT_IN_WORKSPACE: "User does not belong to a workspace",
    UNAUTHORIZED: "Unauthorized",
    ANNOUNCEMENT_NOT_FOUND: "Announcement not found",
  },

  SUCCESS: {
    REGISTRATION_IN_PROGRESS: "Registration is in progress",
    REGISTARTION_SUCCESSFULLY: "Workspace Admin registered successfully",
    OTP_VERIFIED: "OTP verified successfully",
    EMAIL_VERIFIED: "Email verified successfully",
    LOGIN_SUCCESS: "Login successful",
    LOGOUT_SUCCESSFULLY: "Logged out successfully",

    OTP_SEND_SUCCESSFULLY: "A new OTP has been sent successfully",
    PASSWORD_CHANGED: "Password changed successfully",
    TOKEN_REFRESHED: "Token refreshed successfully",

    SUBSCRIPTION_CREATED: "Subscription created successfully",
    SUBSCRIPTION_UPDATED: "Subscription updated successfully",
    SUBSCRIPTION_DELETED: "Subscription deleted successfully",
    GET_ALL_SUBSCRIPTIONS: "All subscriptions retrieved successfully",

    WORSPACE_CREATED: "Workspace created successfully",
    WORKSPACE_UPDATED: "Workspace updated successfully",
    WORKSPACE_DELETED: "Workspace deleted successfully",
    WORKSPACE_GET_ALL: "All workspaces retrieved successfully",
    WORKSPACE_APPROVED: "Workspace approved and invitation sent successfully",

    INVITATION_VALID: "Invitation is valid",
    INVITATION_SEND: "Invitation sent successfully",

    GET_WORKSPACE_ADMIN: "All Workspace Admins retrieved successfully",
    GET_ALL_MEMBERS: "All members retrieved successfully",
    USER_UPDATED: "User updated successfully",

    ORGANIZATION_CREATED: "Organization created successfully",
    ORGANIZATION_UPDATED: "Organization updated successfully",
    ORGANIZATION_DELETED: "Organization deleted successfully",
    GET_ALL_ORGANIZATIONS: "All organizations retrieved successfully",
    ORGANIZATION_FETCHED: "Organization fetched successfully",
    USERS_FETCHED: "Users fetched successfully",
    DASHBOARD_STATS_FETCHED: "Dashboard stats fetched",

    ROOM_CREATED: "Room created successfully",
    ROOM_UPDATED: "Room updated successfully",
    ROOM_DELETED: "Room deleted successfully",
    ROOM_FETCHED: "Room fetched successfully",
    ROOMS_FETCHED: "Rooms fetched successfully",
    ROOM_ACCESS_UPDATED: "Room access updated successfully",

    ANNOUNCEMENT_CREATED: "Announcement created successfully",
    ANNOUNCEMENT_UPDATED: "Announcement updated successfully",
    ANNOUNCEMENT_DELETED: "Announcement deleted successfully",
    ANNOUNCEMENT_FETCHED: "Announcement fetched successfully",
    ANNOUNCEMENTS_FETCHED: "Announcements fetched successfully",
    ANNOUNCEMENT_PINNED: "Announcement pin status updated",
    ANNOUNCEMENT_READ: "Announcement marked as read",
  },
};