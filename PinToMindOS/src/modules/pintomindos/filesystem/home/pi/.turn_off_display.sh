    OUTPUT_DISPLAY=$(xrandr | grep " connected" | awk '{ print $1 }' | head -n1)
    sudo xrandr --display :0 --output $OUTPUT_DISPLAY --off