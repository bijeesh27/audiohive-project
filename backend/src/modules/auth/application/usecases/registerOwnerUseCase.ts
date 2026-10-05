import { IuseCase } from "../../../../shared/interface/IuseCase";
import { IuserRepository } from "../../domain/IuserRepository";
import { IorganizaionRepository } from "../../../organization/domain/IorganizationRepository";
import { InvalidOtpError } from "../../../../common/Errors/AuthError";
import bcrypt from "bcrypt";

interface RegisterOwnerInput {
    token: string;
    password: string;
}

interface CreateOwnerData {
    username: string;
    email: string;
    password: string;
    role: "organization-owner";
}

export class RegisterOwnerUseCase
    implements IuseCase<RegisterOwnerInput, void>
{
    constructor(
        private readonly userRepository: IuserRepository,
        private readonly organizationRepository: IorganizaionRepository
    ) {}

    async execute(data: RegisterOwnerInput): Promise<void> {
        const { token, password } = data;

        const invitation =
            await this.organizationRepository.findInvitationByToken(token);

        if (!invitation) {
            throw new InvalidOtpError();
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newOwner: CreateOwnerData = {
            username: invitation.ownerName,
            email: invitation.ownerEmail,
            password: hashedPassword,
            role: "organization-owner",
        };

        await this.userRepository.createUser(newOwner);

        await this.organizationRepository.deleteInvitation(token);
    }
}