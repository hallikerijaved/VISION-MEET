from fastapi import FastAPI
from pydantic import BaseModel
from evaluator import evaluator_instance

app = FastAPI(title="NLP GD Evaluation Microservice")

class EvaluationRequest(BaseModel):
    question: str
    ideal_answer: str
    user_answer: str

@app.post("/evaluate")
async def evaluate_response(req: EvaluationRequest):
    result = evaluator_instance.evaluate(
        question=req.question,
        ideal_answer=req.ideal_answer,
        user_answer=req.user_answer
    )
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
