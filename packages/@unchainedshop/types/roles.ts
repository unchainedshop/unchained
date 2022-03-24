import { Context } from './api';

export interface RoleInterface {
  name: string;
  allowRules: {
    [name: string]: any;
  };
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
  getUserRoles(context: Context, roles: Array<string>, includeSpecial: boolean): string[];
  allow(
    context: Context,
    roles: Array<string>,
    action: string,
    args: CheckPermissionArgs,
  ): Promise<boolean>;
  userHasPermission(context: Context, action: string, args: CheckPermissionArgs): Promise<boolean>;
  addUserToRoles(context: Context, roles: string | string[]): Promise<any>;
  checkPermission(context: Context, action: string, args: CheckPermissionArgs): Promise<void | never>;
  adminRole?: RoleInterface;
  loggedInRole?: RoleInterface;
  allRole?: RoleInterface;
}
