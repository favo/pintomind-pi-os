# Build instructions

## Requirements

- You need to install Docker, with Docker Compose

## Build

1. Clone this repository
2. Download the most recent version of Raspberry Pi OS Lite 64-bit from 
   [the Raspberry Pi Website](https://www.raspberrypi.com/software/operating-systems/). Save 
   the `.img.xz` file in the `PinToMindOS/src/image` directory without renaming it.
3. Run `docker-compose up -d` from the repository root directory.
4. Build the image with `docker exec -it customfavoos build`

The finished image is now placed in the `PinToMindOS/src/workspace` directory, and can 
be flashed to a Raspberry Pi as-is.

