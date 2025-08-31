import os
import asyncio
from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException
import httpx
import asyncpg

app = FastAPI(title="Telemetry Service", version="0.3.0")

TEMPERATURE_API_URL = os.getenv("TEMPERATURE_API_URL", "http://temperature-api:8081")
DATABASE_URL = os.getenv("DATABASE_URL", "postgres://postgres:postgres@postgres:5432/smarthome")


@app.on_event("startup")
async def startup() -> None:
    try:
        app.state.pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=5)
    except Exception as e:
        # Log but do not crash; service can still proxy temperature-api
        app.logger = getattr(app, "logger", None)
        if app.logger:
            app.logger.error(f"DB pool init failed: {e}")


@app.on_event("shutdown")
async def shutdown() -> None:
    pool = getattr(app.state, "pool", None)
    if pool:
        await pool.close()


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/telemetry/{device_id}")
async def get_telemetry(device_id: str) -> Dict[str, Any]:
    async def fetch_external_value() -> Any:
        url = f"{TEMPERATURE_API_URL}/temperature/v2"
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail=resp.text)
            data = resp.json()
            return data.get("value") if isinstance(data, dict) else data

    async def fetch_db_rows() -> List[Dict[str, Any]]:
        pool = getattr(app.state, "pool", None)
        if not pool:
            return []
        sql = (
            'SELECT id, '
            '       device_id as "deviceId", '
            '       name, '
            '       type, '
            '       location, '
            '       value, '
            '       unit, '
            '       status, '
            '       created_at as "createdAt" '
            'FROM telemetry '
            'WHERE device_id = $1 '
            'ORDER BY created_at DESC'
        )
        async with pool.acquire() as conn:
            rows = await conn.fetch(sql, device_id)
            return [dict(r) for r in rows]

    try:
        external_value, rows = await asyncio.gather(fetch_external_value(), fetch_db_rows())
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"failed_to_fetch: {e}")

    return {
               **rows[0],
               "value": external_value
           }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8082")),
        reload=False,
    )
