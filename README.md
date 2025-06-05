# 🚍 LoetoLink

LoetoLink is a React Native (Expo) application that simplifies public transportation by offering route discovery, navigation, and personalized favorites. It integrates real-time data using the **Google Maps API** and secure backend services via **Supabase**.

---

## 📱 Features

- 🔐 **Authentication**: Email, Google, and Apple login with Supabase Auth
- 🗺️ **Route Navigation**: Calculates and displays public transport routes with ETA
- 📍 **Live Map View**: Visualize routes, stops, and current location with interactive tools
- ⭐ **Favorites**: Save frequently used routes for quick access
- 🛑 **Bus Stop Browser**: View all routes and their stops in a searchable interface
- 🔁 **Recent Routes**: Reuse your last 5 viewed routes instantly

---

## 🧱 Tech Stack

- **Frontend**: React Native (Expo)
- **Backend**: Supabase (Database + Auth)
- **Maps**: Google Maps Directions API
- **State Management**: React Context API
- **Storage**: AsyncStorage (Recent Routes)

---

## 🛠️ Installation

1. Clone the repo:

```bash
git clone https://github.com/Tawanda21/LoetoLinkv2.git
cd LoetoLinkv2
````

2. Install dependencies:

```bash
npm install
```

3. Set up API keys:

* Replace Google Maps API key and Supabase credentials in `app.json` or environment config.

4. Run the project:

```bash
npx expo start
```

---

## 📁 Folder Structure

```bash
/
├── App.js
├── AppNavigator.js
├── screens/
│   ├── HomeScreen.js
│   ├── MapViewScreen.js
│   ├── BusStopScreen.js
│   ├── FavoritesScreen.js
│   └── ProfileScreen.js
├── supabase.js
├── FavoriteContext.js
└── utils.js
```

---

## 🚦 Data Flow

1. **User Login** → Supabase Auth validates identity
2. **Select Route** → Fetches from/to stops from Supabase
3. **Get Directions** → Calls Google Maps API for route & ETA
4. **View Map** → Route polyline + ETA rendered in `MapViewScreen`
5. **Favorite Route** → Insert/remove in Supabase
6. **Access Bus Routes** → Browse via `BusStopScreen`
7. **Manage Favorites** → Add/remove/view from `FavoritesScreen`

---

## 🌐 API Usage

### Supabase

* Tables:

  * `combi_routes`: Stores all available routes
  * `stops`: All stops per route
  * `user_favorite_routes`: Tracks user favorites
* Role-based access and row-level security (RLS) are enforced.

### Google Maps

* **Directions API**: Retrieves polyline & ETAs
* Used in both Home and MapView screens

---

## 📊 UI & UX

* Themed with consistent primary colors (e.g., `#018abe`)
* Interactive map tools (zoom, traffic overlay, toggle map types)
* Expandable cards and animated bottom sheets
* Responsive layout using Flexbox

---

## 🔐 Security

* **API Keys**: Store securely, avoid hardcoding in production
* **Supabase**: Enforces RLS for user-specific actions
* **Error Handling**: All async ops use try/catch with alerts and loading indicators

---

## 🔄 Future Improvements

* Offline route caching
* Real-time bus location tracking
* Multi-language support
* Admin dashboard for adding/editing routes

---

## 🧪 Testing

Run tests using:

```bash
./show-jest-results.sh
```

Jest tests cover core screens and business logic.

---

## 🙋‍♂️ Author

**LoetoLink Team**
[GitHub](https://github.com/Tawanda21)
[GitHub](https://github.com/cse23-102)

---

## 📚 References

* [Supabase Docs](https://supabase.com/docs)
* [Google Maps API](https://developers.google.com/maps/documentation/directions/overview)
* [React Native Maps](https://github.com/react-native-maps/react-native-maps)
* [Expo](https://docs.expo.dev/)

---
