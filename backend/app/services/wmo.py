"""WMO weather interpretation codes, as used by Open-Meteo.

https://open-meteo.com/en/docs (section "WMO Weather interpretation codes")
"""

# code -> (description, icon). Icons are stable keys the client maps to glyphs.
WMO_CODES: dict[int, tuple[str, str]] = {
    0: ("Clear sky", "clear"),
    1: ("Mainly clear", "mostly-clear"),
    2: ("Partly cloudy", "partly-cloudy"),
    3: ("Overcast", "cloudy"),
    45: ("Fog", "fog"),
    48: ("Depositing rime fog", "fog"),
    51: ("Light drizzle", "drizzle"),
    53: ("Drizzle", "drizzle"),
    55: ("Dense drizzle", "drizzle"),
    56: ("Light freezing drizzle", "freezing-rain"),
    57: ("Freezing drizzle", "freezing-rain"),
    61: ("Light rain", "rain"),
    63: ("Rain", "rain"),
    65: ("Heavy rain", "rain"),
    66: ("Light freezing rain", "freezing-rain"),
    67: ("Freezing rain", "freezing-rain"),
    71: ("Light snow", "snow"),
    73: ("Snow", "snow"),
    75: ("Heavy snow", "snow"),
    77: ("Snow grains", "snow"),
    80: ("Light rain showers", "showers"),
    81: ("Rain showers", "showers"),
    82: ("Violent rain showers", "showers"),
    85: ("Light snow showers", "snow"),
    86: ("Snow showers", "snow"),
    95: ("Thunderstorm", "thunderstorm"),
    96: ("Thunderstorm with light hail", "thunderstorm"),
    99: ("Thunderstorm with heavy hail", "thunderstorm"),
}


def describe(code: int) -> tuple[str, str]:
    return WMO_CODES.get(code, ("Unknown", "unknown"))
