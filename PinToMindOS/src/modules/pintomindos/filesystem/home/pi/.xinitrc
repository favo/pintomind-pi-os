#!/usr/bin/env bash
/home/pi/.adjust_video.sh
/home/pi/.fix_audio.sh
/home/pi/pintomind-player.AppImage &
exec metacity

