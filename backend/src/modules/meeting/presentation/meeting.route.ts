import { Router } from "express";
import { authMiddleware, roleMiddleware } from "../../../middleware/authMiddleware.js";
import { UserRoles } from "../../../common/constant/userRoles.js";
import { API_ROUTES } from "../../../common/constant/ApiRoutes.js";
import { MeetingRepository } from "../infrastructure/meetingRepository.js";
import { CreateMeetingUseCase } from "../application/usecases/createMeetingUseCase.js";
import { GetMeetingsUseCase } from "../application/usecases/getMeetingsUseCase.js";
import { GetMeetingByIdUseCase } from "../application/usecases/getMeetingByIdUseCase.js";
import { UpdateMeetingUseCase } from "../application/usecases/updateMeetingUseCase.js";
import { CancelMeetingUseCase } from "../application/usecases/cancelMeetingUseCase.js";
import { DeleteMeetingUseCase } from "../application/usecases/deleteMeetingUseCase.js";
import { MeetingController } from "./meeting.controller.js";

const meetingRouter = Router();

const meetingRepository = new MeetingRepository();
const createMeetingUseCase = new CreateMeetingUseCase(meetingRepository);
const getMeetingsUseCase = new GetMeetingsUseCase(meetingRepository);
const getMeetingByIdUseCase = new GetMeetingByIdUseCase(meetingRepository);
const updateMeetingUseCase = new UpdateMeetingUseCase(meetingRepository);
const cancelMeetingUseCase = new CancelMeetingUseCase(meetingRepository);
const deleteMeetingUseCase = new DeleteMeetingUseCase(meetingRepository);

const meetingController = new MeetingController(
  createMeetingUseCase,
  getMeetingsUseCase,
  getMeetingByIdUseCase,
  updateMeetingUseCase,
  cancelMeetingUseCase,
  deleteMeetingUseCase
);

const allowedRoles = [
  UserRoles.SUPER_ADMIN,
  UserRoles.ORGANIZATION_OWNER,
  UserRoles.WORKSPACE_ADMIN,
  UserRoles.MEMBER,
];

meetingRouter.use(authMiddleware);
meetingRouter.use(roleMiddleware(allowedRoles));

meetingRouter.post(API_ROUTES.MEETING.CREATE_MEETING, meetingController.createMeeting);
meetingRouter.get(API_ROUTES.MEETING.GET_ALL_MEETINGS, meetingController.getMeetings);
meetingRouter.get(API_ROUTES.MEETING.VALIDATE_CODE, meetingController.validateMeetingCode);
meetingRouter.get(API_ROUTES.MEETING.GET_MEETING, meetingController.getMeetingById);
meetingRouter.put(API_ROUTES.MEETING.UPDATE_MEETING, meetingController.updateMeeting);
meetingRouter.patch(API_ROUTES.MEETING.CANCEL_MEETING, meetingController.cancelMeeting);
meetingRouter.delete(API_ROUTES.MEETING.DELETE_MEETING, meetingController.deleteMeeting);

export default meetingRouter;
