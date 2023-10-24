import Link from "next/link";
import TopTopNav from "./components/TopTopNav";

export default function Home() {
  return (
   <div className="h-screen">
    <TopTopNav />
    <div className="container mx-auto mt-5">
        <div className="flex items-center min-h-[50%]">
          <div className="w-2/5">
            <img alt="Photo Of Aden Tranter 2023" src="/AdenTranter.jpg" className="rounded justify-left" />
          </div>   
          <div className="w-3/5 ">
            <h1 className="text-4xl font-bold">Aden Tranter</h1>
            <div className="text-2xl  font-extralight"><Link href="/programming">Programmer</Link>, <Link href="/programming">Problem Solver</Link>, <Link href="/photography">Photographer</Link>, <Link href="/furniture">Creator</Link></div>
          </div>
        </div>
        <div className="h-1 w-full bg-slate-200 mt-10"></div>
          <div className="w-full text-2xl font-extralight"><span className="text-2xl font-bold">Location: </span>Townsville, Queensland</div>
          <div className="w-full text-2xl font-extralight"><span className="text-2xl font-bold">Email: </span>me at adentranter dot com</div>
          <div className="w-full text-2xl font-extralight"><span className="text-2xl font-bold">Phone: </span>email for it</div>
      </div>
    </div>
  )
}
