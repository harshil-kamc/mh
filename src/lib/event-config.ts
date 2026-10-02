export const eventConfig = {
  name: "The Mystery Vault",
  date: null as string | null,
  registrationUrl: null as string | null,
  contactEmail: null as string | null,
  teamCount: 32,
  durationHours: 24,
  domains: ["AI and Machine Learning", "Cybersecurity"],
  missionPoints: 5000,
  problemStatements: 4,
  socialLinks: { instagram: null, linkedin: null, discord: null, whatsapp: null } as Record<
    string,
    string | null
  >,
};

export interface EventPhase {
  id: number;
  number: string;
  tag: string;
  title: string;
  subtitle: string;
  location: string;
  timeframe: string;
  detail: string;
  steps: string[];
  deliverables: string[];
  tacticalNote: string;
}

export const phases: EventPhase[] = [
  {
    id: 1,
    number: "01",
    tag: "PLANNING & SELECTION",
    title: "Problem Statement Selection & Planning",
    subtitle: "Comprehend, choose target brief & architect the heist",
    location: "Bank Perimeter & Strategy Room",
    timeframe: "Hours 00:00 — 03:00",
    detail:
      "Thirty-two crews assemble at the perimeter. The Professor transmits the classified problem statements. Teams analyze system vulnerabilities, lock in their domain (AI and Machine Learning or Cybersecurity), assemble crew roles, and blueprint their complete technical architecture before writing code.",
    steps: [
      "Problem Statement Lock: Analyze the enterprise problem statements and commit your crew to one target.",
      "Role Distribution: Assign tactical roles across the team (Lead Strategist, ML Specialist, Security Architect, Systems Engineer).",
      "Architecture Blueprint: Map out the system dataflow, technical dependencies, and repository pipeline.",
    ],
    deliverables: [
      "Target statement declaration",
      "Crew clearance verification",
      "Initial architectural blueprint",
    ],
    tacticalNote:
      "A heist without a plan collapses at the first security checkpoint. Blueprint before code.",
  },
  {
    id: 2,
    number: "02",
    tag: "TOKEN VAULT",
    title: "Collect Tokens & Resource Allocation",
    subtitle: "Collect mission tokens to purchase clues during the heist",
    location: "Secure Token Vault & Ledger",
    timeframe: "Hours 03:00 — 05:00",
    detail:
      "Each crew receives their official vault tokens and 5,000 Mission Points (MP). This token stash is your currency to buy clues, intelligence hints, and bypass codes when facing difficult roadblocks during the mission.",
    steps: [
      "Token Stash Collection: Collect your initial allotment of 5,000 Mission Tokens and Points (MP).",
      "Resource Budgeting: Strategically plan how many tokens to save for critical bottlenecks vs bonus evaluation score.",
      "Intelligence Clearance: Initialize your token wallet to prepare for upcoming clue drops.",
    ],
    deliverables: [
      "Token wallet activation",
      "Resource budget allocation",
      "Baseline environment verification",
    ],
    tacticalNote:
      "Tokens are limited. Teams that squander tokens early face dark corridors when surprise challenges strike.",
  },
  {
    id: 3,
    number: "03",
    tag: "THE MISSION",
    title: "The Mission & System Build",
    subtitle: "Continuous build sprint, core hacking & system breach",
    location: "Central Server Floor & Operations Center",
    timeframe: "Hours 05:00 — 16:00",
    detail:
      "The alarms trigger and the core heist mission is fully live! Crews enter the continuous 24-hour build sprint: turning theoretical algorithms into working software, training ML models, building defensive countermeasures, and tackling unexpected challenge injections.",
    steps: [
      "Core Mission Build: Construct end-to-end software pipelines, ML models, and security layers.",
      "Surprise Challenge Injection: Adapt when mid-heist test cases, edge data distributions, and simulated attacks release.",
      "Technical Mentorship: Meet with industry arbiters for architecture stress-testing and pipeline optimization.",
    ],
    deliverables: [
      "Functional mission codebase",
      "Stress-test benchmark logs",
      "Working API and pipeline prototype",
    ],
    tacticalNote:
      "Build modularly. When the system mission changes mid-heist, rigid code breaks under pressure.",
  },
  {
    id: 4,
    number: "04",
    tag: "INSIDER CLUES",
    title: "Clues from the Insider",
    subtitle: "Spend collected tokens to buy insider clues about the mission",
    location: "Steel Reinforced Vault Entrance",
    timeframe: "Hours 16:00 — 21:00",
    detail:
      "When the mission hits critical bottlenecks, the insider within the bank transmits encrypted hints. Crews utilize their collected tokens to bid on and unlock tiered insider clues (Basic, Advanced, and Critical Secrets) to conquer the hardest mission hurdles.",
    steps: [
      "Insider Channel Intercept: Decrypt confidential transmission frequencies from our inside operative.",
      "Tiered Clue Purchases: Use collected tokens to unlock Tier 1, Tier 2, and Tier 3 insider intelligence hints.",
      "Solution Hardening: Leverage insider clues to patch vulnerabilities, optimize latency, and break through bottlenecks.",
    ],
    deliverables: [
      "Clue auction record",
      "Hardened mission patch",
      "Optimized benchmark verification",
    ],
    tacticalNote:
      "Listen closely to the insider. A single well-timed clue can save hours of wasted debugging.",
  },
  {
    id: 5,
    number: "05",
    tag: "HEIST VERDICT",
    title: "Publish Project & Grand Heist Review",
    subtitle: "Publish code, evaluators review the heist & crown the best team",
    location: "Underground Treasury & Grand Jury Chamber",
    timeframe: "Hours 21:00 — 24:00",
    detail:
      "The final extraction initiates! Crews publish their finalized project repository, live deployment, and mission walkthrough. Sit tight while the evaluators (the devs & judges) review the entire heist from start to finish, inspect code quality and token efficiency, and crown the best heist team with the gold bounty.",
    steps: [
      "Publish Project: Freeze code, produce clean documentation, containerize deployment, and submit final repository.",
      "Dev Heist Inspection: Evaluators and judges inspect codebase resilience, architectural depth, and surprise mission handling.",
      "Grand Verdict: Live evaluation pitch and award ceremony crowning the Ultimate Heist Team.",
    ],
    deliverables: [
      "Published production repository",
      "Live deployment URL & walkthrough video",
      "Executive architecture slide deck & final jury defense",
    ],
    tacticalNote:
      "The clock waits for no crew. Publish 15 minutes before deadline to prevent last-minute network extraction failures.",
  },
];

