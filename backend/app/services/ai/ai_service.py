from app.services.ai.groq_client import groq_client
from app.services.ai.prompt_manager import prompt_manager

class AIService:
    async def verify_connectivity(self):
        """
        Tests the link between the backend and Groq Llama-3.
        Used by the AI Control settings page.
        """
        system = prompt_manager.get_system_context()
        user = prompt_manager.get_test_prompt()
        
        response = await groq_client.get_completion(system, user)
        
        # Logic: If Groq responds with 'ONLINE', infrastructure is stable
        status = "Connected" if response and "ONLINE" in response else "Error"
        
        return {
            "status": status,
            "model": groq_client.model,
            "response": response or "No Response from Neural Uplink"
        }

    async def generate_daily_summary(self, user_name, habits, today_logs):
        """
        Generates the 2-sentence tactical briefing for the Dashboard.
        Analyzes today's wins and pending tasks.
        """
        total = len(habits)
        done = len([l for l in today_logs if l.status == "done"])
        
        # Build habit context for the AI
        habits_list = []
        for h in habits:
            status = next((l.status for l in today_logs if l.habit_id == h.id), "pending")
            habits_list.append(f"{h.name}: {status}")

        system = prompt_manager.get_system_context()
        user = prompt_manager.get_daily_summary_prompt(user_name, total, done, habits_list)
        
        briefing = await groq_client.get_completion(system, user)
        return briefing or "Neural uplink unstable. Briefing unavailable."

    async def get_strategic_analysis(self, section: str, context: dict):
        """
        Performs deep behavioral analysis for the AI Coach module.
        Handles: behavior, goals, predictive, and weekly sections.
        """
        system = prompt_manager.get_system_context()
        user = prompt_manager.get_analysis_prompt(section, context)
        
        response = await groq_client.get_completion(system, user)
        return response or "Uplink failed. Strategic intelligence unavailable."

    async def generate_pure_quote(self):
        """
        Generates a non-military, human-centric motivational quote.
        Used specifically for the Motivation Hub header.
        """
        system = "You are a world-class motivational philosopher."
        user = prompt_manager.get_human_motivation_prompt()
        
        quote = await groq_client.get_completion(system, user)
        return quote or "Discipline is the bridge between goals and accomplishment."

# Centralized instance to be used by all routers
ai_service = AIService()