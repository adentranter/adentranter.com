export interface Essay {
  slug: string;
  title: string;
  date: string;
  content: string;
  excerpt: string;
}

export const essays: Record<string, Essay> = {
  'charity-philosophy': {
    slug: 'charity-philosophy',
    title: "Why I'm Not Donating to Your Charity: A Philosophy on Ethical Business",
    date: '2024-03-20',
    excerpt: "An exploration of charity models, business ethics, and why the traditional charity approach might not be the most effective way to create lasting positive change.",
    content: `We all know the feeling when you start walking into a store and there is a little stall at the front with people (akin to beggars), asking you to donate money to <insert some good cause>. Hell, I only needed to get some flour and eggs.

Now, don't get me wrong - I don't have a problem with their mission. I have a problem with their method of execution and fundamentally their ethics. I'm going to spell out the two basic vehicles that businesses fall under.

When creating a charity, one might ask why? Why create a charity? Well at a surface level its usually warm and fuzzy feelings:
• We feed the poor
• We fly people in rural areas to hospitals
• We clothe the poor
• We train guide dogs
• We help support kids over in 3rd world countries to eat

Whatever it is, it's "typically" viewed as a noble cause - not one that could be frowned upon.

So once someone has come up with this <noble cause idea> then you have to go convince people to start giving you money so you can then start doing <noble actions> as shit costs money.

The mechanics of the inner workings of a charity - I do not want to go into here, but how many charities are either:
• Created by a company for tax purposes
• Created by a person who actually cared and did the work (and didn't take money per se but allowed helpers - these organisations usually start small and take a long time to grow if they ever do)
• Created by a company to hire family
• Created by a church
• Created by a school
• Created by a hospital
• Created by a government

To run an organisation you need money. If you run out, your org dies. So then, how many of these charities are just sitting ducks when it comes to their <method of execution>? How many are about to run out of money? How much does it cost to run their particular area?

The formula for when a company is going to die is simple (read as "runway"):
numberOfDaysWeCanStillOperate = amountOfMoneyInTheBank / costToRunOrganisation per day

Of course this is a gross oversimplification however it's 99% there. The edge cases in this scenario are things like organisations that find volunteers vs having to find donors to fund their cause.

It seems like a cruel joke when you can see what is going on, why is it up to the guy filling up his car with fuel and asked to round up and donate to some cause that makes you an asshole for not giving the 15 cents. But let me remind you that Coles profited 1.13 Billion dollars in 2024 yet they are asking you to round up to feed the kids?

The critical thinkers in the room will probably be saying something like, well that is a clever way to provide unlimited runway to your charity.

And whilst on one hand you are correct, you have only done that. Provided a means for a for-profit company that profits in the billions to instead of paying for people to stand at the front of shops or in call centres - to instead make the person that has to work at the fuel station ask the "will you donate".

Would it be so crazy to profit less and give more?
Would it be so crazy to simply build a <business model> that has charity built in?
Would it be so crazy to have a "you buy one, we donate one" model?
Would it be so crazy to build companies ethically?
Would it be so crazy to start treating people like people?

Examples like the fast food place Zambrero's; where they donate one meal for every meal purchased. This is not only a scalable business model - but in many ways it's a way of protecting the people that the charity helps.

Think about it, let's say a charity is created like the royal flying doctors - they hire a bunch of people to raise money so they can hire pilots and lease planes. It's all rosy until you have to fire everyone and they have families and it's Christmas. So we don't want to create these layers of dependencies as little Tommy out in the field may have not gone and played with his brother and broken his leg; which requires a flying doctor which requires a pilot waiting on standby which requires a plane which requires a person to service it.

The waves from the boat roll for miles.

So please, if you are the type of person that has to found a company, found it right and cultivate a giving community and lead by example. You have not only a duty of care to yourself, to your shareholders (which should be your employees) and mostly to the rest of the world.

I believe for-profit companies are akin to an eye for an eye (ps it leaves the world either blind or broke).

We cannot currently change the laws to enforce these ideals, but in a way we are given such a great metric to be able to view the status of the mean (pun intended) ethics of a company is by if they start to adopt a set of "guidelines" for ethically running a company.

Please think for yourself and be nice to your neighbours - you never know when you are going to need some flour and eggs.`
  }
} 