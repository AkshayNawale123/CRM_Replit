import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Glossary() {
  const primaryStages = [
    {
      stage: "Lead",
      description: "A potential customer who has shown initial interest but hasn't been qualified yet. This is the first touchpoint where basic information has been captured.",
      badge: "lead"
    },
    {
      stage: "Qualified",
      description: "The lead has been vetted and meets your ideal customer profile (ICP) with confirmed budget, authority, need, and timeline (BANT criteria).",
      badge: "qualified"
    },
    {
      stage: "Meeting Scheduled",
      description: "Initial discovery or demo meeting has been set up to understand the prospect's needs and present your solution.",
      badge: "meeting"
    },
    {
      stage: "Proposal Sent",
      description: "A formal proposal or quote has been delivered to the prospect outlining the solution, pricing, and terms.",
      badge: "proposal"
    },
    {
      stage: "In Negotiation",
      description: "Active discussions are happening around pricing, terms, contract details, or customizations to close the deal.",
      badge: "negotiation"
    },
    {
      stage: "Verbal Commitment",
      description: "The prospect has verbally agreed to move forward but formal contracts haven't been signed yet.",
      badge: "verbal"
    },
    {
      stage: "Won",
      description: "The deal is closed successfully with signed contracts and payment terms agreed upon. The client is now active.",
      badge: "won"
    },
    {
      stage: "Lost",
      description: "The deal didn't close - the prospect chose a competitor, had budget issues, or decided not to proceed.",
      badge: "lost"
    },
    {
      stage: "On Hold",
      description: "The opportunity is temporarily paused due to timing, budget cycles, or internal changes at the prospect's company.",
      badge: "hold"
    }
  ];

  const additionalStages = [
    {
      stage: "Demo Completed",
      description: "The product demonstration has been successfully delivered and the prospect is evaluating the solution."
    },
    {
      stage: "Proof of Concept (POC)",
      description: "A trial or pilot project is underway to validate the solution before full commitment."
    },
    {
      stage: "Contract Review",
      description: "Legal teams are reviewing and finalizing contract terms before signing."
    },
    {
      stage: "Closed-Lost (Nurture)",
      description: "The deal didn't close now, but the prospect remains in the pipeline for future opportunities."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground" data-testid="heading-glossary">
            CRM Glossary
          </h1>
          <p className="text-muted-foreground">
            Standard sales pipeline stages and definitions to help you manage client relationships effectively
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Sales Pipeline Stages</CardTitle>
            <CardDescription>
              The primary stages that guide a prospect through your sales process from initial contact to close
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {primaryStages.map((item, index) => (
              <div 
                key={item.badge} 
                className="flex gap-4 pb-4 border-b border-border last:border-b-0 last:pb-0"
                data-testid={`stage-${item.badge}`}
              >
                <div className="flex-shrink-0 w-8 text-center">
                  <Badge variant="outline" className="rounded-full h-8 w-8 flex items-center justify-center">
                    {index + 1}
                  </Badge>
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold text-foreground">{item.stage}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Alternative & Additional Stages</CardTitle>
            <CardDescription>
              Optional stages that can be used depending on your business model and sales process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {additionalStages.map((item, index) => (
              <div 
                key={index} 
                className="flex gap-4 pb-4 border-b border-border last:border-b-0 last:pb-0"
                data-testid={`additional-stage-${index}`}
              >
                <div className="flex-shrink-0 w-8 text-center">
                  <Badge variant="secondary" className="rounded-full h-8 w-8 flex items-center justify-center">
                    {index + 10}
                  </Badge>
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold text-foreground">{item.stage}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">Key Sales Qualification Framework</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">BANT Criteria</span> - Use this framework to qualify leads:
              </p>
              <ul className="space-y-1.5 ml-4 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground min-w-20">Budget:</span>
                  <span>Does the prospect have allocated funds?</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground min-w-20">Authority:</span>
                  <span>Are you speaking with decision-makers?</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground min-w-20">Need:</span>
                  <span>Does your solution address a real pain point?</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground min-w-20">Timeline:</span>
                  <span>When do they plan to make a decision?</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
