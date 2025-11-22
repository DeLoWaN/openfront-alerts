# OpenFrontIO Audio Alerts

A userscript that adds configurable audio alerts to [OpenFrontIO](https://openfront.io/), a browser-based strategy game. Get notified with custom sounds when you're under attack, when nuclear weapons are launched, or when other critical events occur.

## Features

- 🔊 **Attack Alerts**: Get notified when you're being attacked by other players
- 💣 **Nuclear Launch Detection**: Audio alert when a nuclear weapon is launched
- ☢️ **Hydrogen Bomb Alerts**: Warning sound for hydrogen bomb attacks
- ⚓ **Naval Invasion Warnings**: Alert for incoming naval invasions
- 🎚️ **Per-Alert Volume Control**: Adjust volume independently for each alert type
- 🎵 **Custom Sound URLs**: Use your own sound files for each alert
- ⚙️ **Easy Settings UI**: Accessible settings panel with test and reset buttons
- 💾 **Persistent Configuration**: Settings are saved in browser localStorage

## Installation

### Prerequisites

You need a userscript manager extension installed in your browser:

- **Chrome/Edge**: [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- **Firefox**: [Tampermonkey](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) or [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)
- **Safari**: [Tampermonkey](https://apps.apple.com/us/app/tampermonkey/id1482490089)

### Steps

1. Install one of the userscript managers above
2. Open the userscript manager dashboard
3. Create a new script
4. Copy the entire contents of `openfrontio-audio-alerts.user.js`
5. Paste it into the editor and save
6. Navigate to [OpenFrontIO](https://openfront.io/)
7. Look for the 🔊 button on the left side of the screen to access settings

## Usage

### Accessing Settings

Click the **🔊** button on the left edge of your screen to open the Audio Alerts settings panel.

### Configuring Alerts

For each alert type (Attack, Nuclear Launch, Hydrogen Bomb, Naval Invasion):

1. **Sound URL**: Enter a URL to an audio file (MP3, OGG, WAV, etc.)
   - Default sounds are provided from Pixabay
   - You can use any publicly accessible audio URL
   - Test the sound using the **Test** button
   - Reset to default using the **Reset** button

2. **Volume**: Adjust the volume slider (0-100%) for each alert type

3. **Enable/Disable**: Toggle the main "Enabled" switch to turn all alerts on or off

4. **Save**: Click **Save** to apply your changes, or **Cancel** to discard them

### How Alerts Work

- **Attack Alerts**: Triggered when a new attacker starts attacking you (not continuously while under attack)
- **Nuclear Launch**: Detected when a nuclear weapon is launched against you
- **Hydrogen Bomb**: Triggered when a hydrogen bomb is incoming
- **Naval Invasion**: Alerted when a naval invasion is detected

## Technical Details

- **Version**: 1.2
- **Compatibility**: Works on `https://openfront.io/*` and `http://localhost:8080/*`
- **Storage**: Configuration is saved in `localStorage` under the key `ofio_audio_alerts_config`
- **Hooks**: The script hooks into `AlertFrame.prototype.tick` to monitor game events

## Default Sounds

The script comes with default sounds from Pixabay:

- **Attack**: Short alert sound
- **Nuclear Launch**: Explosive sound effect
- **Hydrogen Bomb**: Bomb impact sound
- **Naval Invasion**: Naval/boarding sound effect

You can replace these with any audio URL of your choice.

## Troubleshooting

### Sounds Not Playing

- Check that alerts are enabled in the settings
- Verify your browser allows autoplay (some browsers block autoplay by default)
- Ensure the sound URLs are accessible and in a supported format
- Check the browser console for any error messages

### Settings Button Not Appearing

- Make sure the userscript is installed and enabled
- Refresh the OpenFrontIO page
- Check that you're on a supported URL (`https://openfront.io/*`)

### Alerts Not Triggering

- Verify the game is loaded and you're logged in
- Check the browser console for any error messages (look for `[AudioAlerts]` logs)
- Ensure the script version is compatible with the current OpenFrontIO game version

## Development

The script uses vanilla JavaScript and doesn't require any build process. Simply edit `openfrontio-audio-alerts.user.js` and reload it in your userscript manager.

### Key Components

- **Configuration Management**: Loads/saves settings from localStorage
- **Audio Player**: Manages audio playback with volume control
- **UI Components**: Settings modal and floating button
- **Game Hooks**: Monitors game state through `AlertFrame.prototype.tick`

## License

This project is provided as-is for personal use.

## Contributing

Feel free to submit issues or pull requests if you'd like to improve the script!
