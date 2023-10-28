import Link from "next/link";
import TopTopNav from "../../components/TopTopNav";
import Head from 'next/head'

export default function Home() {
  return (
    <>
    <Head>
    <title>Aden Tranter | Programming</title>
    </Head>

   <div className=" ">
    <TopTopNav />
<section className="text-white py-16">
    <div className="container mx-auto text-center">
        <h1 className="text-4xl font-bold">Aden Tranter</h1>
        <p className="mt-4 text-2xl">I'm a programmer with expertise in Node.js, TypeScript, Ember.js, React, and Vue.js.</p>
    </div>
</section>

<section className=" py-16">
    <div className="container mx-auto text-center">
        <h2 className="text-3xl font-bold">My Skills</h2>
        <div className="flex justify-center mt-8">
            <div className="bg-blue-500 text-white rounded-full px-4 py-2 mx-2">Node.js</div>
            <div className="bg-blue-500 text-white rounded-full px-4 py-2 mx-2">TypeScript</div>
            <div className="bg-blue-500 text-white rounded-full px-4 py-2 mx-2">Ember.js</div>
            <div className="bg-blue-500 text-white rounded-full px-4 py-2 mx-2">React</div>
            <div className="bg-blue-500 text-white rounded-full px-4 py-2 mx-2">Vue.js</div>
        </div>
    </div>
</section>

<section className=" py-16">
    <div className="container mx-auto text-center">
        <h2 className="text-3xl font-bold">Portfolio</h2>
        
    </div>
</section>



    </div>

    </>
  )
}
