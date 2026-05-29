# Tribu Asistente

App estática para GitHub Pages donde un invitado puede ver datos de pago y avisar que pagó.

No usa backend propio. Se comunica con Google Apps Script usando JSONP porque GitHub Pages es estático y Apps Script puede tener restricciones CORS con `fetch`.

## Configuración

En `app.js`:

```js
const APPS_SCRIPT_BASE_URL = 'https://script.google.com/macros/s/MI_WEB_APP_ID/exec';
const DEFAULT_EVENT_ID = '';
```

## URL de uso

```text
https://USUARIO.github.io/tribu-asistente/?eventId=EVENT_ID&token=TOKEN
```

## Publicar en GitHub Pages

1. Crear repositorio `tribu-asistente`.
2. Subir `index.html`, `styles.css`, `app.js`, `README.md`.
3. Ir a `Settings > Pages`.
4. Seleccionar `Deploy from branch`.
5. Branch `main`.
6. Folder `/root`.
7. Guardar.

## Flujo

1. La app pide datos públicos con `action=infoPago`.
2. El invitado completa referencia/comprobante.
3. La app envía `action=registrarPago`.
4. Apps Script marca `Estado de pago = avisado`.
5. Producción confirma o rechaza desde el panel.
