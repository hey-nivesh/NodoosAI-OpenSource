from app.config import Settings

def test_settings_allowed_origins():
    settings = Settings(ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001")
    assert settings.allowed_origins_list == ["http://localhost:3000", "http://localhost:3001"]
