import { Context } from './api.js';

export interface RoleInterface {
  name: string;
  allowRules: {
    [name: string]: any;
  };
  allow(action: string, fn: (root: any, props: any, context: Context) => Promise<boolean>): void;
  helpers: Record<string, unknown>;
}

export interface RoleInterfaceFactory {
  new (key: string): RoleInterface;
}

export type CheckPermissionArgs = [obj?: any, params?: any];

export interface RolesInterface {
  roles: {
    [name: string]: RoleInterface;
  };
  actions: string[];
  helpers: string[];
  registerAction(name: string): void;
  registerHelper(name: string): void;
  getUserRoles(userId: string, roles: Array<string>, includeSpecial: boolean): string[];
  allow(
    context: Context,
    roles: Array<string>,
    action: string,
    args: CheckPermissionArgs,
  ): Promise<boolean>;
  userHasPermission(context: Context, action: string, args: CheckPermissionArgs): Promise<boolean>;
  addUserToRoles(context: Context, roles: string | string[]): Promise<any>;
  adminRole?: RoleInterface;
  loggedInRole?: RoleInterface;
  allRole?: RoleInterface;
}

export interface IRoleOptionConfig {
  additionalRoles?: Record<string, (role: RolesInterface) => void>;
  additionalActions?: Array<string>;
}
