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

## Options and configuration
If you want a different splash screen, simply replace the splash.png in the 
`/PinToMindOS/src/modules/pintomindos/filesystem/home/pi` directory with your own. The
image should preferably have a 1920x1080 resolution.

To disable SSH, set the `BASE_SSH_ENABLE` variable to `no` in the 
`PinToMindOS/src/config` file.

## Problems
- If you get an error about `/distro/config` not found, try running `docker-compose down` 
  and then `docker-compose up -d` again. There seems to be some problem with volume mounts 
  after rebooting the host machine, but this should fix it.
- If you get an error about failing to detach a loop device, you can safely ignore it, and 
  just detach it manually with `sudo losetup -d /dev/loopX` (where X can be found by running 
  `losetup`). The image name will be incorrect if this happens, but the contents should be 
  correct.
- By default, the Docker-compose file uses the latest version of CustomPiOS. In case of errors, 
  you can try to use a specific version by changing the `image` line in the `docker-compose.yml` 
  file to a different version. We have included known good versions as comments, so you can try 
  to uncomment one of them if you have problems.

# Working with the image (for developers)
After flashing the Pi, you can access a terminal by pressing `Ctrl+Alt+F2`. You should 
get a fullscreen terminal that's automatically signed in to the `pi` user. The password 
for the `pi` user is `raspberry`. You can also connect over SSH, if you have enabled it.

## Accessing debug output from the pintomind-player app
The pintomind-player app prints some things to the console, but this can not be accessed 
directly from the app. Instead, we need to launch the app from a terminal. To do this, 
access a terminal on the Pi (either on the Pi or over SSH), and do the following: 

1. Install `xterm` with `sudo apt install xterm`
2. Modify the `.xinitrc` file with `nano /home/pi/.xinitrc`, and replace the 
   `/home/pi/pintomind-player.AppImage &` line with `xterm &`. Save the file.
3. Reboot the Pi, or run `killall xinit` to restart the X session. It should now 
   start with a small terminal instead of the player app. 
4. Launch the pintomind-player app from the new terminal: `./pintomind-player.AppImage`

You should now see the debug output from the app in the terminal. You might need to 
exit kiosk mode on the player by pressing `Ctrl+K` to see the terminal. `Alt+Tab` is 
supported for switching between the app and the terminal.

## Replacing the app while the Pi is running
If you want to replace the app while the Pi is running, you can use `scp` to copy a 
new build of the application. On your dev machine, cd to the electron-player directory, 
and build a new version of the app with `npm run dist`. 
Then, copy the new app to the Pi with `scp dist/pintomind-player.AppImage pi@<ip>:/home/pi/`.
If you receive an error that the file is busy: Run `killall xinit` on the Pi, and quickly 
try again. You can also disable automatic restarting of the X server (see below).

## Prevent the app from auto-starting
During development, it might be practical to manually start the X server instead of 
doing it automatically. To do this, edit the `.bashrc` file in `/home/pi/`, and comment 
out the last line. When needed, you can now start the X session with `startx`.


# How things work

## CustomPiOS
CustomPi OS takes a standard Raspberry Pi OS image, mounts it to a virtual device, emulates 
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

## Screen rotation and resolution
Before the app is started by the `.xinitrc` script, we call a custom script that reads a file 
titled `rotation`, and rotates the active display to match the value in the file. This allows 
us to rotate the screen by simply writing `normal`, `left`, `right` or `inverted` to the file.

