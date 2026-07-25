import json
from typing import Literal
from pydantic import BaseModel, Field
from sqlalchemy import select
from db.session import AsyncSessionLocal
from db.models import SupportTicket
from app.config import settings
from agent.state import WorkflowState

class SentimentAnalysisOutput(BaseModel):
    root_cause: Literal[
        "UNRESOLVED_CRITICAL_BUG",
        "ONBOARDING_FRICTION",
        "PRODUCT_GAP",
        "PRICE_SENSITIVITY",
        "UNKNOWN"
    ] = Field(description="Exact root cause classification")
    reasoning_summary: str = Field(description="2-3 sentence executive summary explaining the cause and risk level")
    urgency_score: int = Field(ge=1, le=10, description="Urgency score from 1 (low) to 10 (critical)")

async def get_llm():
    """Factory to get configured LLM client (Groq or Ollama fallback)."""
    if settings.LLM_PROVIDER == "groq" and settings.GROQ_API_KEY:
        from langchain_groq import ChatGroq
        return ChatGroq(
            groq_api_key=settings.GROQ_API_KEY,
            model_name="llama-3.3-70b-versatile",
            temperature=0.1
        )
    else:
        # Fallback to local Ollama or mock
        from langchain_community.chat_models import ChatOllama
        return ChatOllama(
            base_url=settings.OLLAMA_BASE_URL,
            model="llama3.1:8b",
            temperature=0.1
        )

async def support_sentiment_analyzer_node(state: WorkflowState) -> WorkflowState:
    """
    Node 2: Pulls open support tickets for flagged accounts and uses Groq/Ollama LLM
    with structured output validation to determine the root cause, reasoning summary,
    and urgency score.
    """
    flagged = state.get("flagged_accounts", [])
    if not flagged:
        return state

    async with AsyncSessionLocal() as session:
        for acc in flagged:
            # Query open support tickets for this account
            stmt = select(SupportTicket).where(
                SupportTicket.account_id == acc["account_id"],
                SupportTicket.status == "open"
            )
            res = await session.execute(stmt)
            tickets = res.scalars().all()

            ticket_list = []
            ticket_texts = []
            for t in tickets:
                ticket_list.append({"ticket_id": t.ticket_id, "subject": t.subject, "body": t.body})
                ticket_texts.append(f"Ticket [{t.ticket_id}] {t.subject}: {t.body}")

            acc["tickets"] = ticket_list

            # Prepare prompt for LLM
            tickets_str = "\n".join(ticket_texts) if ticket_texts else "No recent open support tickets."
            
            prompt = f"""You are an expert RevOps & Customer Success Intelligence AI.
Analyze the following usage drop signal and support tickets for account '{acc['account_name']}' (ARR: ${acc['arr']:,.2f}, 7-day usage drop: {acc['usage_drop_pct']}%).

Open Tickets:
{tickets_str}

Classify the root cause into EXACTLY ONE of:
- UNRESOLVED_CRITICAL_BUG
- ONBOARDING_FRICTION
- PRODUCT_GAP
- PRICE_SENSITIVITY
- UNKNOWN

Respond in strict JSON matching this structure:
{{
  "root_cause": "EXACT_CATEGORY_NAME",
  "reasoning_summary": "Concise 2-3 sentence explanation of the situation and recommendation.",
  "urgency_score": integer between 1 and 10
}}
"""

            try:
                llm = await get_llm()
                if hasattr(llm, "with_structured_output"):
                    structured_llm = llm.with_structured_output(SentimentAnalysisOutput)
                    response = await structured_llm.ainvoke(prompt)
                    acc["root_cause"] = response.root_cause
                    acc["reasoning_summary"] = response.reasoning_summary
                    acc["urgency_score"] = response.urgency_score
                else:
                    # Fallback raw invoke & parse
                    resp = await llm.ainvoke(prompt)
                    data = json.loads(resp.content)
                    parsed = SentimentAnalysisOutput(**data)
                    acc["root_cause"] = parsed.root_cause
                    acc["reasoning_summary"] = parsed.reasoning_summary
                    acc["urgency_score"] = parsed.urgency_score
            except Exception as e:
                # Rule-based fallback if API key is missing or offline
                print(f"LLM Sentiment Analysis fallback for {acc['account_name']}: {e}")
                if "critical" in tickets_str.lower() or "500" in tickets_str.lower():
                    acc["root_cause"] = "UNRESOLVED_CRITICAL_BUG"
                    acc["reasoning_summary"] = f"Production issue causing service interruption. {acc['usage_drop_pct']}% drop detected alongside open bug ticket."
                    acc["urgency_score"] = 9
                elif "onboarding" in tickets_str.lower() or "sso" in tickets_str.lower():
                    acc["root_cause"] = "ONBOARDING_FRICTION"
                    acc["reasoning_summary"] = f"Account experiencing onboarding roadblocks. Setup tickets pending resolution."
                    acc["urgency_score"] = 7
                elif "billing" in tickets_str.lower() or "price" in tickets_str.lower():
                    acc["root_cause"] = "PRICE_SENSITIVITY"
                    acc["reasoning_summary"] = f"Account raised renewal pricing objections while usage declined by {acc['usage_drop_pct']}%."
                    acc["urgency_score"] = 6
                else:
                    acc["root_cause"] = "UNKNOWN"
                    acc["reasoning_summary"] = f"Usage dropped by {acc['usage_drop_pct']}% without explicit support ticket signals."
                    acc["urgency_score"] = 5

    state["status"] = "SENTIMENT_ANALYSIS_COMPLETE"
    return state
