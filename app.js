document.addEventListener("DOMContentLoaded", () => {

  // ====== 1) MAPA BASE ======
  const map = L.map("map").setView([25.4232, -101.0053], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);

  setTimeout(() => map.invalidateSize(), 200);

  let marker = L.marker([25.4232, -101.0053]).addTo(map)
    .bindPopup("Ubicación inicial (ejemplo)")
    .openPopup();

  const info = document.getElementById("infoUbicacion");
  const select = document.getElementById("tipoUbicacion");
  const btnIr = document.getElementById("btnIr");

  const ejemplos = {
    coordenadas: {
      titulo: "Coordenadas (Lat/Lng)",
      lat: 25.4232,
      lng: -101.0053,
      texto: "Ejemplo por coordenadas: Saltillo, Coahuila"
    },
    direccion: {
      titulo: "Dirección (convertida a coordenadas con Nominatim)",
      query: "Zócalo, Ciudad de México",
      texto: "Ejemplo: Dirección escrita -> se convierte a Lat/Lng usando Nominatim (OSM)"
    },
    ciudad: {
      titulo: "Ciudad/Región (convertida a coordenadas con Nominatim)",
      query: "Monterrey, Nuevo León",
      texto: "Ejemplo: ciudad/región -> se convierte a Lat/Lng usando Nominatim (OSM)"
    },
    "punto-interes": {
      titulo: "Punto de interés (convertido a coordenadas con Nominatim)",
      query: "Museo del Desierto, Saltillo",
      texto: "Ejemplo: punto de interés -> se convierte a Lat/Lng usando Nominatim (OSM)"
    }
  };

  function setMapLocation(lat, lng, popupText) {
    map.setView([lat, lng], 15);
    if (marker) marker.remove();
    marker = L.marker([lat, lng]).addTo(map).bindPopup(popupText).openPopup();
  }

  async function geocodeWithNominatim(query) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;

    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!res.ok) throw new Error("No se pudo consultar el servicio de geocodificación.");

    const data = await res.json();
    if (!data.length) throw new Error("No se encontraron resultados para la búsqueda.");

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      display: data[0].display_name
    };
  }

  function showInfo(obj) {
    info.textContent =
`Tipo: ${obj.titulo}
Descripción: ${obj.texto || ""}
Latitud: ${obj.lat ?? "—"}
Longitud: ${obj.lng ?? "—"}
Detalles: ${obj.detalles ?? "—"}
`;
  }

  btnIr.addEventListener("click", async () => {
    const tipo = select.value;

    try {
      if (tipo === "usuario") {
        info.textContent = "Solicitando permiso de ubicación del navegador...";

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            const obj = {
              titulo: "Mi ubicación (GPS del navegador)",
              texto: "Ubicación obtenida con la API de Geolocation del navegador.",
              lat,
              lng,
              detalles: `Precisión aproximada: ${pos.coords.accuracy} metros`
            };

            showInfo(obj);
            setMapLocation(lat, lng, "Tu ubicación actual");
          },
          (err) => {
            info.textContent =
              "No se pudo obtener tu ubicación. Asegúrate de permitir el acceso al GPS.\n" +
              `Error: ${err.message}`;
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
        return;
      }

      if (tipo === "coordenadas") {
        const ex = ejemplos.coordenadas;
        showInfo(ex);
        setMapLocation(ex.lat, ex.lng, ex.texto);
        return;
      }

      const ex = ejemplos[tipo];
      info.textContent = `Buscando: ${ex.query} ...`;

      const geo = await geocodeWithNominatim(ex.query);

      const obj = {
        titulo: ex.titulo,
        texto: ex.texto,
        lat: geo.lat,
        lng: geo.lng,
        detalles: geo.display
      };

      showInfo(obj);
      setMapLocation(obj.lat, obj.lng, obj.detalles);

    } catch (e) {
      info.textContent = "Error: " + e.message;
    }
  });

});

