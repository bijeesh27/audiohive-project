import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IroomRepository } from "../../domain/IroomRepository";
import { CreateRoomDTO } from "../dto/roomDTO";
import { IRoomDocument } from "../../infrastructure/roomSchema";
import { IactivityLogRepository } from "../../../activityLog/domain/IactivitylogRepository";
import { IsubscriptionRepository } from "../../../subscription/domain/IsubscriptionRepository";
import { IorganizaionRepository } from "../../../organization/domain/IorganizationRepository";
import { AppError } from "../../../../common/Errors/AppError";
import { HttpStatus } from "../../../../common/constant/httpStatus";

export class CreateRoomUseCase
  implements IuseCase<CreateRoomDTO, void>
{
  constructor(
    private readonly roomRepository: IroomRepository,
    private readonly activityLogRepository: IactivityLogRepository,
    private readonly subscriptionRepository?: IsubscriptionRepository,
    private readonly organizationRepository?: IorganizaionRepository
  ) {}

  async execute(data: CreateRoomDTO): Promise<void> {
    data.isPrivate = data.type === "private";

    // Non-default rooms are checked against the plan's maxRooms limit
    if (!data.isDefault) {
      let maxRooms = 10; // default plan room limit
      if (this.organizationRepository && this.subscriptionRepository && data.organizationId) {
        try {
          const org = await this.organizationRepository.findOrganizationById(data.organizationId);
          if (org?.planId) {
            let sub = await this.subscriptionRepository.findSubscription(org.planId);
            if (!sub && typeof org.planId === "string" && /^[0-9a-fA-F]{24}$/.test(org.planId)) {
              sub = await this.subscriptionRepository.findSubscriptionById(org.planId);
            }
            if (sub && typeof sub.maxRooms === "number") {
              maxRooms = sub.maxRooms;
            }
          }
        } catch {
          // fallback to default maxRooms if plan lookup not available
        }
      }

      // Default room (Lounge) does NOT count against maxRooms limit
      const currentNonDefaultCount = await this.roomRepository.countNonDefaultRooms(data.workspaceId);
      if (currentNonDefaultCount >= maxRooms) {
        throw new AppError(
          `Workspace room limit of ${maxRooms} reached for your plan. The default Lounge room does not count towards this limit.`,
          HttpStatus.BAD_REQUEST
        );
      }
    }
    
    const room = await this.roomRepository.createRoom(
      data as unknown as IRoomDocument
    );

    await this.activityLogRepository.recordActivity({
      occurredAt: new Date(),

      action: "ROOM_CREATED",

      actorId: data.createdBy,

      organizationId: data.organizationId,

      workspaceId: data.workspaceId,

      targetType: "ROOM",

      targetId: room._id.toString(),

      metadata: {
        roomName: data.name,

        roomType: data.type,

        isPrivate: data.isPrivate ?? false,

        isDefault: data.isDefault ?? false,
      },
    });
  }
}