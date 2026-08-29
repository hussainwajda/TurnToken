from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_anon_key: str = ""
    cors_origins: list[str] = ["http://localhost:3000"]

    vapid_public_key: str = ""
    vapid_private_key: str = ""
    vapid_contact_email: str = "notifications@turn-token.app"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
