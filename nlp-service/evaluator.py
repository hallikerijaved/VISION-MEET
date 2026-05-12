import nltk
from sentence_transformers import SentenceTransformer, util
from transformers import pipeline
from keybert import KeyBERT
import language_tool_python
import re

nltk.download('punkt', quiet=True)
nltk.download('punkt_tab', quiet=True)

class NLPEvaluator:
    def __init__(self):
        print("Initializing NLP Models...")
        self.similarity_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.sentiment_model = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
        self.kw_model = KeyBERT()
        self.grammar_tool = language_tool_python.LanguageTool('en-US')
        print("Models Initialized Successfully.")

    def evaluate(self, question: str, ideal_answer: str, user_answer: str):
        if not user_answer.strip():
            return {
                "topicRelevance": 0, "semanticSimilarity": 0,
                "keywordMatching": 0, "sentimentScore": 0,
                "grammarQuality": 0, "communicationQuality": 0,
                "participationAnalysis": 0, "confidenceAnalysis": 0,
                "finalScore": 0, "feedback": "User did not provide an answer.",
                "strengths": [], "weaknesses": ["No answer provided."], "improvements": ["Participate in the discussion."],
                "matchedKeywords": []
            }
        
        # 1. Semantic Similarity & Topic Relevance
        # Calculate similarity by breaking user_answer into chunks to find max relevance
        sentences = re.split(r'[.!?]+|\n+', user_answer)
        if len(sentences) <= 1:
            # Fallback to chunking by words if no punctuation (common in STT)
            words_list = user_answer.split()
            sentences = [' '.join(words_list[i:i+15]) for i in range(0, len(words_list), 15)]
        
        embeddings1 = self.similarity_model.encode(ideal_answer, convert_to_tensor=True)
        
        max_sim = 0.0
        avg_sim = 0.0
        valid_chunks = 0
        
        for chunk in sentences:
            if len(chunk.strip()) > 5:
                chunk_emb = self.similarity_model.encode(chunk.strip(), convert_to_tensor=True)
                sim = util.pytorch_cos_sim(embeddings1, chunk_emb).item()
                max_sim = max(max_sim, sim)
                avg_sim += sim
                valid_chunks += 1
                
        if valid_chunks > 0:
            avg_sim /= valid_chunks
        else:
            # Fallback
            emb2 = self.similarity_model.encode(user_answer, convert_to_tensor=True)
            max_sim = util.pytorch_cos_sim(embeddings1, emb2).item()
            avg_sim = max_sim
            
            
        # Industrial Topic Relevance: penalizes users who say one good thing but ramble off-topic
        # Blend max similarity (peak relevance) with average similarity (sustained relevance)
        blended_sim = (0.6 * max_sim) + (0.4 * avg_sim)
        topic_relevance = max(0.0, min(100.0, blended_sim * 130)) # Scaled for industrial strictness
        semantic_similarity = max(0.0, min(100.0, avg_sim * 140))

        # 2. Sentiment Analysis
        sentiment = self.sentiment_model(user_answer[:512])[0]
        sentiment_score = sentiment['score'] * 100 if sentiment['label'] == 'POSITIVE' else (1 - sentiment['score']) * 100

        # 3. Keyword Extraction & Matching (Subject Matter Expertise)
        # Extract more ideal keywords to create a comprehensive knowledge map
        ideal_keywords = self.kw_model.extract_keywords(ideal_answer, keyphrase_ngram_range=(1, 2), stop_words='english', top_n=12)
        ideal_kw_set = set([kw[0].lower() for kw in ideal_keywords])
        
        user_keywords = self.kw_model.extract_keywords(user_answer, keyphrase_ngram_range=(1, 2), stop_words='english', top_n=12)
        user_kw_set = set([kw[0].lower() for kw in user_keywords])
        
        matched_set = set()
        if ideal_kw_set:
            matched_set.update(ideal_kw_set.intersection(user_kw_set))
            for ukw in user_kw_set:
                if ukw not in matched_set:
                    ukw_emb = self.similarity_model.encode(ukw, convert_to_tensor=True)
                    for ikw in ideal_kw_set:
                        ikw_emb = self.similarity_model.encode(ikw, convert_to_tensor=True)
                        if util.pytorch_cos_sim(ukw_emb, ikw_emb).item() > 0.45:
                            matched_set.add(ukw)
                            break
            keyword_score = (len(matched_set) / max(1, len(ideal_kw_set))) * 100
            keyword_score = min(100.0, keyword_score * 1.5) # Industrial scoring requires broader keyword usage
            matched_list = list(matched_set)
        else:
            keyword_score = 100.0 
            matched_list = []

        # 4. Grammar Checking (STT-aware)
        matches = self.grammar_tool.check(user_answer)
        ignored_rules = {'UPPERCASE_SENTENCE_START', 'PUNCTUATION_PARAGRAPH_END', 'COMMA_PARENTHESIS_WHITESPACE', 'WHITESPACE_RULE', 'EN_QUOTES'}
        serious_matches = [m for m in matches if m.ruleId not in ignored_rules]
        
        words_count = len(re.findall(r'\w+', user_answer))
        if words_count > 0:
            error_ratio = len(serious_matches) / words_count
            grammar_score = max(0.0, 100.0 - (error_ratio * 300)) # Less harsh penalty
        else:
            grammar_score = 0.0

        # 5. Participation Analysis
        # Industrial Standard: 150 words ~ 1 minute solid speaking
        participation = min(100.0, (words_count / 150) * 100)

        # 6. Confidence Analysis (Hesitation & Pauses)
        hesitations = len(re.findall(r'\b(um|uh|like|you know|sort of|kind of|maybe|perhaps|basically|actually)\b', user_answer, re.IGNORECASE))
        # Industrial scale: penalize heavily for hesitation per word ratio
        hesitation_ratio = hesitations / words_count if words_count > 0 else 0
        confidence_score = max(0.0, 100.0 - (hesitation_ratio * 1000))
        if words_count < 20:
            confidence_score = min(confidence_score, 50.0) # Too short to evaluate professional confidence
            
        # 7. Communication Quality
        communication_quality = (0.5 * grammar_score) + (0.5 * confidence_score)

        # Weighted Final Score
        final_score = (0.25 * topic_relevance) + (0.2 * semantic_similarity) + (0.15 * keyword_score) + (0.15 * communication_quality) + (0.15 * participation) + (0.1 * sentiment_score)

        # Feedback generation
        feedback = []
        if topic_relevance < 60:
            feedback.append("Topic Relevance: Try to stay closer to the core subject matter.")
        if confidence_score < 70:
            feedback.append("Confidence: Try to reduce filler words (um, uh, like) to sound more assertive.")
        if participation < 50:
            feedback.append("Participation: Speak more! Elaborate on your points to show deep understanding.")
        if keyword_score < 50:
            feedback.append("Vocabulary: Incorporate more key concepts and professional terms related to the topic.")
        if grammar_score < 70:
            feedback.append("Grammar: Focus on clearer sentence structures to improve readability.")
            
        strengths = []
        weaknesses = []
        improvements = []
        
        if topic_relevance >= 75:
            strengths.append("High topic relevance and clear focus.")
        else:
            weaknesses.append("Tends to deviate from the main topic.")
            improvements.append("Ensure your arguments consistently tie back to the core subject.")
        
        if confidence_score >= 80:
            strengths.append("Spoke confidently with minimal filler words.")
        else:
            weaknesses.append("Frequent use of hesitation markers and filler words.")
            improvements.append("Practice speaking with pauses instead of using filler words.")

        if participation >= 70:
            strengths.append("Excellent level of participation and elaboration.")
        else:
            weaknesses.append("Contributions were too brief.")
            improvements.append("Aim to speak longer and provide more detailed explanations.")

        if keyword_score >= 60:
            strengths.append("Good use of relevant keywords and professional vocabulary.")
        else:
            weaknesses.append("Limited vocabulary related to the topic.")
            improvements.append("Incorporate more specific terminology into your answers.")

        feedback_str = " ".join(feedback) if feedback else "Excellent communication! High relevance, strong participation, and confident delivery."

        return {
            "topicRelevance": round(topic_relevance, 2),
            "semanticSimilarity": round(semantic_similarity, 2),
            "keywordMatching": round(keyword_score, 2),
            "sentimentScore": round(sentiment_score, 2),
            "grammarQuality": round(grammar_score, 2),
            "communicationQuality": round(communication_quality, 2),
            "participationAnalysis": round(participation, 2),
            "confidenceAnalysis": round(confidence_score, 2),
            "finalScore": round(final_score, 2),
            "feedback": feedback_str,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "improvements": improvements,
            "matchedKeywords": matched_list
        }

evaluator_instance = NLPEvaluator()
