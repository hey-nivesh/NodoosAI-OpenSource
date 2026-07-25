import asyncio
from datetime import date, timedelta, datetime
from decimal import Decimal
from db.session import get_active_engine, AsyncSessionLocal
from db.models import Base, FactProductUsage, SupportTicket, ChurnRescueAction

async def seed_data():
    active_engine = await get_active_engine()
    
    async with active_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            FactProductUsage.__table__.select().limit(1)
        )
        if result.first():
            print("Database already contains telemetry data. Ready for analysis.")
            return

        today = date.today()
        
        accounts = [
            # CRITICAL — big ARR, production bug
            {"id": "acc_acme",       "name": "Acme Corp",           "arr": Decimal("150000.00"), "scenario": "critical_bug"},
            # ONBOARDING FRICTION — enterprise SSO blocked
            {"id": "acc_cyberdyne",  "name": "Cyberdyne Systems",   "arr": Decimal("220000.00"), "scenario": "onboarding_friction"},
            # PRICE SENSITIVITY — renewal objection
            {"id": "acc_stark",      "name": "Stark Industries",    "arr": Decimal("45000.00"),  "scenario": "price_sensitivity"},
            # STABLE — healthy usage, no risk
            {"id": "acc_wayne",      "name": "Wayne Enterprises",   "arr": Decimal("180000.00"), "scenario": "stable"},
            # PRODUCT GAP — feature request frustration
            {"id": "acc_oscorp",     "name": "Oscorp Technologies", "arr": Decimal("95000.00"),  "scenario": "product_gap"},
            # CRITICAL CHURN — silent drop, no tickets yet
            {"id": "acc_initech",    "name": "Initech Solutions",   "arr": Decimal("310000.00"), "scenario": "critical_bug"},
            # MID-TIER — moderate drop, needs nurturing
            {"id": "acc_vehement",   "name": "Vehement Capital",    "arr": Decimal("72000.00"),  "scenario": "price_sensitivity"},
            # STABLE — healthy growing account
            {"id": "acc_globex",     "name": "Globex Corporation",  "arr": Decimal("260000.00"), "scenario": "stable"},
            # ONBOARDING — new enterprise customer stuck
            {"id": "acc_umbrella",   "name": "Umbrella Enterprise", "arr": Decimal("130000.00"), "scenario": "onboarding_friction"},
            # PRODUCT GAP — churned from feature miss
            {"id": "acc_aperture",   "name": "Aperture Labs",       "arr": Decimal("58000.00"),  "scenario": "product_gap"},
        ]

        # Scenario profiles (7d multiplier, 28d multiplier)
        scenario_map = {
            "critical_bug":        {"7d": 0.15, "28d": 1.0},   # 85% drop
            "onboarding_friction": {"7d": 0.30, "28d": 1.0},   # 70% drop
            "price_sensitivity":   {"7d": 0.45, "28d": 1.0},   # 55% drop
            "product_gap":         {"7d": 0.50, "28d": 1.0},   # 50% drop
            "stable":              {"7d": 1.10, "28d": 1.0},   # 10% growth
        }

        usage_records = []
        for acc in accounts:
            profile = scenario_map[acc["scenario"]]
            base_users   = 80
            base_api     = 2000
            base_features= 350

            for day_offset in range(35, 0, -1):
                m_date = today - timedelta(days=day_offset)

                if day_offset <= 7:
                    mult = profile["7d"]
                else:
                    mult = profile["28d"]

                # Add slight random variation via hash
                variation = 1.0 + ((hash(f"{acc['id']}{day_offset}") % 20 - 10) / 100)

                usage_records.append(FactProductUsage(
                    account_id=acc["id"],
                    account_name=acc["name"],
                    arr=acc["arr"],
                    metric_date=m_date,
                    active_users=max(0, int(base_users * mult * variation)),
                    api_calls=max(0, int(base_api * mult * variation)),
                    feature_execution_count=max(0, int(base_features * mult * variation)),
                ))

        session.add_all(usage_records)

        tickets = [
            SupportTicket(
                ticket_id="TCK-101",
                account_id="acc_acme",
                subject="CRITICAL: API authentication 500 errors after v2.8 deploy",
                body="Our production environment has been fully down for 18 hours. Auth v2 endpoint returns null pointer exception on SSO callback. SLA breach imminent. Need emergency escalation.",
                status="open",
                created_at=datetime.utcnow() - timedelta(days=2)
            ),
            SupportTicket(
                ticket_id="TCK-102",
                account_id="acc_cyberdyne",
                subject="Onboarding blocked — Okta SAML SSO config fails every attempt",
                body="We have 450 employees waiting to onboard. The SAML entity ID configuration is not being accepted by your SSO setup wizard. Technical team has tried 12 times with support.",
                status="open",
                created_at=datetime.utcnow() - timedelta(days=3)
            ),
            SupportTicket(
                ticket_id="TCK-103",
                account_id="acc_stark",
                subject="Renewal pricing review — evaluating alternatives for Q3",
                body="Given our decreased seat usage this quarter the current Enterprise price point no longer aligns with ROI expectations. We are benchmarking three competitors. Would like to discuss options.",
                status="open",
                created_at=datetime.utcnow() - timedelta(days=1)
            ),
            SupportTicket(
                ticket_id="TCK-104",
                account_id="acc_oscorp",
                subject="Bulk export feature missing — critical for our workflow",
                body="The batch data export feature we discussed in our sales call is still not available. Our ops team cannot run month-end reporting without it. Considering downgrade until this ships.",
                status="open",
                created_at=datetime.utcnow() - timedelta(days=4)
            ),
            SupportTicket(
                ticket_id="TCK-105",
                account_id="acc_initech",
                subject="Silent API failures — no error response returned",
                body="Our monitoring detected a 92% API call failure rate in the last 6 days with no error codes returned. Requests hang for 30s and then return 200 OK with empty payload.",
                status="open",
                created_at=datetime.utcnow() - timedelta(days=1)
            ),
            SupportTicket(
                ticket_id="TCK-106",
                account_id="acc_vehement",
                subject="Reviewing tier — annual renewal coming up in 45 days",
                body="We need to assess if the Business tier still makes sense for our 12-person team. Usage has declined and we want to explore the Starter tier or a customised plan.",
                status="open",
                created_at=datetime.utcnow() - timedelta(days=5)
            ),
            SupportTicket(
                ticket_id="TCK-107",
                account_id="acc_umbrella",
                subject="Enterprise onboarding — data migration scripts failing on Step 4",
                body="The onboarding migration pipeline crashes on schema validation step 4. Our 600GB dataset cannot be imported. The customer success handoff was incomplete.",
                status="open",
                created_at=datetime.utcnow() - timedelta(days=2)
            ),
            SupportTicket(
                ticket_id="TCK-108",
                account_id="acc_aperture",
                subject="Missing real-time webhook delivery — switching to competitor",
                body="We migrated to a competitor platform for real-time event streaming last week. Our contract is up for renewal and without native webhook support we will not renew.",
                status="open",
                created_at=datetime.utcnow() - timedelta(hours=18)
            ),
        ]
        session.add_all(tickets)

        await session.commit()
        print("✅ Database seeded with 10 accounts, 35-day usage telemetry, and 8 support tickets.")

if __name__ == "__main__":
    asyncio.run(seed_data())
