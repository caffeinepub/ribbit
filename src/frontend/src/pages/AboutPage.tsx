import { Separator } from '@/components/ui/separator';

export default function AboutPage() {
  return (
    <div className="container py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <img src="/assets/frog-face_1f438.png" alt="ribbit" className="h-16 w-16" />
          <h1 className="text-4xl font-bold text-primary">ribbit</h1>
        </div>

        <div className="mb-8 p-6 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">About Ribbit</h2>
          <div className="space-y-4">
            <p className="text-foreground/90">
              Welcome to <span className="font-semibold text-primary">ribbit</span>, an anonymous discussion platform themed around frogs and ponds. 
              Here, you can create communities (ponds), share content (lilies), and engage in threaded discussions (ribbits) with fellow frogs.
            </p>
            <p className="text-foreground/90">
              Our platform embraces anonymity while fostering meaningful conversations. Every user is a frog in our digital pond, 
              contributing to a vibrant ecosystem of ideas, creativity, and community.
            </p>
            <div className="pt-2">
              <h3 className="font-semibold text-lg mb-2 text-primary">Key Features</h3>
              <ul className="list-disc list-inside space-y-1 text-foreground/90">
                <li>Create and join ponds (communities) around topics you care about</li>
                <li>Post lilies (content) including text, images, and links</li>
                <li>Engage in threaded ribbit discussions with emoji reactions</li>
                <li>Tag ponds to help others discover communities</li>
                <li>Anonymous usernames with frog-themed identities</li>
                <li>Like and dislike reactions to show appreciation or disagreement</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mb-8 p-6 border border-border rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Community Guidelines</h2>
          <div className="space-y-4">
            <p className="text-foreground/90">
              To keep our pond healthy and welcoming, we ask all frogs to follow these guidelines:
            </p>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-primary mb-1">Be Respectful</h3>
                <p className="text-sm text-foreground/80">
                  Treat others with kindness and respect. Disagreements are natural, but personal attacks, harassment, 
                  and hate speech have no place in our pond.
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold text-primary mb-1">Stay On Topic</h3>
                <p className="text-sm text-foreground/80">
                  Keep your lilies and ribbits relevant to the pond you're in. Use tags to help others find content 
                  that matches their interests.
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold text-primary mb-1">No Spam or Self-Promotion</h3>
                <p className="text-sm text-foreground/80">
                  Share content that adds value to the community. Excessive self-promotion, spam, or repetitive posting 
                  disrupts the pond ecosystem.
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold text-primary mb-1">Respect Privacy</h3>
                <p className="text-sm text-foreground/80">
                  Don't share personal information about yourself or others. Our platform is designed for anonymous 
                  discussion—let's keep it that way.
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold text-primary mb-1">Report Issues</h3>
                <p className="text-sm text-foreground/80">
                  If you see content that violates these guidelines, use the reporting features to help maintain 
                  a positive community environment.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border border-border rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Credits</h2>
          <div className="space-y-3">
            <p className="text-foreground/90">
              <span className="font-semibold text-primary">ribbit</span> is built on the Internet Computer, 
              leveraging decentralized technology to create a censorship-resistant platform for open discussion.
            </p>
            <div className="pt-2">
              <h3 className="font-semibold text-primary mb-2">Technology Stack</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-foreground/80">
                <li>Internet Computer Protocol (ICP) for decentralized backend</li>
                <li>React and TypeScript for the frontend</li>
                <li>Motoko for smart contract development</li>
                <li>Tailwind CSS for styling</li>
              </ul>
            </div>
            <Separator className="my-4" />
            <p className="text-sm text-muted-foreground">
              Built with passion by the ribbit community. Special thanks to all the frogs who contribute 
              to making this pond a welcoming place for everyone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
