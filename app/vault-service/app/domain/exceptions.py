class VaultError(Exception):
    """Base business error for vault-service."""


class CredentialNotFoundError(VaultError):
    pass


class EncryptionError(VaultError):
    pass
