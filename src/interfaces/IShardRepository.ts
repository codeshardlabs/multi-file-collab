

export interface IShardRepository {
    findById: (id: string) => Promise<unknown>
}