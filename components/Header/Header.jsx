"use client";

import AiChatButton from "../AiChat/AiChatButton";
import LocaleSwitcher from "../shared/LocaleSwitcher/LocaleSwitcher";
import Branches from "./branches";
import { Profile } from "./profile";
import TotalPrice from "./total-prices";

export function Header() {
  return (
    <>
      <header className="flex items-center justify-between h-[60px] left-20! px-2 w-full  top-0  bg-blue-950">
        <AiChatButton />
        <div className="flex items-center gap-3">
          <TotalPrice />

          <Profile />
          <Branches />
          <LocaleSwitcher />
        </div>
      </header>
    </>
  );
}
