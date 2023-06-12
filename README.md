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

## Options
If you want a different splash screen, simply replace the splash.png in the 
`/PinToMindOS/src/modules/pintomindos/filesystem/home/pi` directory with your own. The
image should preferably have a 1920x1080 resolution.

## Problems
- If you get an error about `/distro/config` not found, try running `docker-compose down` 
  and then `docker-compose up -d` again. There seems to be some problem with volume mounts 
  after rebooting the host machine, but this should fix it.
- If you get an error about failing to detach a loop device, you can safely ignore it, and 
  just detach it manually with `sudo losetup -d /dev/loopX` (where X can be found by running 
  `losetup`). The image name will be incorrect if this happens, but the contents should be 
  correct.


# How things work

## CustomPiOS
CustomPi OStakes a standard Raspberry Pi OS image, mounts it to a virtual device, emulates 
a Raspberry Pi using QEMU, and executes commands until the image has the contents it should 
have. This could include installing packages, copying files, or running scripts. CustomPiOS 
uses modules to define what should be done to the image, and a shared config file to define 
variables and modules to use. We use a custom module, `pintomindos`, to install a minimal 
desktop environment, perform some configuration, and add the pintomind-player Electron app.

Each module contains several files, but the most important one is `start_chroot_script`, which 
is a shell script that is executed once during build. The script is ran in a context as if it 
was on the Pi, so running `apt install sl` will install the `sl` package on the image. This 
allows us to set up everything we need in a simple script. In addition, the module has a 
`filesystem` folder, which contains files that will be copied into the image.

## Automatic app startup
We do this by directly modifying the script responsible for starting the console environment. 
We change the `getty` call to automatically sign in as the `pi` user on boot. Once signed in, 
we have added a statement to the user's `.bashrc` file that starts the desktop environment if 
a display is connected, and the desktop environment has not already been started. 

We have created a `.xinitrc` file which defines what the desktop environment should do when 
started. Ours only starts a minimal window manager (`metacity`, required by most apps), and 
launches the `pintomind-player` app.

## Automatic system updates
We use the `unattended-upgrades` package to automatically install updates. This is configured 
by the `start_chroot_script` file of the `pintomindos` module, and contains some fixes that 
were required to make the module work on Raspberry Pi OS.

## Screen rotation and resolution
Before the app is started by the `.xinitrc` script, we call a custom script that reads a file 
titled `rotation`, and rotates the active display to match the value in the file. This allows 
us to rotate the screen by simply writing `normal`, `left`, `right` or `inverted` to the file.

