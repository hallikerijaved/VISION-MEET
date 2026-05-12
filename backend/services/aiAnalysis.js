const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIAnalysisService {
  async analyzeCommunication(text, participantName, gdTitle = "Group Discussion", idealAnswer = "") {
    try {
      let finalIdealAnswer = idealAnswer;
      
      if (!finalIdealAnswer || finalIdealAnswer === gdTitle) {
        try {
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: process.env.INTERVIEW_MODEL || "gemini-flash-latest" });
          
          const prompt = `Write a comprehensive, highly detailed ideal response for a Group Discussion on the topic: "${gdTitle}". The response should be 1-2 paragraphs long and include all the major keywords, professional terminology, and core arguments that a top-tier candidate would mention.`;
          
          const result = await model.generateContent(prompt);
          finalIdealAnswer = result.response.text();
          console.log(`Generated Ideal Answer for ${gdTitle}`);
        } catch (geminiError) {
          console.error('Gemini Ideal Answer Generation Error:', geminiError.message);
          finalIdealAnswer = gdTitle;
        }
      }

      // Step 2: Get quantitative scores from Python NLP microservice
      const response = await axios.post('http://localhost:8000/evaluate', {
        question: gdTitle,
        ideal_answer: finalIdealAnswer,
        user_answer: text
      });
      
      let nlpData = response.data;

      // Step 3: Get highly accurate, personalized qualitative feedback from Gemini
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: process.env.INTERVIEW_MODEL || "gemini-flash-latest" });
        
        const feedbackPrompt = `You are an expert HR recruiter evaluating a candidate named ${participantName} in a Group Discussion on the topic: "${gdTitle}".
Here is the exact transcript of what the candidate said:
"${text}"

Provide a highly personalized evaluation formatted strictly as a JSON object with the following keys:
- "feedback": A 2-sentence overall summary of their performance.
- "strengths": An array of 2-3 specific things they did well based on their exact words.
- "weaknesses": An array of 2-3 specific areas they fell short on.
- "improvements": An array of 2-3 actionable tips for their next interview.

Return ONLY valid JSON without markdown formatting.`;
        
        const feedbackResult = await model.generateContent(feedbackPrompt);
        let rawFeedback = feedbackResult.response.text().trim();
        if (rawFeedback.startsWith('```json')) {
            rawFeedback = rawFeedback.replace(/```json/g, '').replace(/```/g, '').trim();
        }
        const personalizedFeedback = JSON.parse(rawFeedback);
        
        nlpData.feedback = personalizedFeedback.feedback || nlpData.feedback;
        nlpData.strengths = personalizedFeedback.strengths || nlpData.strengths;
        nlpData.weaknesses = personalizedFeedback.weaknesses || nlpData.weaknesses;
        nlpData.improvements = personalizedFeedback.improvements || nlpData.improvements;
      } catch (e) {
        console.error("Gemini Personalized Feedback Error:", e.message);
      }

      return nlpData;
    } catch (error) {
      console.error('NLP Service Error:', error.message);
        return {
          topicRelevance: 0,
          semanticSimilarity: 0,
          keywordMatching: 0,
          sentimentScore: 0,
          grammarQuality: 0,
          communicationQuality: 0,
          participationAnalysis: 0,
          confidenceAnalysis: 0,
          finalScore: 0,
          feedback: "Evaluation service unavailable. Please try again later.",
          strengths: [],
          weaknesses: ["Service unavailable"],
          improvements: ["Try again later"]
        };
    }
  }
}

module.exports = new AIAnalysisService();
