export interface IuseCase<IRequest, IResponse> {
  execute(Request?: IRequest): Promise<IResponse>;
}
