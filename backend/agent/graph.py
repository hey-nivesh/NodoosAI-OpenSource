from langgraph.graph import StateGraph, END
from agent.state import WorkflowState
from agent.nodes.usage_drop_detector import usage_drop_detector_node
from agent.nodes.support_sentiment_analyzer import support_sentiment_analyzer_node
from agent.nodes.playbook_trigger_agent import playbook_trigger_agent_node

def build_graph():
    """Compiles the 3-node LangGraph autonomous churn detection workflow graph."""
    builder = StateGraph(WorkflowState)

    builder.add_node("usage_drop_detector", usage_drop_detector_node)
    builder.add_node("support_sentiment_analyzer", support_sentiment_analyzer_node)
    builder.add_node("playbook_trigger_agent", playbook_trigger_agent_node)

    builder.set_entry_point("usage_drop_detector")
    builder.add_edge("usage_drop_detector", "support_sentiment_analyzer")
    builder.add_edge("support_sentiment_analyzer", "playbook_trigger_agent")
    builder.add_edge("playbook_trigger_agent", END)

    return builder.compile()

graph = build_graph()

async def run_churn_detection_agent(org_id: str = None) -> WorkflowState:
    """Executes the full agent graph and returns final state."""
    initial_state: WorkflowState = {
        "flagged_accounts": [],
        "processed_actions": [],
        "status": "INITIALIZED",
        "message": "Starting autonomous agent execution...",
        "org_id": org_id,
    }
    final_state = await graph.ainvoke(initial_state)
    return final_state
