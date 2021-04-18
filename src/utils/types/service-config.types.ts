import { IRouteParametersConfig } from "./route-config.types";
import { ObjectString } from "./types";

export interface IServiceRequestConfig {
  url: string;
  host: string;
  path: string;
  method: string;
  parameters: IRouteParametersConfig;
  timeout: number;
  headers: ObjectString;
  cookies: ObjectString
}
