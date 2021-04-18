import { IRequestContext } from "../utils";

export const processActions = async (serviceConfig: any, context: IRequestContext, actionKey: string) => {
  try {
    const actionFn: any = await context.getSync(actionKey);
    await actionFn(context)
    return context.getSync(`${serviceConfig.id}.output`);
  } catch (err) {
    if (err.message.indexOf(`The key '${actionKey}' is not bound to any value in context`) > -1) {
      return false
    }
  }
}
