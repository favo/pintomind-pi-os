# Build instructions

## Requirements

- You need to install Docker, with Docker Compose

## Build

1. Clone this repository
2. Download the most recent version of Raspberry Pi OS Lite 64-bit from 
   [the Raspberry Pi Website](https://www.raspberrypi.com/software/operating-systems/). Save 
   the `.img.xz` file in the `PinToMindOS/src/image` directory without renaming it.
3. Place a copy of `pintomind-player.AppImage` in the 
   `PinToMindOS/src/modules/pintomindos/filesystem/home/pi` directory.
4. Run `docker-compose up -d` from the repository root directory.
5. Build the image with `docker exec -it customfavoos build`

The finished image is now placed in the `PinToMindOS/src/workspace` directory, and can 
be flashed to a Raspberry Pi as-is.

## Problems
- If you get an error about `/distro/config` not found, try running `docker-compose down` 
  and then `docker-compose up -d` again. There seems to be some problem with volume mounts 
  after rebooting the host machine, but this should fix it.
- If you get an error about failing to detach a loop device, you can safely ignore it, and 
  just detach it manually with `sudo losetup -d /dev/loopX` (where X can be found by running 
  `losetup`). The image name will be incorrect if this happens, but the contents should be 
  correct.

