"use client";

import LocaleSwitcher from "../shared/LocaleSwitcher/LocaleSwitcher";
import Branches from "./branches";
import { Profile } from "./profile";
import TotalPrice from "./total-prices";

export function Header() {
  return (
    <header className="flex items-center justify-between h-[60px] left-[var(--sidebar-w)]! px-2 w-full top-0 bg-blue-950">
      {/* Профиль стоит последним справа — это якорь пользовательского меню,
          ИИ-ассистент переехал в плавающую кнопку (app/(pages)/layout.jsx) */}
      <div className="flex ml-auto items-center gap-3">
        <TotalPrice />
        <Branches />
        <LocaleSwitcher />
        <Profile />
      </div>
    </header>
  );
}
