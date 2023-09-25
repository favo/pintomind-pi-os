# Hack to fix HDMI audio
# Gets the index of the HDMI audio device, and sets it as the default
# The HDMI audio device is called "MAI PCM i2s-hifi-0" in the list
HDMIDEV=$(pacmd list-sinks | grep -e index -e "alsa.name = \"MAI" | grep MAI -B1 | head -n1 | cut -d " " -f6)
pactl set-default-sink $HDMIDEV

