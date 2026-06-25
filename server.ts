import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Lazy-loaded Gemini AI client to ensure server doesn't crash on boot if key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (aiClient) return aiClient;
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY environment variable is not defined. Using mock fallback mode.");
    // We will throw an error or handle it dynamically in the API call
  }
  
  aiClient = new GoogleGenAI({
    apiKey: apiKey || "MOCK_KEY",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  
  return aiClient;
}

const app = express();
app.use(express.json());

const PORT = 3000;

// API Endpoints
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: process.env.NODE_ENV || "development" });
});

// AI analysis of study/coding/productivity blocker
function getMockResponse(problemDescription: string, coachMode: string) {
  // Determine dummy category
  let category: 'coding' | 'study' | 'deadline' | 'confusion' | 'blocker' = "blocker";
  const descLower = problemDescription.toLowerCase();
  if (descLower.includes("code") || descLower.includes("bug") || descLower.includes("git") || descLower.includes("error") || descLower.includes("compile") || descLower.includes("docker")) {
    category = "coding";
  } else if (descLower.includes("study") || descLower.includes("exam") || descLower.includes("learn") || descLower.includes("math") || descLower.includes("lecture") || descLower.includes("read")) {
    category = "study";
  } else if (descLower.includes("deadline") || descLower.includes("due") || descLower.includes("time") || descLower.includes("date") || descLower.includes("hour")) {
    category = "deadline";
  } else if (descLower.includes("confuse") || descLower.includes("what") || descLower.includes("lost") || descLower.includes("start") || descLower.includes("how")) {
    category = "confusion";
  }

  // Determine time-of-day for the timelineSegment
  let preferredSegment: 'morning' | 'afternoon' | 'night' | 'anytime' = "anytime";
  const hour = new Date().getHours();
  if (hour < 12) preferredSegment = "morning";
  else if (hour < 17) preferredSegment = "afternoon";
  else preferredSegment = "night";

  // Tailor response tone to coachMode
  let coachResponseText = "";
  let solutionTitleText = "";
  let taskTitleText = "";
  let taskDescText = "";
  let subtasksList: string[] = [];
  let planAText = "";
  let planBText = "";
  let planCText = "";

  if (coachMode === "friend") {
    if (category === "coding") {
      coachResponseText = `Hey buddy, deep breath! Code bugs are super frustrating, but we'll get this sorted out together, pal. Let's isolate this glitch step-by-step so you don't feel overwhelmed.`;
      solutionTitleText = "The Cozy Bug-Buster Session";
      taskTitleText = "Let's Check Your Code Variables";
      taskDescText = "A gentle walk-through of your parameters to find where they get confused.";
      subtasksList = ["Add console.log to print variables", "Match actual values against your expected ones", "Celebrate finding the first deviation!"];
      planAText = "Let's work together for 15 minutes, print out some variable states, and solve it together.";
      planBText = "If you're feeling tired, let's just make one mock file and write comments describing what we want.";
      planCText = "Take a break, drink some tea, and we can just return a hardcoded placeholder for now.";
    } else if (category === "study") {
      coachResponseText = `I know studying feels like a massive mountain right now, buddy. Let's do it in a very relaxed way together. Just small micro-steps, no pressure at all!`;
      solutionTitleText = "The Friendly Study Tea Break";
      taskTitleText = "Review Math Core Concepts Gently";
      taskDescText = "Breaking down lecture slide concepts into friendly terms.";
      subtasksList = ["Read just one slide out loud", "Write down what you remember in a notebook", "Ask me if you need help with any specific jargon"];
      planAText = "Read the key concept and summarize it to me as if I'm your non-tech neighbor.";
      planBText = "Just scan the bold headers on slide summary sheets and call it a win.";
      planCText = "Simply open the document, read exactly 3 sentences, and allow yourself to relax.";
    } else {
      coachResponseText = `Hey my friend, I hear you. The stress is real, but you're not in this alone. Let's turn down the speed, focus on just one tiny task, and build momentum at your own comfort level.`;
      solutionTitleText = "The Supportive Step-by-Step Reset";
      taskTitleText = "Tackle the Absolute Easiest Chore";
      taskDescText = "Getting a tiny quick-win to make you feel good and confident.";
      subtasksList = ["Clear one physical item off your desk", "Write down your immediate starting thought in 5 words", "Take a big relaxing breath"];
      planAText = "Set a very cozy 10-minute timer and just focus on making one small draft sentence.";
      planBText = "Let's write down a checklist of 3 tiny actions we can do tomorrow.";
      planCText = "Just close the workspace, stretch, and write down exactly one line to keep progress alive.";
    }
  } else if (coachMode === "pro") {
    if (category === "coding") {
      coachResponseText = `System analysis initiated. Let's isolate the structural variable causing this compilation failure. We will follow a rigorous debugging protocol to restore normal development velocity.`;
      solutionTitleText = "Structured Logic Isolation Protocol";
      taskTitleText = "Isolate Core Execution Vectors";
      taskDescText = "Conducting a formal variable validation sprint to determine state corruption.";
      subtasksList = ["Log parameters at the system entry point", "Validate schema structural integrity", "Run isolated integration tests"];
      planAText = "Perform a systematic trace using breakpoints and step-by-step variable watchlists.";
      planBText = "Fallback to compiling only the problem module in an isolated unit-test sandbox.";
      planCText = "Implement a fail-safe mocking block to secure compilation before proceeding with deep refactoring.";
    } else if (category === "study") {
      coachResponseText = `Productivity review active. Passive information ingestion has low conversion rates. We will implement high-efficiency active recall methods to optimize concept retention.`;
      solutionTitleText = "Executive Concept Mastery Sprint";
      taskTitleText = "Execute Active Recall Matrix";
      taskDescText = "Formulating precise challenge criteria to measure recall accuracy.";
      subtasksList = ["Isolate 3 core lecture milestones", "Draft 3 objective self-assessment inquiries", "Execute a blind recall validation session"];
      planAText = "Establish 3 rapid recall repetitions and document precision gaps.";
      planBText = "Review exclusively executive summaries and key graphs to extract 80% actionable value.";
      planCText = "Synthesize a 1-page cheatsheet of core formulas to establish a reference baseline.";
    } else {
      coachResponseText = `Priority warning received. Deadline pressure indicates a need for strategic scoping. We will deprioritize non-essential deliverables to secure the critical path.`;
      solutionTitleText = "Critical Path Scoping Protocol";
      taskTitleText = "Execute Deliverable Pruning";
      taskDescText = "Identifying secondary elements that can be deferred to optimize delivery timeline.";
      subtasksList = ["Isolate core functional criteria", "De-prioritize formatting and style tasks", "Synthesize a working skeleton draft"];
      planAText = "Maintain an uninterrupted 30-minute block focusing strictly on the critical path.";
      planBText = "Halftime efficiency: deploy a pre-configured template to bypass setup bottlenecks.";
      planCText = "Submit the current functional skeleton to secure a minimum viable submission.";
    }
  } else {
    // DEFAULT: CHAMP (Athletic Coach & DJ)
    if (category === "coding") {
      coachResponseText = `Alright, Champ! Let's get this track back on beat. Staring at code won't fix the compilation; let's dial up the tempo and isolate this glitch with a fresh mix!`;
      solutionTitleText = "The Isolated Rubber-Duck Sprint";
      taskTitleText = "Trace Code Execution Beat";
      taskDescText = "Log values to confirm correct variables pass through your inputs.";
      subtasksList = ["Write 3 simple logs in the suspect function", "Create static mock inputs for verification", "Observe console output for state shifts"];
      planAText = "Step-by-step debugger tracing with console logs to locate the single deviating expression.";
      planBText = "Create a fresh, isolated scratchpad script file and copy-paste only the problematic function to compile separately.";
      planCText = "Comment out or mock the buggy logic entirely and submit a working stub to keep velocity up.";
    } else if (category === "study") {
      coachResponseText = `Yo! Reading dry slides repetitively is a slow rhythm, Champ. Let's switch to an active remix. Active recall is where we drop the bass and test your memory!`;
      solutionTitleText = "Active Feynman Remaster";
      taskTitleText = "Draft Active Recall Beats";
      taskDescText = "Transform dry lecture bullet points into 3 custom self-test questions.";
      subtasksList = ["Write 3 specific memory challenge cards", "Execute a 5-minute self-test on concepts", "Highlight and note your memory gaps"];
      planAText = "Perform 3 structured active recall cycles with flashcards.";
      planBText = "Skim only the chapter introduction, highlighted boxes, and final summary to grasp 80% of concepts.";
      planCText = "Focus exclusively on solving the official review questions at the back of the chapter.";
    } else {
      coachResponseText = `We are at 140 BPM, Champ! Under high pressure, perfection is your enemy. We need a fast, high-tempo skeleton draft right now. Let's drop the bass and make progress!`;
      solutionTitleText = "The Ironclad Minimum Viable Beat";
      taskTitleText = "Hammer Out Skeleton Blueprint";
      taskDescText = "Create the foundational outline or rough layout to keep timing.";
      subtasksList = ["Initialize the core draft document", "Write out the 3 main section headers", "Fill in simple bullet points for each header"];
      planAText = "Focus solely on making a highly focused, distraction-free 15-minute start.";
      planBText = "Commit to completing only the absolute easiest subtask to trigger a momentum cascade.";
      planCText = "Take a strict, offline 15-minute walk to reset, then resume with a micro-step.";
    }
  }

  return {
    category,
    rootCause: `Detected: ${problemDescription.slice(0, 45)}... causing tempo lag and focus blockers.`,
    aiCoachResponse: coachResponseText,
    solutionTitle: solutionTitleText,
    solutionSteps: subtasksList,
    suggestedTasks: [
      {
        title: taskTitleText,
        description: taskDescText,
        timelineSegment: preferredSegment,
        subtasks: subtasksList
      }
    ],
    tempoBpm: category === "deadline" ? 120 : (category === "study" ? 80 : 95),
    riskOfFailure: category === "deadline" ? "critical" : "medium",
    failurePredictionMessage: `High risk of losing momentum due to unstructured workflow or fatigue. Personal coach recommendations applied.`,
    planA: planAText || `Execute Plan A: focus 100% on the core deliverables for 20 minutes.`,
    planB: planBText || `Execute Plan B: scale back to 10-minute sprint intervals with stretch breaks.`,
    planC: planCText || `Execute Plan C: write exactly one sentence or line of code to prevent a zero day.`
  };
}

