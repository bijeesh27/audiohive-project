import { Model } from "mongoose";

export abstract class BaseRepository<T> {
  constructor(protected readonly model: Model<T>) {}

  async findOne(filter: Partial<T>) {
    return this.model.findOne(filter);
  }

  async findById(id: string) {
    return this.model.findById(id);
  }

  async create(data: Partial<T>) {
    return this.model.create(data);
  }

  async update(id: string, data: Partial<T>) {
    return this.model.findByIdAndUpdate(id, data);
  }

  async delete(id: string) {
    return this.model.findByIdAndDelete(id);
  }
}
