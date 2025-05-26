"use client";

import { usePotLuck } from "~/components/providers/PotLuckProvider";
import Landing from "./Landing";
import CreatePot from "./CreatePot";
import { EScreen } from "~/lib/constants";

export default function ScreenSelector() {
  const {
    screen
  } = usePotLuck();

  switch (screen) {
    case EScreen.LANDING_PAGE:
      return <Landing />;
    case EScreen.CREATE_POT:
        return <CreatePot />;
    case EScreen.JOIN_POT:
        return <Landing />;
    default:
      throw new Error(`Invalid screen: ${screen}`);
  }
}