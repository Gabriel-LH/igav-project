export interface IUnitOfWork {
  execute<T>(operation: () => Promise<T> | T): Promise<T>;
}
