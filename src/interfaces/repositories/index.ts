export interface IRepository {
  [key: string]: any;
}

export interface GenericResponse {
  data: any | null;
  error: any | null;
}