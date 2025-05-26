"use client";

import React, { createContext, useContext, useState } from "react";
import { EScreen } from "~/lib/constants";
import type { TUserContext } from "~/lib/types";

interface PotLuckContextProps {
  potLuckUser: TUserContext | null;
  setPotLuckUser: React.Dispatch<React.SetStateAction<TUserContext | null>>;
  screen: EScreen;
  setScreen: React.Dispatch<React.SetStateAction<EScreen>>;
}

const PotLuckContext = createContext<PotLuckContextProps | undefined>(undefined);

export const PotLuckProvider: React.FC<{ children: React.ReactNode; }> = ({ children }) => {
  const [potLuckUser, setPotLuckUser] = useState<TUserContext | null>(null);
  const [screen, setScreen] = useState<EScreen>(EScreen.LANDING_PAGE);

  // TODO: useEffect to initialise PotLuckUser

  return (
    <PotLuckContext.Provider
      value={{
        potLuckUser,
        screen,
        setScreen,
        setPotLuckUser,
      }}
    >
      {children}
    </PotLuckContext.Provider>
  );
};

export const usePotLuck = (): PotLuckContextProps => {
  const context = useContext(PotLuckContext);
  if (!context) {
    throw new Error("usePotLuck must be used within a PotLuckProvider");
  }
  return context;
};