// Action Cable ES Module wrapper
// This provides the createConsumer function compatible with @rails/actioncable

export function createConsumer(url) {
  const cableUrl = url || getMetaValue("action-cable-url") || getWebSocketURL();
  
  const subscriptions = [];
  let ws = null;
  let reopenTimeout = null;
  
  function getWebSocketURL() {
    const meta = document.head.querySelector('meta[name="action-cable-url"]');
    if (meta) return meta.content;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/cable`;
  }
  
  function connect() {
    if (ws && ws.readyState === WebSocket.OPEN) return;
    
    ws = new WebSocket(cableUrl);
    
    ws.onopen = function() {
      console.log("Action Cable connected");
      subscriptions.forEach(sub => {
        if (sub.state === 'pending') {
          ws.send(JSON.stringify({
            command: "subscribe",
            identifier: JSON.stringify(sub.identifier)
          }));
        }
      });
    };
    
    ws.onmessage = function(event) {
      const data = JSON.parse(event.data);
      
      if (data.type === "ping") {
        return;
      }
      
      if (data.type === "confirm_subscription") {
        const identifier = JSON.parse(data.identifier);
        const sub = subscriptions.find(s => 
          JSON.stringify(s.identifier) === data.identifier
        );
        if (sub) {
          sub.state = 'connected';
          if (sub.callbacks.connected) sub.callbacks.connected();
        }
        return;
      }
      
      if (data.type === "reject_subscription") {
        const sub = subscriptions.find(s => 
          JSON.stringify(s.identifier) === data.identifier
        );
        if (sub) {
          sub.state = 'rejected';
          if (sub.callbacks.rejected) sub.callbacks.rejected();
        }
        return;
      }
      
      if (data.message) {
        const sub = subscriptions.find(s => 
          JSON.stringify(s.identifier) === data.identifier
        );
        if (sub && sub.callbacks.received) {
          sub.callbacks.received(data.message);
        }
      }
    };
    
    ws.onclose = function() {
      console.log("Action Cable disconnected");
      subscriptions.forEach(sub => {
        sub.state = 'disconnected';
        if (sub.callbacks.disconnected) sub.callbacks.disconnected();
      });
      
      // Attempt to reconnect after 3 seconds
      reopenTimeout = setTimeout(connect, 3000);
    };
    
    ws.onerror = function(error) {
      console.error("Action Cable WebSocket error:", error);
    };
  }
  
  connect();
  
  const consumer = {
    subscriptions: {
      create: function(identifier, callbacks = {}) {
        const subscription = {
          identifier: identifier,
          callbacks: callbacks,
          state: 'pending',
          perform: function(action, data = {}) {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                command: "message",
                identifier: JSON.stringify(identifier),
                data: JSON.stringify({ action: action, ...data })
              }));
            }
          },
          unsubscribe: function() {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                command: "unsubscribe",
                identifier: JSON.stringify(identifier)
              }));
            }
            const index = subscriptions.indexOf(subscription);
            if (index > -1) subscriptions.splice(index, 1);
          }
        };
        
        subscriptions.push(subscription);
        
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            command: "subscribe",
            identifier: JSON.stringify(identifier)
          }));
        }
        
        return subscription;
      }
    },
    disconnect: function() {
      if (reopenTimeout) {
        clearTimeout(reopenTimeout);
        reopenTimeout = null;
      }
      if (ws) {
        ws.close();
        ws = null;
      }
      subscriptions.length = 0;
    }
  };
  
  return consumer;
}

function getMetaValue(name) {
  const element = document.head.querySelector(`meta[name="${name}"]`);
  return element ? element.getAttribute("content") : null;
}
