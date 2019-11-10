# Plexbot

![Docker Cloud Build Status](https://img.shields.io/docker/cloud/build/mikeporterdev/plexbot)

A simple discord bot that will allow users to trigger Sonarr to redownload particular episodes, in case of a bad 
download.

### Usage
`plexbot redownload show,<Show Name>,<Season Episode Number>`

Episode should be in the format S01E01

### Installation
Run with docker-compose:
```
version: '2'
services:
    plexbot:
        image: mikeporterdev/plexbot
        environment:
            - SONARR_URL=${SONARR_URL}
            - SONARR_API_KEY=${SONARR_KEY}
            - DISCORD_KEY=${DISCORD_KEY}
```
