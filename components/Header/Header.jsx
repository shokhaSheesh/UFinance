"use client";

import LocaleSwitcher from "../shared/LocaleSwitcher/LocaleSwitcher";
import Branches from "./branches";
import { Profile } from "./profile";
import TotalPrice from "./total-prices";

export function Header() {
  return (
    <header className="flex items-center justify-between h-[60px] left-[var(--sidebar-w)]! px-4 w-full top-0 bg-white border-b border-slate-200">
      {/* Профиль стоит последним справа — это якорь пользовательского меню,
          ИИ-ассистент переехал в плавающую кнопку (app/(pages)/layout.jsx) */}
      <div className="flex ml-auto items-center gap-1">
        <TotalPrice />
        <Branches />
        <LocaleSwitcher />
        <Profile />
      </div>
    </header>
  );
}
