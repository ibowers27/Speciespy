# Speciespy: Species Identification Mobile App

A species identification app built with React Native, Expo, and Firebase (BaaS). The app allows users to photograph a species, recieve an automated identification through a dual-API pipeline (Pl@ntNet and AnimalDetect), and share observations with the community through an interactive map view, list view, and threaded discussion system with a regional focus in Sarasota, FL.

#### Undergraduate Thesis by Ivy Bowers with an objective to brdige the gap between large-scale citizen science observation platforms and local communities.

## Features

- **Firebase User Authentication**: Logging in, signing up, and logging out with Firebase Auth.
- **Quickstart/Dashboard**: A homescreen depending on auth state: 3 step guide including sign up link or user statistics and quicklink dashboard.
- **Map View**: A map centered on Sarasota with green pins marking nearby observation posts.
- **List View**: A list of recent posts with a preview photo, identification, owner of the post, and comment/like counts.
- **Discussion Threads**: Accessed from pins or list items, opening a discussion page for each post. View photo, identification, poster, confidence score of identification, and the comment section.
- **Camera/Identification**: Accesses device camera and gps system to take a photo, identify the species, and create post.
- **Tabular Navigation**: Main navigation system is 3 tabs at the bottom of the screen "Home," "Explore," "Identify."
- **Light/Dark Mode**: Access device light or darkmode preference to automatically switch between light or dark theme.

## Tech Stack

- **React Native**
- **Expo**
- **Firebase Authentication**
- **Firebase Firestore**
- **Firebase Cloud Storage**
- **Pl@ntNet API**
- **Animal Detect API**
-  **Animal Detect API**
-  **Expo Go**

<img width="724" height="502" alt="Screenshot 2026-04-22 122208" src="https://github.com/user-attachments/assets/8a7f3c76-7205-47dd-94af-96ebcb346b1f" />

## System Architecture
<img width="827" height="653" alt="Screenshot 2026-04-22 122514" src="https://github.com/user-attachments/assets/aabc0ab1-197d-4089-bef7-98e165ec4f33" />

## Firestore Database Collections
<img width="658" height="363" alt="Screenshot 2026-04-22 122532" src="https://github.com/user-attachments/assets/1fc433b3-7e5c-4e85-a3c9-0087a32d4904" />

## API Pipeline
<img width="605" height="729" alt="Screenshot 2026-04-22 122558" src="https://github.com/user-attachments/assets/8bc917e8-b951-4030-a97a-d5cf1a0d7e07" />

## State Diagram
<img width="1500" height="2000" alt="UML state diagram - Thesis" src="https://github.com/user-attachments/assets/c4e7101f-f3c9-4eeb-b5ff-09369568e551" />


## Project Structure

```
Speciespy/
├── species-identification-app/
│   ├── app/                         # react native & expo app
│   │   ├── (tabs)/                  # tab navigation
│   │   │   ├── explore/             # explore tab
│   │   │   │   ├── explore.tsx/     # Map view of all users' posts
│   │   │   │   ├── listview.tsx/    #
│   │   │   │   ├── discussion.tsx/  # Discussion threads under each post
│   │   │   │   └── _layout.tsx/     # Stacks screens in Explore tab
│   │   │   ├── index.tsx/           # Homescreen: quickstart guide or user dashboard
│   │   │   ├── identify.tsx/        # Camera screen for species identification
│   │   │   └── _layout.tsx/         # Layout for stacking navigation tabs
│   │   ├── modal.tsx/               # Authentication modal
│   │   └── _layout.tsx/             # Root layout setting up navigation and theming
│   ├── assets                       # Contains 2 images: home page and app logo
│   ├── components                   # Contains components from the expo template used in Speciespy
│   ├── constants                    # Contains 1 file of constant colors to be applied to themes
│   ├── firebase                     # Contains fbauth and fbconfig for all Firebase functions
│   ├── hooks                        # Contains 1 hook useThemeColor assisting light/dark themes
│   ├── services                     # Contains 3 files for post, comment, and species services
│   ├── .env                         # API keys (.gitignored)
│   └── README.md               
```


## API Endpoints Used

- `POST https://my-api.plantnet.org/v2/identify/{project}`
- `POST https://www.animaldetect.com/api/v1/detect`

## Environment Variables

.env must be configured for:
- Firebase keys
- Pl@ntNet key
- Animal Detect key

## Quick Start

**Run server to Expo**:
   ```bash
   cd species-identification-app
   npx expo start
   ```
