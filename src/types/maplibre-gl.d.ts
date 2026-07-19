declare module "maplibre-gl" {
  export class Map {
    constructor(options: {
      container: HTMLElement | string;
      style?: string;
      center?: [number, number];
      zoom?: number;
      attributionControl?: boolean;
    });
    on(event: string, callback: () => void): void;
    on(event: string, callback: (e?: any) => void): void;
    getCenter(): { lng: number; lat: number };
    getZoom(): number;
    addControl(control: any, position?: string): void;
    remove(): void;
    flyTo(options: any): void;
    addSource(id: string, source: any): void;
    removeSource(id: string): void;
    addLayer(layer: any): void;
    removeLayer(id: string): void;
    getLayer(id: string): any;
    getSource(id: string): any;
    setFilter(layer: string, filter: any): void;
    setPaintProperty(layer: string, name: string, value: any): void;
    project(lngLat: [number, number]): { x: number; y: number };
    unproject(point: [number, number]): { lng: number; lat: number };
    getBounds(): any;
    resize(eventData?: object): this;
  }

  export class NavigationControl {
    constructor(options?: { showCompass?: boolean; showZoom?: boolean });
  }

  export class Marker {
    constructor(options?: { element?: HTMLElement; color?: string });
    setLngLat(lngLat: [number, number]): this;
    addTo(map: Map): this;
    remove(): void;
  }

  export class Popup {
    constructor(options?: { offset?: number; closeButton?: boolean });
    setLngLat(lngLat: [number, number]): this;
    setHTML(html: string): this;
    addTo(map: Map): this;
    remove(): void;
  }

  export class GeolocateControl {
    constructor(options?: { positionOptions?: any; trackUserLocation?: boolean });
  }
}
