import asyncio
import asyncpg

 
SERVICES_DB_CONFIG = [
    {"db": "vault_storage", "user": "admin", "password": "vault"},
    {"db": "orders_db", "user": "admin", "password": "order"},
    {"db": "idp_users", "user": "admin", "password": "provider"},
    {"db": "idp_authentication", "user": "admin", "password": "auth"},
    {"db": "provisioning_db", "user": "admin", "password": "provisioning"}
]

async def init_databases_and_users():
 
    conn = await asyncpg.connect(
        user="admin",
        password="vault",
        host="localhost",
        port=5432,
        database="postgres"
    )
    
    try:
        for cfg in SERVICES_DB_CONFIG:
            db_name = cfg["db"]
            db_user = cfg["user"]
            db_pass = cfg["password"]

 
            user_exists = await conn.fetchval(
                "SELECT 1 FROM pg_roles WHERE rolname = $1", db_user
            )
            if not user_exists:
                await conn.execute(f"CREATE USER \"{db_user}\" WITH PASSWORD '{db_pass}'")
                print(f"[+] Користувача '{db_user}' створено.")
            else:
                print(f"[=] Користувач '{db_user}' вже існує.")
 
            db_exists = await conn.fetchval(
                "SELECT 1 FROM pg_database WHERE datname = $1", db_name
            )
            if not db_exists:
 
                await conn.execute(f'CREATE DATABASE "{db_name}" OWNER "{db_user}"')
                print(f"[+] Базу даних '{db_name}' створено для власника '{db_user}'.")
            else:
                print(f"[=] База даних '{db_name}' вже існує.")
 
            await conn.execute(f'GRANT ALL PRIVILEGES ON DATABASE "{db_name}" TO "{db_user}"')

    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(init_databases_and_users())