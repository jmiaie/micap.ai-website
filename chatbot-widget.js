/**
 * Micap AI Chatbot Widget - Updated with API Integration
 * Floating chat widget for website visitors with real message delivery
 */

(function() {
  // Create chatbot widget HTML
  const chatbotHTML = `
    <div id="micap-chatbot-widget" class="micap-chatbot-widget">
      <!-- Chat Toggle Button -->
      <button id="micap-chat-toggle" class="micap-chat-toggle" title="Chat with us">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span class="unread-badge" style="display:none;">1</span>
      </button>

      <!-- Chat Window -->
      <div id="micap-chat-window" class="micap-chat-window" style="display:none;">
        <div class="micap-chat-header">
          <div class="micap-chat-title">Micap AI Assistant</div>
          <button id="micap-chat-close" class="micap-chat-close" title="Close chat">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="1" y1="1" x2="19" y2="19"></line>
              <line x1="19" y1="1" x2="1" y2="19"></line>
            </svg>
          </button>
        </div>

        <div class="micap-chat-messages" id="micap-chat-messages">
          <div class="micap-message bot-message">
            <div class="micap-message-content">
              <p>Hi! 👋 I'm the Micap AI Assistant. How can I help you today?</p>
              <div class="micap-quick-replies">
                <button class="micap-quick-reply" onclick="sendMessage('Tell me about your services')">Services</button>
                <button class="micap-quick-reply" onclick="sendMessage('What is your pricing?')">Pricing</button>
                <button class="micap-quick-reply" onclick="sendMessage('Schedule a consultation')">Consultation</button>
              </div>
            </div>
          </div>
        </div>

        <div class="micap-chat-input-area">
          <input 
            type="text" 
            id="micap-chat-input" 
            class="micap-chat-input" 
            placeholder="Type your message..." 
            onkeypress="handleChatKeypress(event)"
          >
          <button id="micap-chat-send" class="micap-chat-send" onclick="sendChatMessage()" title="Send message">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,-0.8429026 C3.34915502,-1.1 2.40734225,-0.9429026 1.77946707,0.4429026 C0.994623095,1.22844 0.837654326,2.31778 1.15159189,3.10331 L3.03521743,9.54429026 C3.03521743,9.70139 3.19218622,9.85849 3.50612381,9.85849 L16.6915026,10.6439769 C16.6915026,10.6439769 17.1624089,10.6439769 17.1624089,10.1726849 L17.1624089,11.4582957 C17.1624089,12.0310806 16.6915026,12.4744748 16.6915026,12.4744748 Z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;

  // Create and inject styles
  const styles = `
    .micap-chatbot-widget {
      position: fixed;
      bottom: 24px;
      right: 24px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      z-index: 9999;
    }

    .micap-chat-toggle {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #BA7517 0%, #D4A574 100%);
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(186, 117, 23, 0.3);
      transition: all 0.3s ease;
      position: relative;
    }

    .micap-chat-toggle:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(186, 117, 23, 0.4);
    }

    .micap-chat-toggle:active {
      transform: scale(0.95);
    }

    .unread-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #FF4444;
      color: white;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      border: 2px solid white;
    }

    .micap-chat-window {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 380px;
      height: 600px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .micap-chat-header {
      background: linear-gradient(135deg, #BA7517 0%, #D4A574 100%);
      color: white;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }

    .micap-chat-title {
      font-weight: 600;
      font-size: 14px;
    }

    .micap-chat-close {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s;
    }

    .micap-chat-close:hover {
      opacity: 0.8;
    }

    .micap-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #F9F8F6;
    }

    .micap-message {
      display: flex;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .micap-message.bot-message {
      justify-content: flex-start;
    }

    .micap-message.user-message {
      justify-content: flex-end;
    }

    .micap-message-content {
      max-width: 80%;
      padding: 12px 14px;
      border-radius: 12px;
      font-size: 13px;
      line-height: 1.5;
    }

    .bot-message .micap-message-content {
      background: #E8DDD0;
      color: #1A1917;
    }

    .user-message .micap-message-content {
      background: #BA7517;
      color: white;
    }

    .micap-message-content p {
      margin: 0;
    }

    .micap-quick-replies {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 12px;
    }

    .micap-quick-reply {
      background: white;
      border: 1px solid #BA7517;
      color: #BA7517;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
    }

    .micap-quick-reply:hover {
      background: #BA7517;
      color: white;
    }

    .micap-chat-input-area {
      display: flex;
      gap: 8px;
      padding: 12px;
      background: white;
      border-top: 1px solid #E8DDD0;
      flex-shrink: 0;
    }

    .micap-chat-input {
      flex: 1;
      border: 1px solid #E8DDD0;
      border-radius: 6px;
      padding: 10px 12px;
      font-size: 13px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s;
    }

    .micap-chat-input:focus {
      border-color: #BA7517;
    }

    .micap-chat-send {
      background: #BA7517;
      color: white;
      border: none;
      border-radius: 6px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .micap-chat-send:hover {
      background: #D4A574;
    }

    .micap-chat-send:active {
      transform: scale(0.95);
    }

    /* Mobile responsive */
    @media (max-width: 480px) {
      .micap-chat-window {
        width: calc(100vw - 32px);
        height: 70vh;
        max-height: 500px;
      }
    }
  `;

  // Initialize chatbot when DOM is ready
  function initChatbot() {
    // Inject styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // Inject HTML
    const container = document.createElement('div');
    container.innerHTML = chatbotHTML;
    document.body.appendChild(container);

    // Setup event listeners
    const toggleBtn = document.getElementById('micap-chat-toggle');
    const closeBtn = document.getElementById('micap-chat-close');
    const chatWindow = document.getElementById('micap-chat-window');

    if (toggleBtn && closeBtn && chatWindow) {
      toggleBtn.addEventListener('click', function() {
        const isOpen = chatWindow.style.display !== 'none';
        chatWindow.style.display = isOpen ? 'none' : 'block';
        const badge = document.querySelector('.unread-badge');
        if (badge) badge.style.display = 'none';
      });

      closeBtn.addEventListener('click', function() {
        chatWindow.style.display = 'none';
      });
    }
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
  } else {
    initChatbot();
  }

  // Global functions for chat interaction
  window.sendChatMessage = function() {
    const input = document.getElementById('micap-chat-input');
    const message = input.value.trim();
    
    if (!message) return;

    // Add user message to chat
    addMessage(message, 'user');
    input.value = '';
    input.focus();

    // Get visitor info from localStorage or prompt
    let visitorEmail = localStorage.getItem('micap_visitor_email');
    let visitorName = localStorage.getItem('micap_visitor_name');

    if (!visitorEmail) {
      visitorEmail = prompt('Please enter your email address:');
      if (!visitorEmail || !visitorEmail.includes('@')) {
        addMessage('Please provide a valid email address to send your message.', 'bot');
        return;
      }
      localStorage.setItem('micap_visitor_email', visitorEmail);
    }

    if (!visitorName) {
      visitorName = prompt('Please enter your name:');
      if (visitorName) {
        localStorage.setItem('micap_visitor_name', visitorName);
      }
    }

    // Send message to API
    fetch('/api/chat/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        visitorEmail: visitorEmail,
        visitorName: visitorName || 'Visitor',
        message: message,
        sessionId: getSessionId(),
        pageUrl: window.location.href
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.message && data.isAIResponse) {
        addMessage(data.message, 'bot');
      } else if (data.message) {
        addMessage(data.message, 'bot');
      } else {
        addMessage('Thank you for your message. Our team will get back to you soon.', 'bot');
      }
    })
    .catch(error => {
      console.error('Error sending message:', error);
      addMessage('Sorry, there was an error sending your message. Please try again.', 'bot');
    });
  };

  window.sendMessage = function(message) {
    const input = document.getElementById('micap-chat-input');
    input.value = message;
    window.sendChatMessage();
  };

  window.handleChatKeypress = function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      window.sendChatMessage();
    }
  };

  function addMessage(text, sender) {
    const messagesContainer = document.getElementById('micap-chat-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `micap-message ${sender}-message`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'micap-message-content';
    contentDiv.innerHTML = `<p>${escapeHtml(text)}</p>`;
    
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  function getSessionId() {
    let sessionId = sessionStorage.getItem('micap_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('micap_session_id', sessionId);
    }
    return sessionId;
  }
})();
