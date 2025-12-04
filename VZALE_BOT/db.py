import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

pool: asyncpg.Pool | None = None


async def init_db():
    global pool
    if pool is None:
        pool = await asyncpg.create_pool(DATABASE_URL)


ASYNC_CONNECTION_ERROR = "DB pool is not initialized"


def _ensure_pool():
    assert pool is not None, ASYNC_CONNECTION_ERROR
    return pool


async def fetch(query: str, *params):
    db_pool = _ensure_pool()
    return await db_pool.fetch(query, *params)


async def fetchrow(query: str, *params):
    db_pool = _ensure_pool()
    return await db_pool.fetchrow(query, *params)


async def execute(query: str, *params):
    db_pool = _ensure_pool()
    return await db_pool.execute(query, *params)
