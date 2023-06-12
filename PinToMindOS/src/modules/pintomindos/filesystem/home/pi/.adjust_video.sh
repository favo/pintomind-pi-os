ROTATION=$(cat /home/pi/rotation)
OUTPUT_DISPLAY=$(xrandr | grep " connected" | awk '{ print $1 }' | head -n1)
sudo xrandr --output $OUTPUT_DISPLAY --rotate $ROTATION --mode 1920x1080

