class ProviderError(Exception):
    """Base business error for provider-service."""


class InvalidCredentials(ProviderError):
    pass


class AccountAlreadyExists(ProviderError):
    pass
