// @react-client-component
import {  PhoneIcon, GlobeAltIcon } from '@heroicons/react/24/solid';
import React, { useEffect, useState } from 'react';
import SocialMediaIcons from './SocialMediaIcons'; 
import Link from 'next/link';
// ... rest of your component code




    const Navbar: React.FC = () => {
      return (
        <nav className="bg-slate-950 h-[50px] leading-none text-white">
          <div className="container mx-auto flex justify-between items-center">
            
            <div className="cursor-pointer leading-none hover:text-blue-300">
              <Link href="/">#HomeBase</Link>
            </div>
            
            <div className="flex leading-none space-x-4">
              <SocialMediaIcons />
            </div>
    
          </div>
          <div className='h-px bg-gray-500	  w-full'></div>
        </nav>
      );
    };
    
    export default Navbar;
