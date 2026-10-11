import { common } from "./common";
import { landing } from "./landing";
import { auth } from "./auth";
import { customer } from "./customer";
import { dashboard } from "./dashboard";
import { tour } from "./tour";
import type { Message } from "./types";

export const MESSAGES = {
  ...common,
  ...landing,
  ...auth,
  ...customer,
  ...dashboard,
  ...tour,
} satisfies Record<string, Message>;

export type MessageKey = keyof typeof MESSAGES;
