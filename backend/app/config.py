from functools import lru_cache
import json
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_anon_key: str = ""
    cors_origins: list[str] = ["http://localhost:3000"]
    frontend_url: str = "http://localhost:3000"

    super_admin_passcode: str = "turntoken-admin-2026"
    super_admin_emails: list[str] = ["admin@turn-token.app", "hussain@turn-token.app"]

    vapid_public_key: str = ""
    vapid_private_key: str = ""
    vapid_contact_email: str = "notifications@turn-token.app"

    # Exactly one process should run the no-show sweep (see
    # app/main.py::_sweep_loop). Set to false on every worker but one if
    # the backend ever runs with more than a single process.
    run_state_machine: bool = True

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    def require_configured(self) -> None:
        """Fail loudly at startup instead of booting into a state where
        every request silently 500s because the Supabase client has
        nothing to talk to."""
        missing = []
        if not self.supabase_url:
            missing.append("SUPABASE_URL")
        if not self.supabase_service_role_key and not self.supabase_anon_key:
            missing.append("SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)")
        if missing:
            raise RuntimeError(
                "Missing required environment variable(s): "
                + ", ".join(missing)
                + ". Copy backend/.env.example to backend/.env and fill them in."
            )

    @field_validator("super_admin_emails", mode="before")
    @classmethod
    def parse_admin_emails(cls, v):
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return []
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [email.strip() for email in v.split(",") if email.strip()]
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()
