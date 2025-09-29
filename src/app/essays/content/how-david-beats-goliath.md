I don't have the precise global market share stats for QuickBooks versus its competitors, so read with a touch of salt. But what I do know is that here in Australia, QuickBooks is the underdog.

And I'm writing this from the perspective of someone who's been hands-on, trying to work with their developer tools and APIs. So this is less of a polished opinion piece and more of a field report about what it feels like to try building on this platform and how that experience ties into their grip on market share. _And future share._

## The B2B vs B2C Dynamic

If you are reading this, you probably already understand the core difference between:

• **B2B** (business-to-business)  
• **B2C** (business-to-consumer)

**Here are two things worth knowing:**

1. B2C products fail way more often than B2B.
2. But when B2C products _don't_ fail, they usually scale much bigger and make far more money than B2B.

You may be wondering what either of those things have to do with QuickBooks and their marketshare within Australia. I've been toying with the thought recently:

_**B2Bs are easy, until the market is saturated, and then it becomes a battle fought on B2C ground.**_

Cracking the code to break into these B2C-like markets often starts with something surprisingly simple: listening.

## The Stripe Success Story

Let's rewind. Looking at [Stripe.com](http://Stripe.com): Why did they take off? I believe it's because their founders were technical.

They did everything themselves solving their own problem. They wrote the docs, built the APIs, released SDKs _for developers_, and most importantly……*points to it*….they **listened**.

They didn't just add features; they _removed friction_. Stripe succeeded because the experience of building on Stripe was second to none.

(Whether or not they knew they had to write the documentation _for_ developers, or simply were just writing it from their own POV, which happened to be a dev. _Be your own user._)

## The QuickBooks Reality Check

Now contrast that with QuickBooks and particularly QuickBooks in Australia.

Right now, I'm dealing with a basic problem: I'm trying to use the API to pull a report for bookkeepers through the developer sandbox. When using the Australian sandbox, it includes things like GST. You aren't given access to this report, access to bookkeepers and accounts sandbox is only available for "US sandbox." This makes it difficult to properly test or build for my region.

This may seem like a small issue, but it's not. Developers, especially those integrating financial data, need sandbox environments that mirror production (just a copy of production data). We need to test confidently with real data, or at least something close, to avoid corrupting someone's actual books.

Another amusing aspect of access to cloned production data is that often, the problems third-party developers encounter are very odd, edge case niche problems that are usually paired with their live dataset. This makes testing these issues extremely challenging, almost impossible in some circumstances.

## The Support Nightmare

What makes this worse is that I've tried to reach out for support, and I keep hitting dead ends:

• The support emails simply link you to the forum.  
• The forums feel abandoned and in the end they didn't help resolve the issues.  
• The docs are a mess.

It all feels like legacy tech stacked under more and more layers of AI and widgets, without fixing the foundation.

Meanwhile, there's a Slack channel for QuickBooks developers but no actual QuickBooks employees. That's wild to me. I've ended up cold-adding Intuit employees from Sydney on LinkedIn, just trying to find someone to help.

**This is not how you build developer trust.**

And without developers, you don't have integrations. And without integrations, your product doesn't spread, and worse case, the people patching your holes stop.[0]

## The Acquisition Trap

Yes, Intuit is a huge company. But you need to play the underdog hand properly here. You can't just keep _buying_ your way into relevance, like you did with the Mailchimp acquisition. That was clever: it gave you an instant foot in the door with businesses already using Mailchimp, so you had a new channel to pitch QuickBooks to them.

But you can't keep acquiring your way out of product gaps. You can't keep building on a broken foundation; not in literal house-building, and not in virtual ones either.

The only way out of this hole is to **actually sit down and watch and listen to your users**. Or, next best thing: have an amazing communication stream with your third-party developers.

## The Path Forward

**Here's my ask:**

Talk to your developers. Give us access to the right tools. Make documentation and sandboxing region-aware. And _be where your builders are_ - in forums, in Slack, in the feedback loops.

**Low-hanging fruit:**

Allow a filter on your API Documentation, so you're asked up front:

_Are you looking for API documentation for apps that connect directly to end-user accounts?_  
_Or is it a tool written for bookkeepers and accountants?_  
_Or both?_

I know you _kinda_ have it written out, but developers think they know better and don't read everything properly. So you can either get annoyed about that, or just put a modal box popup on your API docs and **handle it**.

This is how David beats Goliath. Not with a bigger budget. But by being faster, leaner, and more connected to the people doing the actual building.

Or in David's case: **Just know where to hit him with the rock.[1]**

If you want to chat, I'm keen. Slack, email, phone, just reach out.

Now let's get _into it_.

**In-tu-it.**

[0]: an interesting insight here is, production grade data is absolutely required in a sandbox mode if you are a new company that is looking to build on quickbooks data. At scale - checks and balances are always required.

[1]: Whether or not he meant to hit him in the head, jury is still out; but let this be testimony to the concept of blind faith.
