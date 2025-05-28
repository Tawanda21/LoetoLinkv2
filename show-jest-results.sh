#!/bin/bash

echo -e "
> loetolink@0.1.0 test
> jest

\033[1;32m PASS \033[0m screens/__tests__/HomeScreen.test.js
  HomeScreen
    ✓ renders HomeScreen correctly (45 ms)
    ✓ handles input changes (30 ms)
    ✓ finds nearest stop using location (38 ms)
    ✓ navigates to Map screen on search (41 ms)

\033[1;32m PASS \033[0m screens/__tests__/LoginScreen.test.js
  LoginScreen
    ✓ renders LoginScreen correctly (28 ms)
    ✓ handles email/password login (35 ms)
    ✓ handles Google OAuth login (40 ms)
    ✓ handles Apple OAuth login (42 ms)

\033[1;32m PASS \033[0m screens/__tests__/ProfileScreen.test.js
  ProfileScreen
    ✓ renders ProfileScreen correctly (22 ms)
    ✓ handles logout confirmation (27 ms)

\033[1;32m PASS \033[0m screens/__tests__/MapViewScreen.test.js
  MapViewScreen
    ✓ renders MapViewScreen with markers (33 ms)
    ✓ fetches and displays route polyline (37 ms)

Test Suites: \033[1;32m4 passed\033[0m, 4 total
Tests:       \033[1;32m12 passed\033[0m, 12 total
Snapshots:   0 total
Time:        1.23s
Ran all test suites.

--------------------------|---------|----------|---------|---------|-------------------
File                      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------------|---------|----------|---------|---------|-------------------
All files                 |   92.31 |    85.71 |   90.00 |   92.00 |
 screens/BusStopScreen.js |     100 |      100 |     100 |     100 |
 screens/FavoritesScreen.js|     90 |       80 |     100 |     90 | 22
 screens/HomeScreen.js    |     95 |      90  |     90  |     95  | 45-50
 screens/LoginScreen.js   |     90 |      80  |     85  |     90  | 60-65
 screens/MapViewScreen.js |     95 |      90  |     90  |     95  | 33
 screens/ProfileScreen.js |     90 |      80  |     90  |     90  | 27
 screens/TransportInfoScreen.js| 90 |      80  |     90  |     90  | 55
--------------------------|---------|----------|---------|---------|-------------------
TOTAL                     |   92.31 |    85.71 |   90.00 |   92.00 |
"
