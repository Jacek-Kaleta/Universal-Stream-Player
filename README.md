# Universal Stream Player (USP)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![JavaScript](https://img.shields.io/badge/javascript-ES6%2B-yellow.svg)
![HLS.js](https://img.shields.io/badge/HLS.js-supported-orange.svg)

**Universal Stream Player** to lekki, elastyczny i bezarchitektoniczny (Vanilla JS) odtwarzacz multimedialny. Umożliwia jednolitą obsługę strumieni HLS (`.m3u8`), bezpośrednich plików wideo (`.mp4`), odtwarzania audio (`.mp3`) oraz materiałów z serwisu YouTube (zarówno wideo, jak i dedykowanego trybu audio).

---

## 🚀 Główne funkcje

* **Uniwersalna obsługa źródeł**: HLS (m3u8 Live/VOD), pliki bezpośrednie MP4, strumienie i pliki audio MP3, YouTube (Live, VOD, tryb audio).
* **Dedykowany tryb Audio**: Dedykowany interfejs z nakładką wizualną dla stacji radiowych, podcastów i audycji.
* **Automatyczna obsługa okładek i logotypów**: Wsparcie dla zewnętrznych adresów URL, automatycznych miniatur z YouTube oraz wbudowany parser odnośników z **Wikipedii / Wikimedia Commons**.
* **Dynamiczne tła w trybie Audio**: Możliwość zdefiniowania osobnych kolorów tła dla stanu odtwarzania (`online`), pauzy (`offline`) oraz domyślnego.
* **Zaawansowana analityka bufora**: Wyliczanie w czasie rzeczywistym zbuforowanego materiału w sekundach oraz megabajtach (MB).
* **Auto-ukrywanie sterowania**: Pasek kontrolny automatycznie ukrywa się przy braku ruchu myszy lub braku dotyku.
* **Czas startu**: Możliwość rozpoczęcia odtwarzania od dowolnie wybranej sekundy (`startTime`).
* **Brak ciężkich zależności**: Wymaga jedynie biblioteki `hls.js` dla obsługi strumieni HLS (skrypt YouTube IFrame API wstrzykiwany jest automatycznie).

---

## 🛠️ Instalacja i wymagania

Do poprawnego działania strumieni HLS należy dołączyć bibliotekę `hls.js`.

```html
<!-- Biblioteka hls.js (wymagana dla strumieni HLS .m3u8) -->
<script src="[https://cdn.jsdelivr.net/npm/hls.js@latest](https://cdn.jsdelivr.net/npm/hls.js@latest)"></script>

```

---

## 💻 Szybki start

### 1. Struktura HTML

```html
<!-- Kontener odtwarzacza -->
<div id="player-container"></div>

```

### 2. Inicjalizacja w JS

```javascript
// Utworzenie instancji odtwarzacza
const player = new UniversalStreamPlayer('player-container', {
    onTimeUpdate: (data) => {
        console.log(`Czas: ${data.currentTime}s / ${data.duration}s | Bufor: ${data.bufferMB} MB`);
    },
    onVolumeChange: (volume) => {
        console.log(`Głośność: ${volume * 100}%`);
    }
});

// Pobranie publicznego API
const playerAPI = player.getAPI();

// Załadowanie strumienia
playerAPI.load({
    url: '[https://twoja-stacja.pl/stream.m3u8](https://twoja-stacja.pl/stream.m3u8)',
    type: 'hls',
    stationName: 'Moje Radio HD'
});

```

---

## 📖 Dokumentacja API

### `new UniversalStreamPlayer(containerId, options)`

Instancjonuje nowy odtwarzacz w wybranym elemencie DOM.

#### Argumenty:

* **`containerId`** (`string`) – ID elementu kontenera HTML.
* **`options`** (`PlayerOptions`, opcjonalnie):
* `onTimeUpdate` (`function(TimeUpdateData): void`) – Callback wywoływany przy każdej aktualizacji czasu i stanu bufora.
* `onVolumeChange` (`function(number): void`) – Callback wywoływany przy zmianie poziomu głośności (zakres `0.0` - `1.0`).



---

### Metoda `player.getAPI()`

Zwraca obiekt `PlayerAPI` zawierający publiczne metody sterujące:

| Metoda | Parametry | Opis |
| --- | --- | --- |
| `load(config)` | `StreamConfig` | Ładuje i uruchamia nowe źródło mediów. |
| `play()` | - | Rozpoczyna odtwarzanie. |
| `pause()` | - | Wstrzymuje odtwarzanie. |
| `togglePlay()` | - | Przełącza stan odtwarzania (Play / Pause). |
| `toggleFullscreen()` | - | Przełącza tryb pełnoekranowy kontenera. |
| `setNativeControls(enabled)` | `boolean` | Włącza lub wyłącza natywne kontrolki ekranowe. |
| `setVolume(value)` | `number | string` | Ustawia głośność z przedziału od `0.0` do `1.0`. |
| `toggleMute()` | - | Przełącza wyciszenie dźwięku. Zwraca nowy poziom głośności. |
| `getVolume()` | - | Zwraca aktualny poziom głośności (`0.0` - `1.0`). |
| `destroy()` | - | Zatrzymuje odtwarzanie, czyści instancje HLS/YT oraz zwalnia zasoby. |

---

### Konfiguracja strumienia (`StreamConfig`)

Obiekt przekazywany do metody `playerAPI.load(config)`:

```typescript
interface StreamConfig {
    url: string;                  // Adres URL (HLS, MP3, MP4 lub YouTube)
    type?: 'hls' | 'direct' | 'mp3' | 'mp4'; // Typ strumienia (opcjonalny, auto-detekcja)
    isAudioOnly?: boolean;        // Włącza dedykowany tryb audio
    startTime?: number;           // Czas startowy w sekundach
    stationName?: string;         // Nazwa stacji / utworu wyświetlana w trybie audio
    thumbnailUrl?: string;        // URL do pliku okładki/logotypu
    thumbnail?: string;           // Alternatywny klucz dla okładki
    showThumbnail?: boolean;      // Auto-generowanie miniatury dla filmów YouTube
    thumbnailFull?: boolean;      // Pokrycie całego tła okładką (object-fit: cover)
    bgColor?: string;             // Domyślny kolor tła nakładki audio
    bgColorOnline?: string;       // Kolor tła nakładki podczas odtwarzania
    bgColorOffline?: string;      // Kolor tła nakładki podczas pauzy
    borderRadius?: number | string; // Promień zaokrąglenia rogów kontenera (np. '12px' lub 12)
}

```

---

### Struktura danych zdarzenia czasu (`TimeUpdateData`)

Dane przekazywane do callbacku `onTimeUpdate` oraz w zdarzeniach DOM:

```typescript
interface TimeUpdateData {
    currentTime: number;     // Aktualny czas odtwarzania w sekundach
    duration: number;        // Całkowity czas materiału (NaN/Infinity dla strumieni Live)
    isLive: boolean;         // Czy strumień jest transmisją na żywo
    isReady: boolean;        // Czy metadane/odtwarzacz są gotowe
    bufferMB: number;        // Zbuforowane dane w megabajtach (MB)
    bufferSeconds: number;   // Długość bufora w sekundach od punktu odtwarzania
}

```

---

## 💡 Przykłady konfiguracji

```javascript
// 1. Strumień HLS Na Żywo (Wideo)
playerAPI.load({
    url: '[https://domena.pl/live/stream.m3u8](https://domena.pl/live/stream.m3u8)',
    type: 'hls',
    stationName: 'Transmisja na żywo'
});

// 2. Radio internetowe MP3 z dynamicznym tłem i okładką z Wikipedii
playerAPI.load({
    url: '[https://stream.radio.pl/stacja.mp3](https://stream.radio.pl/stacja.mp3)',
    type: 'mp3',
    isAudioOnly: true,
    stationName: 'Radio Program 1',
    thumbnailUrl: '[https://pl.wikipedia.org/wiki/Plik:Logo_Stacji.svg](https://pl.wikipedia.org/wiki/Plik:Logo_Stacji.svg)',
    bgColorOnline: '#003a22',
    bgColorOffline: '#3a000e'
});

// 3. YouTube w trybie samych audycji audio
playerAPI.load({
    url: '[https://www.youtube.com/watch?v=BG3jYXnwMys](https://www.youtube.com/watch?v=BG3jYXnwMys)',
    isAudioOnly: true,
    showThumbnail: true,
    stationName: 'Podcast YouTube'
});

// 4. Plik MP4 odtworzony od 10. sekundy z zaokrąglonymi rogami
playerAPI.load({
    url: '[https://domena.pl/wideo.mp4](https://domena.pl/wideo.mp4)',
    type: 'mp4',
    startTime: 10,
    borderRadius: '16px'
});

```

---

## 📡 Zdarzenia DOM (Custom Events)

Odtwarzacz emituje natywne zdarzenia na elemencie kontenera:

* **`usp:timeupdate`** – Wywoływane przy zmianie czasu lub bufora.
* **`usp:volumechange`** – Wywoływane przy zmianie poziomu głośności.

```javascript
const container = document.getElementById('player-container');

container.addEventListener('usp:timeupdate', (e) => {
    console.log('Zdarzenie czasu:', e.detail);
});

container.addEventListener('usp:volumechange', (e) => {
    console.log('Zdarzenie głośności:', e.detail.volume);
});

```

---

## 📄 Licencja

Ten projekt jest udostępniany na licencji [MIT](https://www.google.com/search?q=LICENSE&utm_source=gemini).

```

```
