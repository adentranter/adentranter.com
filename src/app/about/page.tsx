import { Metadata } from 'next'
import Image from 'next/image'
export const metadata: Metadata = {
  title: 'About | Aden Tranter',
  description: 'Trying to figure stuff out in Townsville, QLD.',
}

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">About Aden</h1>
      <hr className="my-8 border-t border-white/10" />
      <div className="mb-12">
        <Image
          src="/me.jpg"
          alt="Portrait photo in a dark setting with blue tones"
          width={400}
          height={400}
          className="rounded-lg mx-auto"
          priority
        />
      </div>
      <section className="prose dark:prose-invert max-w-none space-y-8">
        <p className="text-lg">
          I spend too much time thinking about why things work the way they do. 
          It started with computers - that rabbit hole of "how does this actually work?" 
          led me from Windows to Linux to probably too many years at uni trying to understand 
          how typing on a keyboard somehow makes things happen on a screen.
        </p>

        <div>
          <h2 className="text-2xl font-semibold">On Building</h2>
          <p>
          I love building things. Started with physical projects - crafting sailboats from wood, experimenting with hovercrafts, and launching bottle rockets in the backyard. Naturally drifted into electronics, tinkering with circuits and components. These days I mostly build software and web applications, but that fundamental joy of creating something from scratch has never changed.
          </p>
        
        </div>

        <div>
          <h2 className="text-2xl font-semibold">On Startups</h2>
          <p>
            Look, startups are objectively a terrible idea. Most fail. You'll work too much, 
            stress too much, and probably make less money than if you'd just gotten a normal job. 
            Or literally just sat on your money.
          </p>
          <p>
            But here's what fascinates me: startups are never solving just one problem. At minimum, 
            you're juggling two core challenges. First, there's the actual product - the thing you're 
            building. That's the easy part, believe it or not.
          </p>
          <p>
            The second problem is trickier - it's perception. Marketing sounds like a dirty word, 
            but really it's about execution. Sometimes you need to convince people they even have 
            a problem to begin with. Think about it: nobody was asking to rent strangers' spare rooms 
            before Airbnb. Nobody thought "hey, I wish random people would drive me around" before Uber.
          </p>
          <p>
            This is where my obsession with user experience comes in. Not just the "how does this button work" 
            kind of UX, but the whole picture - how people perceive, understand, and ultimately use what you're 
            building. It's this weird intersection of psychology, design, and problem-solving that keeps 
            pulling me back in, even when I know better.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold">These Days</h2>
          <p>
            Still trying to figure stuff out. People call it overthinking - they're probably right. 
            But sometimes going too deep into the "why" of things leads somewhere interesting. 
            Other times it's just a waste of time. I'm getting better at telling the difference. 
            Maybe.
          </p>
        </div>
      </section>
    </div>
  )
} 