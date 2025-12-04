import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { AlertCircle, Loader2, Navigation, Clock, Route, Home, Building2, Banknote, ArrowLeftRight, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from 'react-i18next';

interface Address {
  id: string;
  address: string;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  label: string | null;
  is_primary: boolean;
}

interface OriginOption {
  id: string;
  label: string;
  type: 'home' | 'company';
  address: string;
  city: string | null;
  postal_code: string | null;
  country: string | null;
}

interface RouteInfo {
  distance: number;
  duration: number;
}

interface AddressMapProps {
  addresses: Address[];
}

export const AddressMap = ({ addresses }: AddressMapProps) => {
  const { t } = useTranslation();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  
  const [originOptions, setOriginOptions] = useState<OriginOption[]>([]);
  const [selectedOrigin, setSelectedOrigin] = useState<string>('');
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [kmRate, setKmRate] = useState<number>(1.50);
  const [isRoundTrip, setIsRoundTrip] = useState<boolean>(() => {
    const saved = localStorage.getItem('mapRoundTrip');
    return saved === 'true';
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    localStorage.setItem('mapRoundTrip', isRoundTrip.toString());
  }, [isRoundTrip]);

  useEffect(() => {
    if (map.current) {
      setTimeout(() => {
        map.current?.resize();
      }, 100);
    }
  }, [isFullscreen]);

  useEffect(() => {
    const fetchKmRate = async () => {
      const { data, error } = await supabase
        .from('system_numeric_settings')
        .select('setting_value')
        .eq('setting_key', 'km_rate')
        .single();

      if (!error && data) {
        setKmRate(Number(data.setting_value));
      }
    };

    fetchKmRate();
  }, []);

  useEffect(() => {
    const fetchOriginOptions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const options: OriginOption[] = [];

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, address, city, postal_code, country, full_name')
          .eq('id', user.id)
          .single();

        if (profile?.address) {
          options.push({
            id: 'home',
            label: t('addressMap.myHomeAddress', 'My Home Address'),
            type: 'home',
            address: profile.address,
            city: profile.city,
            postal_code: profile.postal_code,
            country: profile.country,
          });
        }

        const { data: companyAddresses } = await supabase
          .from('company_addresses')
          .select('id, address, city, postal_code, country, label')
          .order('is_primary', { ascending: false });

        if (companyAddresses) {
          companyAddresses.forEach(addr => {
            options.push({
              id: addr.id,
              label: addr.label || t('addressMap.companyAddress', 'Company Address'),
              type: 'company',
              address: addr.address,
              city: addr.city,
              postal_code: addr.postal_code,
              country: addr.country,
            });
          });
        }

        setOriginOptions(options);
        
        if (options.length > 0) {
          const saved = localStorage.getItem('preferredMapOrigin');
          if (saved && options.find(o => o.id === saved)) {
            setSelectedOrigin(saved);
          } else {
            setSelectedOrigin(options[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch origin options:', err);
      }
    };

    fetchOriginOptions();
  }, [t]);

  useEffect(() => {
    if (selectedOrigin) {
      localStorage.setItem('preferredMapOrigin', selectedOrigin);
    }
  }, [selectedOrigin]);

  // Fetch Mapbox access token
  useEffect(() => {
    const fetchAccessToken = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error: fnError } = await supabase.functions.invoke('get-mapbox-token');
        
        if (fnError) {
          throw new Error(fnError.message);
        }
        
        if (data?.token) {
          setAccessToken(data.token);
        } else if (data?.error) {
          throw new Error(data.error);
        }
      } catch (err) {
        console.error('Failed to fetch Mapbox access token:', err);
        setError(err instanceof Error ? err.message : 'Failed to load map');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccessToken();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !accessToken || map.current) return;

    try {
      mapboxgl.accessToken = accessToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [19.145136, 51.919438], // Poland center [lng, lat]
        zoom: 5,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');

      map.current.on('load', () => {
        setIsMapReady(true);
      });

      return () => {
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
        map.current?.remove();
        map.current = null;
      };
    } catch (error) {
      console.error('Map initialization error:', error);
      setError('Failed to initialize map');
    }
  }, [accessToken]);

  const geocodeAddress = useCallback(async (addr: { address: string; city: string | null; postal_code: string | null; country: string | null }): Promise<[number, number] | null> => {
    if (!accessToken) return null;
    
    const query = `${addr.address}, ${addr.postal_code || ''} ${addr.city || ''}, ${addr.country || 'Poland'}`;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${accessToken}&limit=1`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        return data.features[0].center as [number, number];
      }
      return null;
    } catch (err) {
      console.error('Geocoding failed:', err);
      return null;
    }
  }, [accessToken]);

  // Add destination markers
  useEffect(() => {
    if (!isMapReady || !map.current || addresses.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    let hasValidCoords = false;
    let primaryCoords: [number, number] | null = null;

    const addMarkers = async () => {
      for (const address of addresses) {
        const coords = await geocodeAddress(address);
        if (coords) {
          hasValidCoords = true;
          bounds.extend(coords);
          
          if (address.is_primary) {
            primaryCoords = coords;
            setDestinationCoords(coords);
          }

          const el = document.createElement('div');
          el.className = 'w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center';
          if (address.is_primary) {
            el.className = 'w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center';
          }

          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat(coords)
            .setPopup(
              new mapboxgl.Popup({ offset: 25 }).setHTML(
                `<div class="p-2">
                  <p class="font-semibold text-sm">${address.label || 'Address'}</p>
                  <p class="text-xs text-gray-600">${address.address}</p>
                  <p class="text-xs text-gray-600">${address.postal_code || ''} ${address.city || ''}</p>
                </div>`
              )
            )
            .addTo(map.current!);

          markersRef.current.push(marker);
        }
      }

      if (!primaryCoords && hasValidCoords && addresses.length > 0) {
        const firstCoords = await geocodeAddress(addresses[0]);
        if (firstCoords) {
          setDestinationCoords(firstCoords);
        }
      }

      if (hasValidCoords && map.current) {
        map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
      }
    };

    addMarkers();
  }, [isMapReady, addresses, geocodeAddress]);

  // Calculate and draw route
  useEffect(() => {
    if (!isMapReady || !map.current || !destinationCoords || !selectedOrigin || !accessToken) return;

    const calculateRoute = async () => {
      const originOption = originOptions.find(o => o.id === selectedOrigin);
      if (!originOption) return;

      setIsCalculatingRoute(true);
      setRouteInfo(null);

      try {
        const originCoords = await geocodeAddress(originOption);
        if (!originCoords) {
          setIsCalculatingRoute(false);
          return;
        }

        // Remove existing origin marker with green color
        const existingOriginMarker = markersRef.current.find(m => (m as any).isOrigin);
        if (existingOriginMarker) {
          existingOriginMarker.remove();
          markersRef.current = markersRef.current.filter(m => m !== existingOriginMarker);
        }

        // Add origin marker
        const originEl = document.createElement('div');
        originEl.className = 'w-8 h-8 rounded-full bg-green-500 border-2 border-white shadow-lg flex items-center justify-center';

        const originMarker = new mapboxgl.Marker({ element: originEl })
          .setLngLat(originCoords)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<div class="p-2">
                <p class="font-semibold text-sm">${originOption.label}</p>
                <p class="text-xs text-gray-600">${originOption.address}</p>
                <p class="text-xs text-gray-600">${originOption.postal_code || ''} ${originOption.city || ''}</p>
              </div>`
            )
          )
          .addTo(map.current!);
        
        (originMarker as any).isOrigin = true;
        markersRef.current.push(originMarker);

        // Get route from Mapbox Directions API
        const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords[0]},${originCoords[1]};${destinationCoords[0]},${destinationCoords[1]}?geometries=geojson&access_token=${accessToken}`;
        
        const response = await fetch(directionsUrl);
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          
          setRouteInfo({
            distance: route.distance,
            duration: route.duration,
          });

          // Remove existing route layer if any
          if (map.current?.getLayer('route')) {
            map.current.removeLayer('route');
          }
          if (map.current?.getSource('route')) {
            map.current.removeSource('route');
          }

          // Add route to map
          map.current?.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: route.geometry,
            },
          });

          map.current?.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#3b82f6',
              'line-width': 5,
              'line-opacity': 0.75,
            },
          });

          // Fit bounds to show full route
          const bounds = new mapboxgl.LngLatBounds();
          bounds.extend(originCoords);
          bounds.extend(destinationCoords);
          map.current?.fitBounds(bounds, { padding: 80 });
        }

        setIsCalculatingRoute(false);
      } catch (err) {
        console.error('Route calculation error:', err);
        setIsCalculatingRoute(false);
      }
    };

    calculateRoute();
  }, [isMapReady, destinationCoords, selectedOrigin, originOptions, geocodeAddress, accessToken]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
  };

  const formatDistance = (meters: number): string => {
    const km = meters / 1000;
    return `${km.toFixed(1)} km`;
  };

  if (isLoading) {
    return (
      <Card className="p-6 flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading map...</span>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-muted/30">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Map Unavailable</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {error}. Please ensure the Mapbox access token is configured.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden relative ${isFullscreen ? 'fixed inset-4 z-50 flex flex-col' : ''}`}>
      {isFullscreen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" 
          onClick={() => setIsFullscreen(false)}
        />
      )}
      
      <Button
        variant="outline"
        size="icon"
        className={`absolute top-2 right-2 h-8 w-8 bg-background/90 backdrop-blur-sm ${isFullscreen ? 'z-[60]' : 'z-10'}`}
        onClick={() => setIsFullscreen(!isFullscreen)}
      >
        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </Button>
      
      {originOptions.length > 0 && (
        <div className="p-3 border-b bg-muted/30">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Navigation className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium shrink-0">{t('addressMap.routeFrom', 'Route from')}:</span>
              <Select value={selectedOrigin} onValueChange={setSelectedOrigin}>
                <SelectTrigger className="h-8 w-[180px]">
                  <SelectValue placeholder={t('addressMap.selectOrigin', 'Select starting point')} />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {originOptions.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      <div className="flex items-center gap-2">
                        {option.type === 'home' ? (
                          <Home className="w-4 h-4 text-green-500 shrink-0" />
                        ) : (
                          <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                        )}
                        <span className="truncate">{option.label}{option.city && ` - ${option.city}`}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isCalculatingRoute ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('addressMap.calculatingRoute', 'Calculating...')}</span>
              </div>
            ) : routeInfo ? (
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <div className="flex items-center gap-1.5">
                  <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{t('addressMap.roundTrip', 'Round-trip')}</span>
                  <Switch
                    checked={isRoundTrip}
                    onCheckedChange={setIsRoundTrip}
                    className="scale-75"
                  />
                </div>
                
                <div className="h-4 w-px bg-border" />
                
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium text-foreground">
                    {formatDuration(routeInfo.duration * (isRoundTrip ? 2 : 1))}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Route className="w-4 h-4" />
                  <span className="font-medium text-foreground">
                    {formatDistance(routeInfo.distance * (isRoundTrip ? 2 : 1))}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Banknote className="w-4 h-4" />
                  <span className="font-medium text-foreground">
                    {((routeInfo.distance / 1000) * kmRate * (isRoundTrip ? 2 : 1)).toFixed(2)} PLN
                  </span>
                  <span className="text-xs">({kmRate.toFixed(2)}/km)</span>
                </div>
              </div>
            ) : destinationCoords ? (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>--</span>
                <Route className="w-4 h-4" />
                <span>--</span>
                <Banknote className="w-4 h-4" />
                <span>--</span>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic">
                {t('addressMap.noAddressForRoute', 'Add an address to calculate route')}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div ref={mapContainer} className={`w-full ${isFullscreen ? 'flex-1' : 'h-80'}`} />
    </Card>
  );
};
