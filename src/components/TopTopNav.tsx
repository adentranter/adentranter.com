// @react-client-component
import { PhoneIcon, GlobeAltIcon } from "@heroicons/react/24/solid";
import React, { ReactNode, useEffect, useState } from "react";
import SocialMediaIcons from "./SocialMediaIcons";
import Link from "next/link";
// ... rest of your component code
import * as Ariakit from "@ariakit/react";
import Bars from "./Icons/Bars";

const TopTopNav: React.FC = () => {
  return (
    <>
      <nav className="bg-slate-950 h-[50px] leading-none text-white">
        <div className="container mx-auto flex justify-between items-center">
          <Ariakit.MenuProvider>
            <Ariakit.MenuButton className="button">
              <Bars />
              <Ariakit.MenuButtonArrow />
            </Ariakit.MenuButton>
            <Ariakit.Menu gutter={8} className="menu">
              <Link href="/">
                {" "}
                <Ariakit.MenuItem className="menu-item">Home</Ariakit.MenuItem>
              </Link>
              <Link href="/programming">
                <Ariakit.MenuItem className="menu-item">
                  Programming
                </Ariakit.MenuItem>
              </Link>
              <Link href="/photography">
                <Ariakit.MenuItem className="menu-item">
                  Photography
                </Ariakit.MenuItem>
              </Link>
              <Link href="/furniture">
                <Ariakit.MenuItem className="menu-item">
                  Creator
                </Ariakit.MenuItem>
              </Link>
              <Ariakit.MenuSeparator className="separator" />
              <Link href="/">
<Ariakit.MenuItem className="menu-item">Contact</Ariakit.MenuItem></Link>
            </Ariakit.Menu>
          </Ariakit.MenuProvider>

          <div className="flex leading-none space-x-4">
            <SocialMediaIcons />
          </div>
        </div>
        <div className="h-px bg-gray-500	  w-full"></div>
      </nav>
    </>
  );
};

export default TopTopNav;
