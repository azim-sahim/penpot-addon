// Penpot Addon: AI Image Editor
// This addon uses the OpenAI API to edit images

const API_URL_DEFAULT = 'https://api.openai.com/v1';
const PANEL_WIDTH = 320;
const PANEL_HEIGHT = 420;

/**
 * Opens the AI Image Editor panel
 */
export function showPanel() {
  const panel = penpot.ui.open('AI Image Editor', `
    <div style="padding: 16px; font-family: system-ui, -apple-system, sans-serif;">
      <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #333;">AI Image Editor</h2>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; font-size: 13px; font-weight: 500; color: #555;">API URL</label>
        <input type="text" id="apiUrl" value="${API_URL_DEFAULT}" 
          style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; box-sizing: border-box;"
          placeholder="https://api.openai.com/v1">
      </div>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; font-size: 13px; font-weight: 500; color: #555;">API Key</label>
        <input type="password" id="apiKey" 
          style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; box-sizing: border-box;"
          placeholder="sk-...">
      </div>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; font-size: 13px; font-weight: 500; color: #555;">Edit Instructions</label>
        <textarea id="prompt" rows="4" 
          style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; box-sizing: border-box; resize: vertical;"
          placeholder="Describe how you want to edit the image (e.g., 'make it brighter', 'add a blue tint')..."></textarea>
      </div>
      
      <button id="editBtn" 
        style="width: 100%; padding: 10px; background: #5c6bc0; color: white; border: none; border-radius: 4px; font-size: 14px; font-weight: 500; cursor: pointer;">
        Edit Image
      </button>
      
      <div id="status" style="margin-top: 12px; font-size: 13px; color: #666;"></div>
      
      <script>
        // Listen for status updates from parent
        window.addEventListener('message', function(event) {
          if (event.data && event.data.type === 'update-status') {
            const statusEl = document.getElementById('status');
            statusEl.textContent = event.data.text;
            statusEl.style.color = event.data.color;
          }
        });
        
        document.getElementById('editBtn').addEventListener('click', function() {
          const apiUrl = document.getElementById('apiUrl').value;
          const apiKey = document.getElementById('apiKey').value;
          const prompt = document.getElementById('prompt').value;
          
          // Send message to parent using Penpot API
          penpot.ui.sendMessage({
            type: 'edit-image',
            data: { apiUrl, apiKey, prompt }
          });
        });
      </script>
    </div>
  `, PANEL_WIDTH, PANEL_HEIGHT);

  // Listen for messages from the panel
  panel.onmessage = (event) => {
    if (event.data && event.data.type === 'edit-image') {
      editImage(event.data.apiUrl, event.data.apiKey, event.data.prompt);
    }
  };
}

/**
 * Gets the selected image from the canvas
 */
async function getImageFromSelection() {
  const selection = penpot.selection.items;
  
  if (!selection || selection.length === 0) {
    throw new Error('No image selected. Please select an image first.');
  }
  
  const selectedItem = selection[0];
  
  // Check if it's an image
  if (selectedItem.type !== 'image') {
    throw new Error('Selected item is not an image. Please select an image.');
  }
  
  // Get the image file
  const fileId = selectedItem.fileId;
  const imageId = selectedItem.id;
  
  // Export the image as blob
  const blob = await penpot.files.exportFile(fileId, imageId, 'png');
  return { blob, item: selectedItem };
}

/**
 * Edits an image using the OpenAI API
 */
async function editImage(apiUrl, apiKey, prompt) {
  try {
    if (!apiKey) {
      penpot.ui.sendMessage({ type: 'update-status', text: 'Please enter your API key', color: '#f44336' });
      return;
    }
    
    if (!prompt) {
      penpot.ui.sendMessage({ type: 'update-status', text: 'Please enter edit instructions', color: '#f44336' });
      return;
    }
    
    penpot.ui.sendMessage({ type: 'update-status', text: 'Getting selected image...', color: '#666' });
    
    // Get the selected image
    const { blob, item } = await getImageFromSelection();
    
    penpot.ui.sendMessage({ type: 'update-status', text: 'Sending to AI...', color: '#666' });
    
    // Convert blob to base64
    const base64Image = await blobToBase64(blob);
    
    // Call OpenAI API
    const response = await fetch(`${apiUrl}/images/edits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: createFormData(base64Image, prompt)
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `API request failed (${response.status})`);
    }
    
    const result = await response.json();
    
    if (!result.data || !result.data[0] || !result.data[0].url) {
      throw new Error('No image returned from API');
    }
    
    penpot.ui.sendMessage({ type: 'update-status', text: 'Downloading edited image...', color: '#666' });
    
    // Download the edited image
    const editedImageUrl = result.data[0].url;
    const editedResponse = await fetch(editedImageUrl);
    const editedBlob = await editedResponse.blob();
    
    penpot.ui.sendMessage({ type: 'update-status', text: 'Replacing image in canvas...', color: '#666' });
    
    // Create a new file from the edited image
    const file = new File([editedBlob], 'edited-image.png', { type: 'image/png' });
    
    // Import the edited image into Penpot
    const importedImage = await penpot.files.importFile(file);
    
    // Replace the original image with the edited one
    const parent = item.parent;
    const x = item.x;
    const y = item.y;
    const width = item.width;
    const height = item.height;
    
    // Remove the old image
    item.remove();
    
    // Place the new image at the same position and size
    importedImage.x = x;
    importedImage.y = y;
    importedImage.width = width;
    importedImage.height = height;
    parent.appendChild(importedImage);
    
    penpot.ui.sendMessage({ type: 'update-status', text: '✓ Image edited successfully!', color: '#4caf50' });
    
  } catch (error) {
    console.error('Error editing image:', error);
    penpot.ui.sendMessage({ type: 'update-status', text: `✗ Error: ${error.message}`, color: '#f44336' });
  }
}

/**
 * Creates form data for the OpenAI API request
 */
function createFormData(base64Image, prompt) {
  // Convert base64 to blob
  const byteCharacters = atob(base64Image.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'image/png' });
  
  const formData = new FormData();
  formData.append('image', blob, 'image.png');
  formData.append('prompt', prompt);
  formData.append('n', '1');
  formData.append('size', '1024x1024');
  
  return formData;
}

/**
 * Converts a blob to base64 string
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Register the addon command
penpot.commands.register('Edit Image with AI', () => {
  showPanel();
});