export interface TeamRole {
  number: string;
  name: string;
  badge: string;
  role: string;
  specialty: string;
  description: string;
}

export const teamRoles: TeamRole[] = [
  {
    number: "01",
    name: "Team Leader (The Professor)",
    badge: "MISSION COMMANDER",
    role: "Master Strategist & Team Leader",
    specialty: "High-level architecture, hint bidding strategy, and mission orchestration",
    description:
      "Just like The Professor in Money Heist, every crew needs a master strategist who guides the team, allocates mission points in hint auctions, keeps the timeline synchronized, and directs the final extraction.",
  },
  {
    number: "02",
    name: "AI & Machine Learning Specialist",
    badge: "INTELLIGENCE OPERATIVE",
    role: "Core AI & Data Modeler",
    specialty: "Model fine-tuning, retrieval pipelines, inference latency, and AI evaluation",
    description:
      "Leads algorithmic problem solving, prompt architectures, predictive systems, and neural network pipelines to solve complex domain challenges.",
  },
  {
    number: "03",
    name: "Cybersecurity & Defense Architect",
    badge: "DEFENSE OPERATIVE",
    role: "Security & Countermeasures Lead",
    specialty:
      "Vulnerability analysis, secure key exchange, threat containment, and system hardening",
    description:
      "Defends the crew's codebase against surprise security injections, protects mission tokens, verifies authentication barriers, and hardens the architecture.",
  },
  {
    number: "04",
    name: "Full-Stack & Systems Engineer",
    badge: "INFILTRATION OPERATIVE",
    role: "Infrastructure & Interface Builder",
    specialty: "Full-stack integration, microservices, database schemas, and deployment pipelines",
    description:
      "Constructs the front-facing user experience, endpoints, database persistence, and automated extraction packaging for judge evaluation.",
  },
];

// Backward-compatible alias for existing imports
export const crew = teamRoles;

export const missions = [
  "Ideation",
  "Testing",
  "Feature evolution",
  "Robustness",
  "Documentation",
  "Performance",
  "Surprise",
  "Integration",
  "Final submission",
];
