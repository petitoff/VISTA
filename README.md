# VISTA (Video Dataset Browser)

VISTA is a high-performance web application designed for browsing, searching, and previewing large video datasets stored locally or on network shares. It provides a seamless experience for ML engineers and researchers to explore their data.

## Key Features

### 📂 Dataset Exploration

- **File Explorer**: Browse local video directories with a clean grid interface.
- **Smart Breadcrumbs**: Easy navigation through deep folder structures.
- **Efficient Pagination**: Handles thousands of files with smooth loading (50 items per page by default).
- **Instant Thumbnails**: Automatically generated frames for quick visual identification.

### 🎬 Advanced Video Playback

- **On-the-fly Transcoding**: Automatic conversion of non-browser-native formats (e.g., specific MKV/AVI/H.265 codecs) to H.264 using FFmpeg.
- **Native Streaming**: Supports Range Requests and seeking for browser-compatible formats.
- **Rich Metadata**: View resolution, FPS, duration, file size, and codec information.
- **Path Sharing**: One-click copying of file paths (including host paths) for research scripts.

### 🔍 Search & Discovery

- **Global Search**: Find recordings across the entire dataset by filename instantly.
- **Real-time Results**: Search results show the full directory context for each match.

### 🛠️ Backend Features

- **Intelligent Caching**: Automated thumbnail generation and cleanup to optimize disk usage.
- **System Monitoring**: Live stats on cache usage and storage status.
- **Containerized**: Fully Dockerized for easy deployment and consistent environments.

## Tech Stack

- **Frontend**: SolidJS
- **Backend**: NestJS (Node.js) + FFmpeg
- **Cache**: Local filesystem caching for thumbnails
- **Deployment**: Docker Compose
