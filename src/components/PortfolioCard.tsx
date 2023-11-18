// @react-client-component
import React, { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";


export default function SharedModal() {
// ... rest of your component code
const applications = [
  {
    id: 0,
    name: "pricetriggers.com",
    imageUrl: "/applications/pricetriggers.png",
    description: "Self hosted Next.js project I started on the 8th of Nov 2023. I'm planning some cool as features but right now just getting it to do one thing well",
    techStack: ["Node.js", "TypeScript", "Next.js/React"],
    siteUrl: "https://pricetriggers.com",
  },
  {
    id: 1,
    name: "AdenTranter.com",
    imageUrl: "/applications/personalsite.png",
    description: "Simply my personal website | Going to add Blogging ability. Written in next.js and typescript and hosted on https://vercel.com/",
    techStack: ["Node.js", "TypeScript", "Next.js/React"],
    siteUrl: "https://adentranter.com",
  },
  {
    id: 2,
    name: "Whats Left",
    imageUrl: "/applications/todolist.png",
    description: "Basic todo list app. Uses local storage to store data. Gives the ability to work on PC and Phone. Hosted via digital ocean on a linux box using nginx.",
    techStack: ["Ember.js", "Javascript"],
    siteUrl: "https://whatsleft.fyi",
  },
  {
    id: 3,
    name: "PMC",
    imageUrl: "/applications/pmc.png",
    description: "Property Reporting Tool, Add in your property address and it will scrape some data for you and then allow you to add in your own data. Then print out great looking reports.",
    techStack: ["Node.js", "PostgreSQL","Express"],
    siteUrl: "",
  },
  {
    id: 4,
    name: "Authori",
    imageUrl: "/applications/vfilr.png",
    description: "Insurance Certificate Management | Allows you to upload your insurance certificates and then share them with your clients.",
    techStack: ["Node.js", "Ember.js","Express Rest API"],
    siteUrl: "https://authori.com.au",
  },
  {
    id: 5,
    name: "Booking System",
    imageUrl: "/applications/bookingsystem.png",
    description: "Booking System for a local business. Lets customers/students book in for classes. Manage their projects, and see their progress.",
    techStack: ["Node.js", "Ember.js","Express API"],
    siteUrl: "https://booking.studiodubbeld.com",
  },
  {
    id: 6,
    name: "Dubbeld Wood Tools",
    imageUrl: "/applications/dubbeldwoodtools.png",
    description: "Ecommerce store for local business. Setup for brick and motar store POS wise. Running via siteground.com on woocommerce.( hosted wordpress )",
    techStack: ["Wordpress", "Php","Javascript"],
    siteUrl: "https://dubbeldwoodtools.com",
  },
  {
    id: 7,
    name: "Studio Dubbeld",
    imageUrl: "/applications/studiodubbeld.png",
    description: "Simple Website for local business | Running on siteground.com ( hosted wordpress )",
    techStack: ["Wordpress", "Php","Javascript"],
    siteUrl: "https://studiodubbeld.com",
  },
  {
    id: 8,
    name: "Materials Checklist",
    imageUrl: "/applications/MaterialsApp.jpeg",
    description: "Materials Tally/Checklist for Booking system. Lets tutors add materials to students against a class. Charges the student and removes from the POS Above.",
    techStack: ["Node.js", "Ember.js","Express API"],
    siteUrl: "",
  },
];

 return (
  <>
    {applications.map((app) => (
      <>
      <div key={app.id} className="flex flex-col-reverse flex-row-reverse sm:flex-row items-center mb-8">
   {/* Image */}
   <div className="w-full sm:w-1/4">
    <Image height={1200} width={1300} src={app.imageUrl} alt={app.name} className="w-full" />
  </div>
  {/* Description and Tech Stack */}
  <div className="w-full sm:w-13/4 px-4">
    <h4 className="text-xl font-bold">{app.name}</h4>
    <p className="mb-2">{app.description}</p>
    <ul className="list-disc list-inside">
      {app.techStack.map((tech) => (
        <li key={tech}>{tech}</li>
      ))}
    </ul>
  </div>

  {/* Visit Site Button */}
  <div className="w-full invisible sm:visible sm:w-2/4 sm:text-right mb-4 sm:mb-0 my-5 ">
    {app.siteUrl && (
      <Link
        href={app.siteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-blue-500 my-5  hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Visit Site
      </Link>
    )}
  </div>



</div>
          <div className="w-full sm:invisible">
          <div className="white pt-px mb-5 w-full bg-white"/>
                </div>     
                </>
    ))}
 </>);
  };
