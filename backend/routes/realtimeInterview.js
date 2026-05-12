const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');
const auth = require('../middleware/auth');

const VALID_ROLES = ['Java Developer', 'Full Stack', 'HR', 'Custom Role'];
const VALID_DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const OPENING_QUESTIONS = {
  'Java Developer': {
    Easy: "Let's start simple. In your own words, what does the JVM do for a Java application?",
    Medium: 'Walk me through how Java memory management and garbage collection affect application performance.',
    Hard: "Suppose you're designing a highly concurrent Java service. How would you structure it and what tradeoffs would you watch closely?"
  },
  'Full Stack': {
    Easy: 'Let\'s begin with fundamentals. How would you explain a REST API to a junior developer?',
    Medium: 'Talk me through how you manage state in a React application and when you choose one approach over another.',
    Hard: 'If you had to design a scalable full-stack platform, how would you split responsibilities across the frontend, backend, and infrastructure?'
  },
  HR: {
    Easy: "Let's start with you. Tell me about yourself and why this role interests you.",
    Medium: 'Tell me about a difficult situation at work and how you handled the people side of it.',
    Hard: 'Describe a time you had to make a difficult decision with limited information. How did you approach it?'
  },
  'Custom Role': {
    Easy: "Let's start by having you introduce yourself. What makes you a good fit for this custom position?",
    Medium: "Let's start by having you introduce yourself. What makes you a good fit for this custom position?",
    Hard: "Let's start by having you introduce yourself. What makes you a good fit for this custom position?"
  }
};

function normalizeScore(value, fallback = 6) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return fallback;
  }

  return Math.min(10, Math.max(0, Math.round(numeric)));
}

function parseAIResponse(rawText) {
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      feedback: parsed.feedback?.trim(),
      nextQuestion: parsed.nextQuestion?.trim(),
      score: normalizeScore(parsed.score)
    };
  } catch (error) {
    return null;
  }
}

function buildFallbackResponse(questionCount, role) {
  return {
    feedback: 'You covered the basics, but I want a little more specificity in the next answer.',
    nextQuestion: questionCount < 5
      ? `Give me a concrete example that shows your strengths as a ${role}.`
      : 'END',
    score: 6
  };
}

async function getAIInterviewSummary(interview) {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: process.env.INTERVIEW_MODEL || 'gemini-1.5-flash' });
    
    let conversationHistory = '';
    interview.questions.forEach((entry, index) => {
      conversationHistory += `Q${index + 1}: ${entry.question}\nA${index + 1}: ${entry.userAnswer}\nScore: ${entry.score}/10\n\n`;
    });

    const prompt = `You are a Senior Technical Recruiter at a top-tier FAANG company. 
You have just concluded an interview for a ${interview.difficulty} ${interview.role} position.
Here is the complete interview transcript:

${conversationHistory}

Based on this transcript, generate a strict JSON object containing a comprehensive, industry-standard interview assessment.
The JSON must have the following keys:
- "strengths": Array of 3 specific, detailed technical or behavioral strengths demonstrated by the candidate based on their exact words.
- "weaknesses": Array of 3 specific, detailed areas of improvement, missing knowledge, or structural flaws in their answers.
- "improvements": Array of 3 highly actionable, professional tips for their next interview.

Return ONLY valid JSON without markdown formatting.`;

    const result = await model.generateContent(prompt);
    let rawResponse = result.response.text().trim();
    if (rawResponse.startsWith('```json')) {
        rawResponse = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    return JSON.parse(rawResponse);
  } catch (error) {
    console.error("AI Summary generation failed", error);
    return {
      strengths: ["Completed the interview successfully", "Communicated ideas clearly"],
      weaknesses: ["Could provide more technical depth", "Needs more concrete examples"],
      improvements: ["Use the STAR method for behavioral questions", "Review advanced technical concepts"]
    };
  }
}

