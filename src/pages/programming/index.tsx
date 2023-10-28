import Link from "next/link";
import TopTopNav from "../../components/TopTopNav";
import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>Aden Tranter | Programming</title>
      </Head>

      <div>
        <TopTopNav />
        <section className="text-white py-16">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl font-bold">Aden Tranter</h1>
            <p className="mt-4 text-2xl">
              Im a programmer with expertise in Node.js, TypeScript, Ember.js,
              React, and Vue.js.
            </p>
          </div>
        </section>

        <section className=" py-16">
          <h3>More to Come</h3>
        </section>
      </div>
    </>
  );
}
