import Link from "next/link";
import TopTopNav from "../../components/TopTopNav";
import Head from "next/head";
import Image from 'next/image'
import PortfolioCard from "../../components/PortfolioCard";

export default function Home() {
  // Example list of applications

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

        
            <PortfolioCard/>
         
          </div>
        </section>
      </div>
    </>
  );
}
