import { IRoomDocument } from "../infrastructure/roomSchema"



export interface IroomRepository {
    createRoom(data:IRoomDocument):Promise<void>
    updateRoom(roomId:string,data:Partial<IRoomDocument>):Promise<void>
    deleteRoom(roomId:string):Promise<void>
    findRoom(roomId:string):Promise<IRoomDocument | null>
    getAllRooms(workspaceId: string, page: number, limit: number, search?: string, userId?: string, role?: string): Promise<{ rooms: IRoomDocument[], total: number }>
    updateAllowedUsers(roomId: string, userIds: string[]): Promise<void>
    getRoomParticipants(roomId: string, page?: number, limit?: number, search?: string): Promise<{ participants: { _id: string; username: string; email: string; role: string; status: boolean }[]; total: number }>
    removeRoomUser(roomId: string, userId: string): Promise<void>
}