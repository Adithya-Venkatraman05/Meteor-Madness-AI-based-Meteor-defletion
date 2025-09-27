# Asteroid Autocomplete API

This API provides autocomplete functionality for asteroid names using NASA's Small-Body Database (SBDB) and a curated list of well-known asteroids.

## Endpoints

### 1. NASA SBDB Autocomplete
**GET** `/asteroids/autocomplete`

Uses NASA's Small-Body Database API to search for Near-Earth Asteroids.

**Parameters:**
- `query` (required): Partial asteroid name (minimum 1 character)
- `limit` (optional): Maximum results to return (1-50, default: 10)

**Example:**
```bash
curl "http://localhost:8000/asteroids/autocomplete?query=Apophis&limit=5"
```

**Response:**
```json
{
  "query": "Apophis",
  "results": [
    {
      "spkid": "2099942",
      "full_name": "99942 Apophis (2004 MN4)",
      "name": "Apophis",
      "prefix": "99942",
      "diameter": 0.27,
      "orbit_class": "APO",
      "is_potentially_hazardous": true
    }
  ],
  "total": 1,
  "message": "Found 1 asteroids matching 'Apophis'"
}
```

### 2. Simple Autocomplete (Fallback)
**GET** `/asteroids/autocomplete-simple`

Uses a curated list of well-known asteroids for faster, more reliable responses.

**Parameters:**
- `query` (required): Partial asteroid name (minimum 1 character)
- `limit` (optional): Maximum results to return (1-50, default: 10)

**Example:**
```bash
curl "http://localhost:8000/asteroids/autocomplete-simple?query=Ceres&limit=5"
```

**Response:**
```json
{
  "query": "Ceres",
  "results": [
    {
      "name": "Ceres",
      "full_name": "1 Ceres",
      "type": "dwarf planet"
    }
  ],
  "total": 1,
  "message": "Found 1 known asteroids matching 'Ceres'"
}
```

## Frontend Integration

### JavaScript/React Example

```javascript
// Debounced autocomplete function
const searchAsteroids = async (query) => {
  if (query.length < 1) return [];
  
  try {
    const response = await fetch(
      `http://localhost:8000/asteroids/autocomplete-simple?query=${encodeURIComponent(query)}&limit=10`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data.results;
    
  } catch (error) {
    console.error('Asteroid search error:', error);
    return [];
  }
};

// React hook example
const useAsteroidAutocomplete = (query, delay = 300) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    const timeoutId = setTimeout(async () => {
      const asteroids = await searchAsteroids(query);
      setResults(asteroids);
      setLoading(false);
    }, delay);
    
    return () => clearTimeout(timeoutId);
  }, [query, delay]);
  
  return { results, loading };
};
```

### HTML/Vanilla JS Example

```html
<input 
  type="text" 
  id="asteroidSearch" 
  placeholder="Search asteroids..." 
  oninput="handleSearch(this.value)"
>
<div id="suggestions"></div>

<script>
let debounceTimer;

async function handleSearch(query) {
  clearTimeout(debounceTimer);
  
  debounceTimer = setTimeout(async () => {
    if (query.length < 1) {
      document.getElementById('suggestions').innerHTML = '';
      return;
    }
    
    try {
      const response = await fetch(
        `/asteroids/autocomplete-simple?query=${query}&limit=5`
      );
      const data = await response.json();
      
      const suggestionsHtml = data.results.map(asteroid => 
        `<div onclick="selectAsteroid('${asteroid.full_name}')">
          ${asteroid.full_name} (${asteroid.type})
         </div>`
      ).join('');
      
      document.getElementById('suggestions').innerHTML = suggestionsHtml;
      
    } catch (error) {
      console.error('Search error:', error);
    }
  }, 300);
}

function selectAsteroid(name) {
  document.getElementById('asteroidSearch').value = name;
  document.getElementById('suggestions').innerHTML = '';
}
</script>
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200 OK`: Successful response
- `422 Unprocessable Entity`: Invalid parameters (e.g., empty query)
- `503 Service Unavailable`: NASA SBDB API unavailable
- `500 Internal Server Error`: Server error

## Known Asteroids (Simple Endpoint)

The simple endpoint includes these well-known asteroids:
- **Ceres** (1 Ceres) - dwarf planet
- **Pallas** (2 Pallas) - asteroid
- **Juno** (3 Juno) - asteroid
- **Vesta** (4 Vesta) - asteroid
- **Apophis** (99942 Apophis) - potentially hazardous
- **Bennu** (101955 Bennu) - potentially hazardous
- **Ryugu** (162173 Ryugu) - near-Earth
- **Itokawa** (25143 Itokawa) - near-Earth
- **Eros** (433 Eros) - near-Earth
- **Ida** (243 Ida) - main belt
- **Gaspra** (951 Gaspra) - main belt
- **Mathilde** (253 Mathilde) - main belt
- **Steins** (2867 Steins) - main belt
- **Lutetia** (21 Lutetia) - main belt
- **Didymos** (65803 Didymos) - binary asteroid

## Performance Tips

1. **Use debouncing**: Wait 300ms after user stops typing before making requests
2. **Limit results**: Use reasonable limits (5-10) for autocomplete
3. **Fallback strategy**: Try the simple endpoint if NASA SBDB is unavailable
4. **Caching**: Consider caching results on the frontend for repeated queries
5. **Error handling**: Always handle network errors gracefully