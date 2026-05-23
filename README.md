# AI Image Editor for Penpot

A simple Penpot addon that uses the OpenAI API to edit images directly from your canvas.

## Features

- **API URL Configuration**: Set custom OpenAI-compatible API endpoints
- **API Key Authentication**: Securely enter your API key
- **Natural Language Editing**: Describe how you want to edit the image in plain text

## Requirements

- Penpot desktop app or self-hosted instance with addon support
- OpenAI API key (or compatible API)
- An image selected on the canvas

## Installation

1. Clone or download this repository
2. In Penpot, go to **Addons** → **Manage Addons**
3. Click **Load Unpacked Addon**
4. Select the folder containing this addon

## Usage

1. **Select an image** on your Penpot canvas
2. Go to **Plugins** → **Edit Image with AI**
3. Enter your **API URL** (default: `https://api.openai.com/v1`)
4. Enter your **API Key**
5. Type your **edit instructions** (e.g., "make it brighter", "add a blue tint", "increase contrast")
6. Click **Edit Image**
7. Wait for the AI to process and replace the image on the canvas

## How It Works

1. The addon exports your selected image as a PNG
2. Sends it to the OpenAI Images API (`/images/edits` endpoint)
3. Downloads the edited image
4. Replaces the original image on the canvas at the same position

## Configuration

### API URL
Default: `https://api.openai.com/v1`

You can change this to use:
- OpenAI's official API
- Azure OpenAI Service
- Other OpenAI-compatible APIs

### API Key
Your secret API key from OpenAI or compatible provider. This is not stored and must be entered each session.

### Edit Instructions
Be specific about what changes you want:
- "Make the colors more vibrant"
- "Convert to black and white"
- "Add a warm filter"
- "Increase brightness by 20%"

## Development

### Project Structure

```
├── manifest.json      # Addon metadata and permissions
├── package.json       # Node.js package configuration
├── src/
│   └── index.js       # Main addon code
└── README.md          # This file
```

### Testing

1. Make changes to `src/index.js`
2. Reload the addon in Penpot (Addons → Manage Addons → Reload)
3. Test with a sample image

## Troubleshooting

### "No image selected"
Make sure you have an image (not a shape or text) selected on the canvas.

### "API request failed"
- Check that your API key is correct
- Verify the API URL is valid
- Ensure you have sufficient API credits

### "No image returned from API"
The API may have rejected your request. Check the status message for details.

## Security Notes

- Your API key is never stored or transmitted anywhere except to the API endpoint you specify
- This addon runs entirely within Penpot's sandboxed environment
- Always keep your API key secure and never share it

## License

MIT License - feel free to modify and distribute.

## Support

For issues or feature requests, please open an issue on the repository.
