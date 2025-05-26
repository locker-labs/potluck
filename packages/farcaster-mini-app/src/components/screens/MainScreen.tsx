'use client'

import ScreenSelector from "./ScreenSelector";
import { PotLuckProvider } from "../providers/PotLuckProvider";

export default function MainScreen() {
    return (
        <PotLuckProvider>
            <ScreenSelector />
        </PotLuckProvider>
    );
}