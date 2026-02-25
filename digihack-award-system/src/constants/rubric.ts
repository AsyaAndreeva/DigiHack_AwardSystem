export type ScoreDefinition = {
  value: number;
  label: string;
};

export type Criterion = {
  id: string;
  title: string;
  maxScore: number;
  scores: ScoreDefinition[];
};

export type Category = {
  id: string;
  title: string;
  maxScore: number;
  criteria: Criterion[];
};

export const RUBRIC: Category[] = [
  {
    id: "cat-1",
    title: "1. Innovation & Applicability",
    maxScore: 10,
    criteria: [
      {
        id: "1.1",
        title: "1.1 Problem Definition",
        maxScore: 3,
        scores: [
          { value: 3, label: "Clear & validated" },
          { value: 2, label: "Real but broad/theoretical" },
          { value: 1, label: "Solution looking for a problem" },
          { value: 0, label: "Missing" },
        ],
      },
      {
        id: "1.2",
        title: "1.2 Innovation & UVP",
        maxScore: 4,
        scores: [
          { value: 4, label: "Completely new/clear UVP" },
          { value: 3, label: "Big improvement/good UVP" },
          { value: 2, label: "Slight innovation/similar to rivals" },
          { value: 1, label: "Basic/no real advantage" },
          { value: 0, label: "Direct copy" },
        ],
      },
      {
        id: "1.3",
        title: "1.3 Feasibility & Impact",
        maxScore: 3,
        scores: [
          { value: 3, label: "High impact/soon" },
          { value: 2, label: "Medium impact/takes time" },
          { value: 1, label: "Low impact/hard" },
          { value: 0, label: "Utopian" },
        ],
      },
    ],
  },
  {
    id: "cat-2",
    title: "2. Design & UI/UX",
    maxScore: 10,
    criteria: [
      {
        id: "2.1",
        title: "2.1 Brand & UI",
        maxScore: 4,
        scores: [
          { value: 4, label: "Pro/consistent" },
          { value: 3, label: "Good/minor flaws" },
          { value: 2, label: "Basic template/messy (2)" },
          { value: 1, label: "Basic template/messy (1)" },
          { value: 0, label: "No design" },
        ],
      },
      {
        id: "2.2",
        title: "2.2 UX",
        maxScore: 4,
        scores: [
          { value: 4, label: "Intuitive/few clicks" },
          { value: 3, label: "Logical/needs minor tweak" },
          { value: 2, label: "Confusing/too many steps (2)" },
          { value: 1, label: "Confusing/too many steps (1)" },
          { value: 0, label: "Unusable" },
        ],
      },
      {
        id: "2.3",
        title: "2.3 Accessibility & Ethics",
        maxScore: 2,
        scores: [
          { value: 2, label: "Excellent contrast/no dark patterns" },
          { value: 1, label: "Minor readability issues" },
          { value: 0, label: "Unreadable/unethical" },
        ],
      },
    ],
  },
  {
    id: "cat-3",
    title: "3. Tech Execution",
    maxScore: 10,
    criteria: [
      {
        id: "3.1",
        title: "3.1 Functionality & MVP",
        maxScore: 4,
        scores: [
          { value: 4, label: "Working MVP/code" },
          { value: 3, label: "Partially works/bugs" },
          { value: 2, label: "Mockups only/doesn't compile (2)" },
          { value: 1, label: "Mockups only/doesn't compile (1)" },
          { value: 0, label: "No tech" },
        ],
      },
      {
        id: "3.2",
        title: "3.2 Scalability & Tech-Business Fit",
        maxScore: 4,
        scores: [
          { value: 4, label: "Excellent architecture/fits business" },
          { value: 3, label: "Good but needs rewrite later" },
          { value: 2, label: "Wrong tech/won't scale (2)" },
          { value: 1, label: "Wrong tech/won't scale (1)" },
          { value: 0, label: "Don't understand their own tech" },
        ],
      },
      {
        id: "3.3",
        title: "3.3 Tech Stack & Code Quality",
        maxScore: 2,
        scores: [
          { value: 2, label: "Good code/meaningful APIs" },
          { value: 1, label: "Basic/useless APIs" },
          { value: 0, label: "Bad code/no tech reason" },
        ],
      },
    ],
  },
  {
    id: "cat-4",
    title: "4. Business Model",
    maxScore: 10,
    criteria: [
      {
        id: "4.1",
        title: "4.1 Market Analysis",
        maxScore: 3,
        scores: [
          { value: 3, label: "Exact audience & data" },
          { value: 2, label: "Theoretical audience/no data" },
          { value: 1, label: "Too broad" },
          { value: 0, label: "No analysis" },
        ],
      },
      {
        id: "4.2",
        title: "4.2 Go-to-Market",
        maxScore: 2,
        scores: [
          { value: 2, label: "Concrete plan/budget" },
          { value: 1, label: "Superficial" },
          { value: 0, label: "No plan" },
        ],
      },
      {
        id: "4.3",
        title: "4.3 Monetization",
        maxScore: 3,
        scores: [
          { value: 3, label: "Sustainable model/realistic" },
          { value: 2, label: "Overly optimistic" },
          { value: 1, label: "Unclear" },
          { value: 0, label: "Don't know how to make money" },
        ],
      },
      {
        id: "4.4",
        title: "4.4 Scalability",
        maxScore: 2,
        scores: [
          { value: 2, label: "Clear vision for new markets" },
          { value: 1, label: "Locally locked" },
          { value: 0, label: "No future vision" },
        ],
      },
    ],
  },
  {
    id: "cat-5",
    title: "5. Presentation & Pitching",
    maxScore: 10,
    criteria: [
      {
        id: "5.1",
        title: "5.1 Storytelling",
        maxScore: 3,
        scores: [
          { value: 3, label: "Captivating story/no jargon" },
          { value: 2, label: "Clear but dry" },
          { value: 1, label: "Confusing/technical" },
          { value: 0, label: "Chaos" },
        ],
      },
      {
        id: "5.2",
        title: "5.2 Structure & Time",
        maxScore: 2,
        scores: [
          { value: 2, label: "Balanced/perfect timing" },
          { value: 1, label: "Missed element/slightly overtime" },
          { value: 0, label: "Way overtime/no structure" },
        ],
      },
      {
        id: "5.3",
        title: "5.3 Team Delivery",
        maxScore: 2,
        scores: [
          { value: 2, label: "Confident/great chemistry" },
          { value: 1, label: "Insecure/low energy" },
          { value: 0, label: "No presentation skills" },
        ],
      },
      {
        id: "5.4",
        title: "5.4 Q&A",
        maxScore: 3,
        scores: [
          { value: 3, label: "Precise/factual/coachable" },
          { value: 2, label: "Good but defensive/vague" },
          { value: 1, label: "General talk/hostile" },
          { value: 0, label: "Cannot answer" },
        ],
      },
    ],
  },
];
