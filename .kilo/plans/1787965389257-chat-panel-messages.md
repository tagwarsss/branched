# Chat Panel Message List Plan

## Goal
Show all Supabase messages in the chat panel as chat bubbles with name and message, refreshed via the existing 5s polling. Panel has a fixed larger height with scroll.

## Current State
- `pollMessages()` fetches only new rows (id > lastMessageId) for background text
- Chat panel has `chat-messages` div for displaying messages
- No message history shown in the panel currently
- Current panel max-height is 600px, messages area max-height is 280px

## Implementation Steps

### 1. Add `refreshChatPanel()` function
Create a new function that:
- Fetches ALL messages from Supabase: `select=name,message&order=id.asc`
- Clears and rebuilds the `chat-messages` div
- Each message renders as a chat bubble with name and message:
  ```html
  <div class="chat-message received">
    <span class="msg-name">iane:</span>
    <span class="msg-text">congrats</span>
  </div>
  ```

### 2. Update `pollMessages()` function
- Add `refreshChatPanel()` call at the end of the existing polling function
- This ensures the panel updates every 5s alongside background text

### 3. Call on panel open
- In `toggleChat()`, when opening the panel, call `refreshChatPanel()`
- This ensures messages show immediately when opening

### 4. CSS Updates
- Increase `.chat-messages` max-height from 280px to 400px (larger message area)
- Add `.msg-name` styling: bold, white color
- Add `.msg-text` styling: light color
- Keep existing `.chat-message.received` bubble styling

### 5. HTML (no changes needed)
- Existing structure already has `chat-messages` div inside the panel

## Files to Modify
- `index.js` - Add `refreshChatPanel()` function and integrate with polling
- `index.css` - Update chat messages height and add name/text styling

## Validation
- Open panel → messages appear immediately as bubbles
- Every 5s → new messages appear without refresh
- Send message → panel closes, heart shows, next poll updates list
- Panel shows all messages with name: message format in bubbles
