import os
from typing import Any, Dict

from fastapi import FastAPI, HTTPException
import httpx

app = FastAPI(title="Telemetry Service", version="0.1.0")

TEMPERATURE_API_URL = os.getenv("TEMPERATURE_API_URL", "http://temperature-api:8081")


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/telemetry/temperature/{sensor_id}")
async def get_temperature_by_sensor(sensor_id: str) -> Any:
    """
    Proxy to temperature-api to fetch temperature by sensorId.
    """
    url = f"{TEMPERATURE_API_URL}/temperature/{sensor_id}"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail=resp.text)
            return resp.json()
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Failed to reach temperature-api: {e}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8082")),
        reload=False,
    )
