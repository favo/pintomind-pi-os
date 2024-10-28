ROTATION=$(cat /home/pi/rotation)
RESOLUTION=$(cat /home/pi/resolution)
OUTPUT_DISPLAY=$(xrandr | grep " connected" | awk '{ print $1 }' | head -n1)
sudo xrandr --output $OUTPUT_DISPLAY --rotate $ROTATION --mode $RESOLUTION