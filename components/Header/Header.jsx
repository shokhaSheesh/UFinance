"use client"

import LocaleSwitcher from '../shared/LocaleSwitcher/LocaleSwitcher'
import Branches from './branches'
import { Profile } from './profile'
import TotalPrice from './total-prices'

export function Header() {

    return (
        <>
            <header className="flex items-center h-[60px] left-20! pr-20! fixed w-full z-10! top-0 justify-end bg-blue-950">
                <div className="flex items-center gap-3">
                    <TotalPrice />
                    <Profile />
                    <Branches />
                    <LocaleSwitcher />
                </div>
            </header>
        </>
    )
}
