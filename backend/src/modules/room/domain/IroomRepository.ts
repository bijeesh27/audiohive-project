import { IRoomDocument } from "../infrastructure/roomSchema"



export interface IroomRepository {
    createRoom(data:IRoomDocument):Promise<IRoomDocument>
    updateRoom(roomId:string,workspaceId:string,data:Partial<IRoomDocument>):Promise<void>
    deleteRoom(roomId:string,workspaceId:string):Promise<void>
    findRoom(roomId:string):Promise<IRoomDocument | null>
    getAllRooms(workspaceId: string, page: number, limit: number, search?: string, userId?: string, role?: string): Promise<{ rooms: IRoomDocument[], total: number }>
    updateAllowedUsers(roomId: string, workspaceId: string, userIds: string[]): Promise<void>
    getRoomParticipants(roomId: string, workspaceId: string, page?: number, limit?: number, search?: string): Promise<{ participants: { _id: string; username: string; email: string; role: string; status: boolean }[]; total: number }>
    removeRoomUser(roomId: string, workspaceId: string, userId: string): Promise<void>
}
