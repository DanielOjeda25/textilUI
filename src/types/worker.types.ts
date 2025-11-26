export type WorkerMessage<T = unknown> = {
  type: string
  payload: T
}
