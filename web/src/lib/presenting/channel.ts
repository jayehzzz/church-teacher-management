"use client";

import type { PresentingMessage } from "./types";
import { getChannelName } from "./types";

export type PresentingChannel = {
  send: (message: PresentingMessage) => void;
  subscribe: (handler: (message: PresentingMessage) => void) => () => void;
  close: () => void;
};

export function createPresentingChannel(sessionId: string): PresentingChannel {
  const name = getChannelName(sessionId);
  const channel = new BroadcastChannel(name);

  function send(message: PresentingMessage) {
    channel.postMessage(message);
  }

  function subscribe(handler: (message: PresentingMessage) => void) {
    const listener = (event: MessageEvent) => {
      handler(event.data as PresentingMessage);
    };
    channel.addEventListener("message", listener);
    return () => channel.removeEventListener("message", listener);
  }

  function close() {
    channel.close();
  }

  return { send, subscribe, close };
}