async function generateContentWithFallback(
  ai: any,
  params: {
    model: string;
    contents: any;
    config?: any;
  },
  fallbacks: string[] = ["gemini-flash-latest", "gemini-3.1-flash-lite", "gemini-3.1-pro-preview"]
) {
  let lastError: any = null;
  const modelsToTry = [params.model, ...fallbacks];

  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Beat Up API] Attempting Gemini call with model: ${modelName} (attempt ${attempt}/2)`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: params.contents,
          config: params.config,
        });
        console.log(`[Beat Up API] Successfully received response from model: ${modelName}`);
        return response;
      } catch (error: any) {
        lastError = error;
        console.warn(`[Beat Up API] Call failed for model ${modelName} on attempt ${attempt}:`, error.message || error);
        
        // Wait a bit before retrying the same model (backoff for transient 503 high demand)
        if (attempt < 2) {
          const delay = 1000 * attempt;
          console.log(`[Beat Up API] Waiting ${delay}ms before retrying ${modelName}...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  }
  throw lastError;
}

app.post("/api/analyze-blocker", async (req, res) => {
  const { problemDescription, currentTasks = [], history = [], coachMode = "champ" } = req.body;

  try {
    if (!problemDescription || typeof problemDescription !== "string") {
      res.status(400).json({ error: "Please enter a valid description of what is holding you back." });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    // Check if API key is not set, use mock directly
    if (!apiKey) {
      console.log(`No API key set. Sending simulated blocker analysis customized for coachMode: "${coachMode}"`);
      const mockRes = getMockResponse(problemDescription, coachMode);
      res.json(mockRes);
      return;
    }

    // Call real Gemini API
    const ai = getGeminiClient();

    let systemPersona = "";
    if (coachMode === "friend") {
      systemPersona = `You are "Buddy", the user's caring, close personal friend and coach.
Speak in an incredibly warm, informal, empathetic, and highly encouraging tone.
Use conversational, comforting words like "buddy", "pal", "hey", "don't stress", "we got this".
Make the user feel deeply supported and validated, saying things like "Let's tackle this together, step by step".
Acknowledge their fatigue or anxiety first, and offer comforting, approachable advice.`;
    } else if (coachMode === "pro") {
      systemPersona = `You are "Executive Advisor Pro", an elite professional productivity assistant and analytical coach.
Speak in a crisp, clear, objective, analytical, highly structured and professional corporate tone.
Use industry-standard terms like "milestones", "deliverables", "mitigation vectors", "critical path analysis", and "priority itemization".
Focus purely on maximum efficiency, performance optimization, and objective risk mitigation. All advice should be clear, action-oriented, and structured.`;
    } else {
      systemPersona = `You are "Champ", an elite, friendly, punchy, and highly encouraging AI Coach, DJ, and trainer.
All tasks are referred to as "Beats" or "Drills", and you must structure productivity around the user's tempo (BPM).
Your mission is to help students, developers, and learners "beat up" their blockers using high-energy coaching, athletic pacing, and boxing metaphors.
Use terms like "Champ", "Drills", "Beats", "Drops", "BPM", "In your corner".`;
    }

    const systemInstruction = `${systemPersona}
Your application is called "Beat Up". All tasks are referred to as "Beats" or "Drills", and you must structure productivity around the user's tempo (BPM).
Your mission is to help students, developers, and learners "beat up" their blockers (coding problems, study problems, deadlines, confusion, general friction/blockers).
Use professional coaching tactics, active recall strategies, rubber-ducking, MVP (minimum viable product) thinking, and high-energy encouragement.
NEVER give boring generic lists like "sleep well" or "stay hydrated". Give hyper-focused, creative, tactical steps designed specifically for their scenario.

CRITICAL DIRECTIVES ON TASK PERSONALIZATION AND GRANULAR DIVISION:
1. You MUST personalize the suggested tasks ("suggestedTasks") to the user's specific problem description. No generic placeholders. If they talk about Docker, mention Docker commands. If they talk about React, mention component state or logs.
2. You MUST split the tasks into highly specific, separate subtasks.
3. Each subtask line in the "subtasks" array MUST represent exactly ONE single concrete action. Do NOT combine multiple different actions or thoughts on one line (e.g. "Create index.html and link the css file" should be separate lines: "Initialize index.html file", and "Add stylesheet link tag inside index.html").
4. Make sure that the steps are highly sequential, easy to follow, and directly target the user's described blocker.
5. CRITICAL NARRATION SPLIT DIRECTIVE: If the user narrates, mentions, or plans multiple separate activities or tasks in their text description (e.g., 'going for a walk at 7, then study at 9', or 'going for a jog, study physics, fix bugs'), you MUST return a SEPARATE task object in the "suggestedTasks" array for EACH separate narrated activity. Do NOT combine them into a single task! For example, if they narrate 'walk at 7, then study at 9', you MUST produce exactly two separate suggestedTasks: one for the walk, and one for the study session. Keep each title literal, e.g. "Go for a walk at 7" and "Study physics at 9".

You must categorize their blocker into exactly one of these five classes:
- "coding": programming, compilation errors, bugs, syntax, tech setup, version control.
- "study": learning concepts, understanding math/science/literature, memorization, reading exhaustion.
- "deadline": close due dates, time crunch, urgency, pressure.
- "confusion": not knowing where to start, vague assignments, feeling lost, lack of specs.
- "blocker": general fatigue, mental walls, high starting resistance, fear of failure, procrastination.

Return a highly structured JSON response strictly matching the schema provided.
Assess the risk of deadline/plan failure dynamically ('low', 'medium', or 'critical') based on their description, and formulate Plans A, B, and C so they never crash!`;

    const userPrompt = `Analyze this user blocker and generate a custom Beat-Up Mission.
Blocker Description: "${problemDescription}"
Current items in task list (to avoid duplicates): ${JSON.stringify(currentTasks)}
Recent conversation history for context: ${JSON.stringify(history)}
Current Time context: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}

Categorize this into a specific timelineSegment ('morning', 'afternoon', 'night', or 'anytime') depending on their narrated context or the current local time.
Provide the estimated tempo needed (60 to 140 BPM), a clear failure risk prediction, and:
- Plan A (Perfect Track / Ideal execution path)
- Plan B (Halftime Remix / If time shrinks or they get distracted)
- Plan C (The Hard Bass Drop / Absolute minimal survival plan to avoid failure)
Also suggest custom Tasks ("Beats") with timeline segments and specific separate granular subtasks. Make them incredibly personalized. Remember: If I mentioned multiple activities/tasks (e.g. "going for a walk at 7, then study at 9"), you MUST separate them and output a distinct task object for each activity!`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: [
            "category", "rootCause", "aiCoachResponse", "solutionTitle", "solutionSteps", "suggestedTasks",
            "tempoBpm", "riskOfFailure", "failurePredictionMessage", "planA", "planB", "planC"
          ],
          properties: {
            category: {
              type: Type.STRING,
              description: "Must be one of: 'coding', 'study', 'deadline', 'confusion', 'blocker'"
            },
            rootCause: {
              type: Type.STRING,
              description: "A short, sharp 1-sentence detection of the hidden root cause of their struggle (e.g., 'Information overload', 'Undefined starting line', 'Anxiety freeze')."
            },
            aiCoachResponse: {
              type: Type.STRING,
              description: "The AI coach response customized to your designated persona tone (2-3 sentences max) addressing them, diagnosing their blocker, and setting the tone."
            },
            solutionTitle: {
              type: Type.STRING,
              description: "A custom, epic, action-oriented title for the solution strategy."
            },
            solutionSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exactly 3 ultra-tactical, immediate steps they can perform right now to break the deadlock."
            },
            suggestedTasks: {
              type: Type.ARRAY,
              description: "Array of custom actionable tasks to conquer this blocker. If the user narrated multiple activities, generate a separate task object for each activity (e.g. Walk at 7, Study at 9). Make them highly personalized and broken down.",
              items: {
                type: Type.OBJECT,
                required: ["title", "description", "timelineSegment", "subtasks"],
                properties: {
                  title: {
                    type: Type.STRING,
                    description: "Short, punchy task title (e.g., 'Trace Docker Port binding' or 'Go for a walk at 7')"
                  },
                  description: {
                    type: Type.STRING,
                    description: "Short, engaging description explaining why this task defeats the blocker."
                  },
                  timelineSegment: {
                    type: Type.STRING,
                    description: "Must be one of: 'morning', 'afternoon', 'night', 'anytime'"
                  },
                  subtasks: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Exactly 2 to 4 separate subtasks. Each line must be exactly ONE single concrete action."
                  }
                }
              }
            },
            tempoBpm: {
              type: Type.INTEGER,
              description: "Tempo required for the work from 60 (very calm/chill) to 140 (extremely high tempo emergency crunch)"
            },
            riskOfFailure: {
              type: Type.STRING,
              description: "Must be one of: 'low', 'medium', 'critical'"
            },
            failurePredictionMessage: {
              type: Type.STRING,
              description: "Why and how they are currently on a trajectory to fail their goal/deadline unless they pivot."
            },
            planA: {
              type: Type.STRING,
              description: "The ideal, high-standard execution plan (Perfect Track)."
            },
            planB: {
              type: Type.STRING,
              description: "The partial fallback plan if they feel tired, get interrupted, or lose 50% of their focus time (The Halftime Remix)."
            },
            planC: {
              type: Type.STRING,
              description: "The absolute minimum viable outcome to secure partial credit, pass, or hit the raw submission criteria before the buzzer (The Bass Drop)."
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from Gemini model");
    }

    const parsedResult = JSON.parse(resultText.trim());
    res.json(parsedResult);
  } catch (error: any) {
    console.warn("Failsafe warning: Gemini call encountered error, activating robust fallback:", error);
    // Bulletproof response fallback
    const fallbackResponse = getMockResponse(problemDescription || "Solve this focus block", coachMode);
    res.json(fallbackResponse);
  }
});

// Serve Vite build in production, otherwise mount dev server middlewares
async function startServer() {
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Beat Up Experience] Full-stack server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