async function getAIResponse(conversationHistory, role, difficulty, questionCount, currentQuestion, userAnswer, jobDescription) {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: process.env.INTERVIEW_MODEL || 'gemini-1.5-flash'
    });

    const prompt = `You are an elite Senior Technical Interviewer at a top-tier tech company. You are interviewing a candidate for a ${difficulty} ${role} role in a live voice call.
${jobDescription ? `The specific job requirements are: ${jobDescription}\n` : ''}
This is question ${questionCount} out of 5.

Interview Guidelines:
- Sound professional, encouraging, yet rigorous.
- Give extremely brief human-like feedback on the previous answer (e.g., "Good point on X, but...", or "That makes sense. Moving on...").
- Ask exactly one highly targeted, industry-standard follow-up question. 
- For 'Hard' difficulty, ask deep architectural, system design, or complex scenario-based questions.
- If a custom job description is provided, heavily target those specific skills.
- Score the answer strictly from 0 to 10 based on technical accuracy, problem-solving depth, and clarity.
- If this is question 5, set nextQuestion to "END".

Current question:
${currentQuestion}

Candidate answer:
${userAnswer}

Conversation so far:
${conversationHistory}

Respond in strict JSON:
{
  "feedback": "<brief human feedback>",
  "nextQuestion": "<natural follow-up question or END>",
  "score": <0-10>
}`;

    const result = await model.generateContent(prompt);
    const parsed = parseAIResponse(result.response.text());

    if (parsed?.feedback && parsed?.nextQuestion) {
      return parsed;
    }

    return buildFallbackResponse(questionCount, role);
  } catch (error) {
    return buildFallbackResponse(questionCount, role);
  }
}

router.post('/start', auth, async (req, res) => {
  try {
    const { role, difficulty, jobDescription } = req.body;

    if (!VALID_ROLES.includes(role) || !VALID_DIFFICULTIES.includes(difficulty)) {
      return res.status(400).json({ error: 'Invalid interview configuration' });
    }

    const firstQuestion = OPENING_QUESTIONS[role][difficulty];
    const interview = new Interview({
      userId: req.user.id,
      role,
      difficulty,
      jobDescription: jobDescription || '',
      currentQuestion: firstQuestion,
      questions: [],
      interviewType: 'realtime'
    });

    await interview.save();

    const firstName = req.user.name?.split(' ')[0] || 'there';
    const greeting = `Hi ${firstName}, I'm your interviewer today. We'll keep this conversational and focused, and I'll adapt based on your answers.`;

    res.json({
      sessionId: interview._id,
      greeting,
      firstQuestion
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/respond', auth, async (req, res) => {
  try {
    const { sessionId, userAnswer } = req.body;
    const interview = await Interview.findById(sessionId);

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    if (interview.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You cannot access this interview session' });
    }

    if (!userAnswer || !userAnswer.trim()) {
      return res.status(400).json({ error: 'Answer is required' });
    }

    const questionCount = interview.questions.length + 1;
    const currentQuestion = interview.currentQuestion || `Question ${questionCount}`;

    let conversationHistory = '';
    interview.questions.forEach((entry, index) => {
      conversationHistory += `\nQ${index + 1}: ${entry.question}\nA${index + 1}: ${entry.userAnswer}\nFeedback: ${entry.feedback}\n`;
    });
    conversationHistory += `\nQ${questionCount}: ${currentQuestion}\nA${questionCount}: ${userAnswer.trim()}`;

    const aiResponse = await getAIResponse(
      conversationHistory,
      interview.role,
      interview.difficulty,
      questionCount,
      currentQuestion,
      userAnswer.trim(),
      interview.jobDescription
    );

    interview.questions.push({
      question: currentQuestion,
      userAnswer: userAnswer.trim(),
      score: normalizeScore(aiResponse.score),
      feedback: aiResponse.feedback
    });

    if (questionCount >= 5 || aiResponse.nextQuestion === 'END') {
      const scores = interview.questions.map((entry) => entry.score);
      interview.overallScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

      const summary = await getAIInterviewSummary(interview);
      interview.strengths = summary.strengths || ["Communicated clearly"];
      interview.weaknesses = summary.weaknesses || ["Needs more examples"];
      interview.improvements = summary.improvements || ["Practice technical depth"];
      interview.currentQuestion = null;
      interview.status = 'completed';
      await interview.save();

      return res.json({
        completed: true,
        feedback: aiResponse.feedback,
        closingMessage: "Thanks. That wraps up the interview. I'll hand over your summary now.",
        results: interview
      });
    }

    interview.currentQuestion = aiResponse.nextQuestion;
    await interview.save();

    return res.json({
      completed: false,
      feedback: aiResponse.feedback,
      nextQuestion: aiResponse.nextQuestion,
      score: normalizeScore(aiResponse.score)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/results/:id', auth, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    if (interview.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You cannot access this interview session' });
    }

    res.json(interview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/end', auth, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    if (interview.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You cannot access this interview session' });
    }

    if (interview.status !== 'completed') {
      interview.status = 'ended';
      interview.currentQuestion = null;
      await interview.save();
    }

    return res.json({ success: true, interview });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
