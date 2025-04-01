export interface Essay {
  slug: string;
  title: string;
  date: string;
  content: string;
  excerpt: string;
}

export const essays: Record<string, Essay> = {
  'critical-systems-revisited': {
    slug: 'critical-systems-revisited',
    title: "Critical Systems Revisited",
    date: '2025-03-20',
    excerpt: "A reflection on why critical systems often fail while consumer platforms remain reliable, exploring the impact of organizational structure and company culture on system resilience.",
    content: `
*December 26, 2016 (Updated March 20, 2025)*  
*Reading Time: 6 minutes and probably give or two thou of some milli-seconds*

A while ago there was an outage of a major airline due to a computer system glitch. Jetstar's computer system went down.[1]

I was pondering about how Facebook never goes down yet a lot of corporate networks regularly experience outages.

## Why?

Why is it that non-critical systems such as Twitter, Facebook, Amazon, eBay, Google rarely go down while real-time critical systems fail more frequently?

I believe this comes down to two primary factors: **Organisational Structures** and **Company Culture**.

Organisational structures define where you sit within the company hierarchy. Usually, the people writing the code are at the lower end of this structure. One of the major drawbacks of such hierarchies is that you could have brilliance—someone like Einstein working for you, offering CEO-level insights—but their advice will go unheard simply due to their position and the number of organisational layers between them and decision makers.

I suspect that engineers working on Jetstar's systems likely knew about major flaws due to aging infrastructure and legacy code. The problem with culture is that it's typically defined by founders and early hires who eventually occupy the top positions on the org chart. Technology choices are often determined by these same people. If leadership makes incorrect technological assessments, they'll likely choose suboptimal solutions. Even if half their engineering team agrees that migrating from platform X to Y would yield substantial improvements with zero downtime, the decision isn't theirs to make, and the company culture doesn't create channels for their reasoning to be heard.

Paul Graham writes about culture and technology stacks in his excellent essay "Great Hackers."[2] 

Companies with consistently reliable online services understand this dynamic. They recognise the value of culture and creating feedback mechanisms for engineers.

Perhaps the distance between reality and perception grows proportional to how far someone is from the bottom of the organisational chart. The more levels in your hierarchy, the more likely executives become disconnected from operational priorities.

These thoughts represent my observations from my perspective at that time. I still fly Jetstar regularly, so no hard feelings there.

---

## Nine Years Later: A Reflection 
*March 20, 2025*

Reading my thoughts from nearly a decade ago, I'm struck by both how much has changed in the technology landscape and yet how much of my original thoughts still rings true.

Back in 2016, I observed the disconnect between decision-makers and technical practitioners. Today, this dynamic continues to play out across industries, though with some important changes. The rise of DevOps, site reliability engineering practices, and the "you build it, you run it" philosophy has helped bridge some of these gaps in forward-thinking companies. Yet many enterprises still struggle with the same fundamental organisational challenges I identified years ago.

What I didn't fully appreciate then was how deeply these companies' culture reflect their broader philosophical approaches around problem-solving. The hierarchical organisations I criticised weren't just inefficient communication structures; they represented a worldview where specialisation and compartmentalisation were valued over holistic understanding. Need to know basis breaks holistic problem solving….mostly.

In the years since writing that original piece, I've come to recognise that my frustration wasn't just about technical systems failing. It was about human systems failing to appreciate the interconnected nature of problems. Resilience isn't just technically sound companies, but ones that cultivate environments where the understanding of "why" is valued.

This realisation has profoundly shaped my choices and the projects I've been drawn to. I've found myself gravitating toward environments where curiosity is encouraged and where questioning assumptions is viewed as a strength rather than insubordination. I've seen firsthand how organisations that flatten communication hierarchies - not necessarily management hierarchies - tend to build more resilient systems.

What remains consistent in my thinking is the belief that technical problems are rarely just technical problems. They're usually manifestations of a company's challenges. The companies that have the most reliable systems aren't necessarily those with the most advanced technology, they're the ones with cultures that value understanding root causes, that create space for reflection, and that respect the insights of those closest to the systems themselves.

As I look back on my younger self's observations, I see someone who was beginning to connect these dots. I was starting to understand that the reliability of critical systems isn't just a matter of better code or more redundancy, it's about creating organisations where reality can flow freely up and down the hierarchy, where perception and reality remain tightly coupled regardless of one's position on an org chart.

In today's world of increasing system complexity and interconnectedness, these insights seem more relevant than ever. The most successful modern startups and companies have found ways to combat the distance between perception and reality, creating feedback loops that keep decision-makers connected to ground truth. And while we've made progress, there's still much work to be done in building truly resilient socio-technical systems.

Perhaps the most important evolution in my thinking is recognising that effective problem-solving requires not just technical expertise but a deep curiosity about why things work the way they do, at both the technical and human levels. The organisations that cultivate this curiosity, that reward asking why instead of just accepting what is, are the ones building the most reliable systems for our future.

---

[1] This referenced a specific Jetstar outage from 2016.  
[2] Graham, Paul. "Great Hackers." http://www.paulgraham.com/gh.html`
  },
  'charity-philosophy': {
    slug: 'charity-philosophy',
    title: "Why I'm not donating to your charity, or my personal philosophy on how to ethically run companies.",
    date: '2024-12-25',
    excerpt: "An exploration of charity models, business ethics, and why the traditional charity approach might not be the most effective way to create lasting positive change.",
    content: `
We've all been there—you walk into a store and someone is standing at the entrance asking you to donate to <insert noble cause here>. It's uncomfortable. It feels like begging, but with a corporate twist. And suddenly, saying no makes you feel like the bad guy.
 
Let me be clear: I don't have an issue with the cause itself. Feeding the hungry, flying patients to hospitals, training guide dogs—these are all noble missions. My problem lies with _how_ charities operate and, more importantly, how businesses manipulate charitable giving to shift responsibility onto consumers.
 
## The Flawed Logic of Traditional Charity
 
Why do people start charities? Often, it's driven by good intentions:
 
-   Feeding the poor
-   Helping children in need
-   Providing medical care in remote areas
-   Supporting disaster relief efforts
 
At face value, these causes "do no harm". But once a charity is founded, it needs money. And when donations dry up, the charity dies. They are a loss centre, period.
 
Many charities fall into one of a few categories:
 
-   Corporate tax shelters
-   Passion projects started by individuals who genuinely care (but struggle with funding)
-   Institutions founded by churches, schools, hospitals, or governments
-   Family-run organizations designed to provide jobs to immediate family rather than maximize impact (I didn't say nepotism)
 
Regardless, all charities face the same problem: financial sustainability. The formula is simple:
 
**Runway = money in the bank ÷ daily operating costs**
 
Most charities rely on constant fundraising, meaning they are always at risk of running out of money. This leaves them vulnerable, dependent on donations, and, in some cases, forced to operate in ways that prioritize survival over impact.
 
## Corporations Are Taking the Piss
 
Picture this: You're at a gas station, buying fuel, and the cashier asks if you'd like to "round up" your total to support a charity. You hesitate—do you want to be the person who refuses to donate a few cents to feed starving children?
 
But here's the kicker: The company asking for your money is pulling in billions in profit, yet they want _you_ to fund charities. Why? Because it's easier and cheaper to push the burden onto customers than to simply donate from their own pockets.
 
The critical thinkers in the room will probably be saying something like, well that's a clever hack to provide unlimited runway to your charity. But it's also bloody poor form, if you ask me. Instead of spending money on call centres or employees to solicit donations, corporations have turned frontline workers into unpaid fundraisers (read: beggars), pressuring everyday people into giving.
 
Would it be so crazy to profit less and give more?
Would it be so crazy for a <business model> to have charity built in?
Would it be so crazy to build companies that care?
 
## A Better Way: Ethical Business Models
 
There is a better way. Take **Zambrero**, for example—a fast-food chain that donates a meal for every meal purchased in their Plate 4 Plate program. To date, they've provided over 88.5 million meals, matching customer purchases out of their own pocket. Instead of guilt-tripping customers into donating, it rewards them with karmic dividends for simply making a mindful purchase. This approach ensures charitable giving is wrapped directly into the business model, making it both sustainable and scalable.
 
## The Future of Ethical Companies
 
If you're starting a business, do it right. Build generosity into the foundation of your company rather than treating it as an afterthought. Employees should be valued as stakeholders, and companies should operate with a genuine duty of care—not just to their shareholders, but to society as a whole.
 
Right now, we can't change the laws to force businesses to be ethical. But we _can_ change the conversation. Companies should be judged not just by their profits but by whether they follow ethical guidelines that prioritize people over endless growth.
 
So next time you're pressured to donate at checkout, remember: Charity shouldn't be a guilt-driven afterthought. It should be a responsibility that businesses take on themselves. And maybe, just maybe, that starts with us demanding better.`
  },
  'cutting-boards-need-feet': {
    slug: 'cutting-boards-need-feet',
    title: "Cutting boards need feet, or why being a purist and pragmatic are mutually exclusive",
    date: '2025-01-01',
    excerpt: "An exploration of the tension between purism and pragmatism through the lens of cutting board design, and why sometimes compromising on ideals leads to better outcomes.",
    content: `
You can't sell cutting boards without feet without people returning the boards in a few months. Why? Well, turns out typical people don't know what happens when they clean their cutting boards. End grain cutting boards are a lot of work - the purist in me tells me it's crazy to put feet on the board. After all, why is an end grain cutting board so good? 

Well, without getting into the exact why - the reason is: A side grain cutting board (note, they are never marketed as this) will slowly get cut up and the timber will flake away over time. An end grain cutting board won't have this happen, it's a lot harder to make any lasting cuts on them. Because of the way these boards are made, it means technically you can use them on both sides, but there is a catch. If you for some reason, leave water underneath it, or it's a very wet day - due to the nature of timber (it moves only in one plane) it will "cup" - i.e. it won't be flat anymore! 

Now technically you can fix this by wetting the other side, letting it cup the other way and then drying it correctly. This is not something normal people are going to do. So the purist gets caught in the fire.

## do they:

 - Double the surface area, i.e. use both sides and if they give them to
   family give the directions on the fact that you should place a mini
   towel under it
 - Or simply put feet on one side and be done with it.

Now, the reason why the cutting board is a perfect analogy
for purist vs pragmatic is because often the purist is trapped within
an echo chamber.
They are not looking at things through the prism of
holistic nature; if they were, they would understand the fact that
end grain cutting boards will last a lifetime, so the real data
points they are choosing from are the following:  

 - High risk but double sides
 - Low risk but have to compromise perceived values.

Ironically, from an aesthetics point of view, having 4mm tiny feet
underneath it gives it an amazing shadow.  

**Sidenote:** It's not that being a purist and pragmatic aren't mutually exclusive. I like to give the following definition. The pragmatic purist - A purist that
can compromise.

`
  },
  'teaching-in-context': {
    slug: 'teaching-in-context',
    title: "Teaching in context works, or why the best learning is when you think you aren't being taught",
    date: '2025-01-15',
    excerpt: "An exploration of how contextual learning and creative engagement could transform education, using the evolution of spell-checking as a lens to understand deeper truths about how we learn.",
    content: `The evolution of spell-checking technology tells us something profound about how we might transform education. In the past, spell-checkers simply underlined errors in red, offering corrections through a right-click menu. While some users might have learned from this process, most simply clicked and moved on, treating it as a tool for correction rather than learning. Today's systems offer auto-suggestions and quick completions – more efficient, perhaps, but still prioritizing convenience over education.

## The Power of Content
Imagine a future where these tools adapt to individual learning patterns, understanding context and adjusting their assistance accordingly. This shift from assistive technology to educational technology mirrors the difference between handing someone a calculator and teaching them mathematics. It's not just about getting the right answer; it's about building understanding through context.

This context-dependent learning reflects a deeper truth about education: genuine problem-solving requires understanding the broader picture. Just as machine learning models need context to suggest appropriate words, students need meaningful connections to truly grasp concepts. Yet our current educational system often fails to provide these connections, leaving students with abstract knowledge they struggle to apply.

## The Hidden Crisis in Teaching
The challenges run deeper than just teaching methods. Consider the experience of a science and math teacher who recently switched to tutoring because the baseline noise level in a classroom of 20-30 students made teaching nearly impossible. This isn't an isolated incident - many talented educators struggle with large group instruction, finding it akin to public speaking. For teachers sensitive to such environments, traditional classrooms become almost untenable, leading to inevitable burnout or exit from the profession.

As we face a growing teacher shortage, we must acknowledge that our current system isn't designed to address these fundamental problems. Consider Thomas Edison, labeled as 'addled' by his teachers, who ultimately thrived through home schooling.

Today, we face a serious deficit in creativity - not just artistic expression, but the broader ability to create, whether that's writing books, developing applications, building rockets, or composing music. Humans can either consume or create, and everything we consume was once someone's creation.

## Reimagining Education
A solution might lie in radically rethinking how we structure education. Imagine a system where students who demonstrate active creation in any field receive significant flexibility in their traditional schooling. This isn't just about reducing classroom time; it's about rewarding creative engagement that exercises the mind in meaningful ways.

This new framework would also bring back teachers who left due to environmental stress, placing them in smaller classes of around six students. In these intimate settings, education becomes truly contextual. A student building bottle rockets in their creative time can bring that passion to math class, where the entire group might work on calculating flight trajectories.

## The Path Forward
Implementation would require dynamic testing methods, likely powered by AI and language models, to assess learning in ways that reflect individual paths while maintaining measurable standards. While this vision might seem utopian, the best problem-solving often starts with imagining an ideal end state, then working backward to determine practical steps.

This isn't just about teaching differently - it's about creating an environment where learning happens naturally, where creation is celebrated, and where both students and teachers can thrive within their natural tendencies rather than fighting against them.

The key elements for success include:
• Creating spaces where teachers can work within their natural strengths, not against them
• Enabling students to learn through their interests and creative pursuits
• Maintaining small class sizes that allow for true contextual learning
• Using technology to support and enhance learning, not just to correct mistakes

The path forward requires pragmatic choices about what we can implement now and what must wait. But the core vision remains: an educational system that serves both students and teachers while preparing learners for real-world creation and problem-solving.`
  },
  'being-happy': {
    slug: 'being-happy',
    title: "Being Happy, or How to Probably Be a Pragmatic Leader",
    date: '2025-03-25',
    excerpt: "An exploration of how perspective and zoom levels affect leadership and happiness, arguing that effective leadership requires mastering the art of shifting focus between different levels of detail.",
    content: `
Everyone and everything is 'okay' until you zoom in. This thought process creates the context of cynicism. However, the take away from this shouldn't be the view of a cynic. 

Instead, we want to understand how the same event can have all these different levels of perception/detail/zoom/knowledge. This concept may be hard to grasp; however, we all know the saying "Everything looks perfect far away" Why is this? You should be able to figure this out. Someone standing infront of you will take up like 30-40% of your eyes "view". Someone far away might be 1% of your "view". 

Just like a clock without minutes can still be used to tell the time, changing your zoom reveals minutes, seconds, milliseconds, and microseconds that can all be plotted. Most of the time, we don't need to focus on all the different layers of a clock. We just need to catch a glimpse and act upon it in real time.

To lead effectively, you must develop the ability to change the zoom levels of whatever you're examining. 
The key question becomes: "What zoom level is required for this situation at this very moment?"

Being aware of these zoom levels allows you to set aside what scope of time you may not have and simply act on what you do have right now. 

This is where pragmatic leadership begins - understanding what level of detail is necessary for the current decision.
Remember, just as one sees all the flaws in furniture once they've been pointed out, you need to be able to change this filter/zoom level on the fly. The goal is to optimise for the present moment while keeping long-term goals in mind.
True pragmatic leadership isn't about ignoring details or being overly fixated on them. It's about knowing when each level of perspective serves the situation best.

A pragmatic leader understands that different decisions require different zoom levels:
* Strategic planning requires zooming out to see the entire landscape
* Crisis management often requires zooming in on immediate details
* Team development requires alternating between individual concerns and group dynamics


Perhaps happiness itself comes from mastering this skill of perspective shifting. When we zoom too far in on problems, we lose sight of progress. When we stay too zoomed out, we miss the meaningful details that bring joy.
Happiness means finding the sweet spot of perspective that allows for both effectiveness and contentment - knowing when to dive deep and when to rise above.

Be happy and go help your neighbour mow.`
  }
} 