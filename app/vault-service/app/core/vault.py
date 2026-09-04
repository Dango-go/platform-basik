import hvac

vault_client = hvac.Client(
    url="http://vault-client:8200",
    token="hvactoken"
)