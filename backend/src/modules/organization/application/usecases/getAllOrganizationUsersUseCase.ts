import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IorganizaionRepository } from "../../domain/IorganizationRepository";
import { OrganizationNotFound } from "../../../../common/Errors/OrganizationError";
import { IuserDocument } from "../../../../shared/User.utils/userSchema";

export class GetAllOrganizationUsersUseCase implements IuseCase<{ ownerEmail: string; page: number; limit: number; search?: string }, { users: IuserDocument[]; total: number }> {
  constructor(private readonly organizationRepository: IorganizaionRepository) {}

  async execute({ ownerEmail, page, limit, search }: { ownerEmail: string; page: number; limit: number; search?: string }): Promise<{ users: IuserDocument[]; total: number }> {
    const organization = await this.organizationRepository.findByOwnerEmail(ownerEmail);
    if (!organization) {
      throw new OrganizationNotFound();
    }

    return await this.organizationRepository.getUsersByOrganization(
      organization._id as unknown as string,
      page,
      limit,
      search
    );
  }
}
