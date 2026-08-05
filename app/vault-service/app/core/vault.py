import hvac

vault_client = hvac.Client(
    url="http://localhost:8200",
    token="hvactoken"
)