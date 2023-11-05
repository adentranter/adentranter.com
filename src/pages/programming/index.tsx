import Link from "next/link";
import TopTopNav from "../../components/TopTopNav";
import Head from "next/head";
import Image from 'next/image'

export default function Home() {
  // Example list of applications
  const applications = [
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
      <Head>
        <title>Aden Tranter | Programming</title>
      </Head>

      <div>
        <TopTopNav />

        <section className="text-white py-16">
          <div className="mx-auto w-3/4">
  <h1 className="text-3xl font-bold">Aden Tranter</h1>
            <p className="mt-4 text-1xl">
              I grew up in sunny Townsville, Australia where its 25°C to 31°C mostly year round. Started programming python at the age of 16 along with running linux ( after going through about 50 distros ) </p>
              <hr className="mt-5 mb-5"></hr>
              </div>
    {/* Column for Languages */}
    <div className="container mx-auto w-3/4 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">

    <div>
      <h2 className="text-2xl font-bold mb-4">Languages</h2>
      <ul className="text-1xl list-disc  text-left list-inside">
        <li>Javascript/TypeScript</li>
        <li>Node.js (Not really a lang)</li>
        <li>PHP</li>
        <li>Python</li>
        <li>C#</li>
        <li>Java</li>
        <li>VBS</li>
        <li>C</li>
      </ul>
    </div>

    {/* Column for Frameworks */}
    <div>
      <h2 className="text-2xl font-bold mb-4">Frameworks</h2>
      <ul className="text-1xl list-disc text-left list-inside">
        <li>Next.js/Node</li>
        <li>Laravel</li>
        <li>Django</li>
        <li>React</li>
        <li>Ember.js</li>
        <li>Vanilla JavaScript</li>
      </ul>
    </div>

    {/* Column for Databases */}
    <div>
      <h2 className="text-2xl font-bold mb-4">Databases</h2>
      <ul className="text-1xl list-disc text-left list-inside">
        <li>SQLite</li>
        <li>MySQL</li>
        <li>PostgreSQL</li>
        <li>MongoDB</li>
        <li>Redis</li>
        <li>DynamoDB</li>
        <li>Firebase</li>
      </ul>
    </div>

  </div>
</section>


        {/* Applications List */}
        <section className=" mx-auto py-16 flex">
          <div className="w-3/4 mx-auto">
            <h2 className="text-2xl font-bold mb-4">Here are some of the software Ive worked on</h2>
            <hr className="mt-5 mb-5"></hr>

          {applications.map((app) => (
            <div key={app.id} className="flex items-center mb-8">
              {/* Image */}
              <div className="w-1/4">
                <Image height={1200} width={1300} src={app.imageUrl} alt={app.name} className="w-full" />
              </div>

              {/* Description and Tech Stack */}
              <div className="w-1/2 px-4">
                <h4 className="text-xl font-bold">{app.name}</h4>
                <p className="mb-2">{app.description}</p>
                <ul className="list-disc list-inside">
                  {app.techStack.map((tech) => (
                    <li key={tech}>{tech}</li>
                  ))}
                </ul>
              </div>

              {/* Visit Site Button */}
              <div className="w-1/4 text-right">
                {app.siteUrl && (
 <Link
 href={app.siteUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
>
 Visit Site
</Link>
            
                )}
               
              </div>
            </div>
          ))}
          </div>
        </section>
      </div>
    </>
  );
}
