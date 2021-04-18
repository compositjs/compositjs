import { Context } from '@loopback/context';

/**
 * Configuration for plugin definitions
 */
interface IPluginConfiguration {
  dir?: string;
  extension?: string;
}

export interface IServerConfiguration {
  host?: string;
  port?: number;
  protocol?: string;
}

/**
 * Configuration for application
 */
export interface IApplicationConfiguration {
  enviornment?: string;
  routes?: IPluginConfiguration;
  services?: IPluginConfiguration;
  middlewares?: IPluginConfiguration;
  appRoot?: string;
  server?: IServerConfiguration;
}

/**
 * Service type
 */
export interface IService {
  execute(context: Context, routeServiceConfig?: any): Promise<void>
}

/**
 * Request context
 */
export interface IRequestContext extends Context {
  req: any;
  res: any;
}

export interface ObjectString {
  [key: string]: string
}
