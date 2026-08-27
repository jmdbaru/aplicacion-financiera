from financiera_api.config import Settings


def test_rejects_wildcard_cors_origin() -> None:
    try:
        Settings(cors_allowed_origins="*")
    except ValueError:
        pass
    else:
        raise AssertionError("El comodín CORS debe rechazarse.")


def test_parses_multiple_cors_origins() -> None:
    settings = Settings(cors_allowed_origins="https://app.example.com, https://preview.example.com")

    assert settings.cors_origins == ["https://app.example.com", "https://preview.example.com"]

