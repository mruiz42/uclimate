import httpx

from app.cache import Cache
from app.config import Settings
from app.providers.base import Providers
from app.providers.open_meteo import OpenMeteoWeather
from app.providers.osrm import OsrmRouting
from app.providers.photon import PhotonGeocoding


def build_providers(settings: Settings, client: httpx.AsyncClient, cache: Cache) -> Providers:
    """Wire up the configured implementation for each capability.

    To add an alternative (e.g. Valhalla routing), implement the matching Protocol in
    app/providers/base.py, extend the Literal in Settings, and branch on it here.
    """
    match settings.routing_provider:
        case "osrm":
            routing = OsrmRouting(client, settings.osrm_url, cache)
    match settings.geocoding_provider:
        case "photon":
            geocoding = PhotonGeocoding(client, settings.photon_url, cache)
    match settings.weather_provider:
        case "open-meteo":
            weather = OpenMeteoWeather(client, settings.open_meteo_url, cache)
    return Providers(routing=routing, geocoding=geocoding, weather=weather)
