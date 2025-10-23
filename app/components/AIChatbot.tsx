'use client';

import { useState } from 'react';
import ManufacturerCard from './ManufacturerCard';
import OrderForm from './OrderForm';

interface Message {
  id: number;
  content: string;
  isBot: boolean;
  timestamp: string;
  showManufacturerCard?: boolean;
  manufacturerType?: 'cotton' | 'denim' | null;
  showOrderForm?: boolean;
  orderFormData?: {
    manufacturerName: string;
    estimatedPrice: string;
    location: string;
  };
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "👋 Hello! I'm Grupo's AI Assistant. I can help you:\n\n✨ Find perfect manufacturers\n💬 Start conversations with them\n📦 Place orders directly\n\nWhat would you like to do today?",
      isBot: true,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      content: message,
      isBot: false,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, userMessage]);
    setMessage('');
    setSelectedChip(null); // Reset selected chip after sending

    // Check if the message is about cotton t-shirts to show manufacturer cards
    const isCottonTShirts = message.toLowerCase().includes('cotton') && 
                           (message.toLowerCase().includes('t-shirt') || message.toLowerCase().includes('tshirt'));

    // Check if the message is about denim/jeans manufacturer
    const isDenimManufacturer = message.toLowerCase().includes('denim') || 
                                message.toLowerCase().includes('jeans') ||
                                message.toLowerCase().includes('jean');

    // Check if the message is about placing an order
    const isPlaceOrder = message.toLowerCase().includes('place') && 
                         message.toLowerCase().includes('order');

    // Simulate bot response after a delay
    setTimeout(() => {
      let botContent = "I understand you're looking for help. Let me assist you with that! Would you like me to find manufacturers for your requirements?";
      let showCard = false;
      
      if (isCottonTShirts) {
        botContent = `🎯 Perfect! I found 1 verified manufacturers specializing in T-Shirt.

Here are my top recommendations:

📊 You can:
• 💬 Chat with any manufacturer
• 📦 Place an order directly`;
        showCard = true;
      } else if (isDenimManufacturer) {
        botContent = `🎯 Perfect! I found 1 verified manufacturers specializing in jeans.

Here are my top recommendations:

📊 You can:
• 💬 Chat with any manufacturer
• 📦 Place an order directly`;
        showCard = true;
      } else if (isPlaceOrder) {
        botContent = `I'd love to help! You can:
🔍 **Search**: 'I need 1000 cotton t-shirts'
💬 **Chat**: 'Connect me with a manufacturer'
📦 **Order**: 'I want to place an order'
What can I help you with?`;
      }

      const botMessage: Message = {
        id: messages.length + 2,
        content: botContent,
        isBot: true,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        showManufacturerCard: showCard,
        manufacturerType: isCottonTShirts ? 'cotton' : isDenimManufacturer ? 'denim' : null
      };
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleChipClick = (suggestion: string) => {
    setMessage(suggestion);
    setSelectedChip(suggestion);
    // Focus the input field after setting the message
    setTimeout(() => {
      const input = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 0);
  };

  const handleManufacturerChat = () => {
    const chatMessage: Message = {
      id: messages.length + 1,
      content: "I'd like to chat with this manufacturer about my requirements.",
      isBot: false,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, chatMessage]);
    
    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: messages.length + 2,
        content: "Perfect! I've connected you with the manufacturer. You can now discuss your specific requirements, pricing, and timeline directly with them.",
        isBot: true,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const handleManufacturerOrder = (manufacturerName: string, estimatedPrice: string, location: string) => {
    const orderMessage: Message = {
      id: messages.length + 1,
      content: "I'd like to place an order with this manufacturer.",
      isBot: false,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    
    // Add order form message
    const orderFormMessage: Message = {
      id: messages.length + 2,
      content: "Please fill out the order details below:",
      isBot: true,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      showOrderForm: true,
      orderFormData: {
        manufacturerName,
        estimatedPrice,
        location
      }
    };
    
    setMessages(prev => [...prev, orderMessage, orderFormMessage]);
  };

  const handleOrderFormSubmit = (orderData: any) => {
    const submitMessage: Message = {
      id: messages.length + 1,
      content: `Order submitted: ${orderData.brandName} - ${orderData.productType} (${orderData.quantity} units)`,
      isBot: false,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, submitMessage]);
    
    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: messages.length + 2,
        content: "Excellent! Your order request has been submitted successfully. The manufacturer will contact you within 24 hours to confirm details and provide a detailed quote.",
        isBot: true,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const handleOrderFormCancel = () => {
    const cancelMessage: Message = {
      id: messages.length + 1,
      content: "Order form cancelled.",
      isBot: false,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, cancelMessage]);
  };

  const suggestedQuestions = [
    "500 cotton t-shirts",
    "Chat with a denim manufacturer",
    "Place an order"
  ];

  return (
    <>
      {/* Floating Chat Button - Responsive */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 transition-all duration-300 ${
          isOpen ? 'scale-0' : 'scale-100'
        }`}
        aria-label="Open AI Chatbot"
      >
        <div className="relative">
          {/* Pulsing Ring Animation */}
          <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div>
          
          {/* Button */}
          <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full p-3 sm:p-4 shadow-2xl transition-all duration-200 hover:scale-110">
            <svg
              className="w-6 h-6 sm:w-7 sm:h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
        </div>
      </button>

      {/* Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Chat Window - Centered & Responsive */}
      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 
          w-full sm:w-[95vw] md:w-[90vw] lg:w-[85vw] max-w-4xl 
          h-full sm:h-[95vh] md:h-[90vh] lg:h-[85vh] max-h-[800px] 
          bg-white sm:rounded-2xl shadow-2xl transition-all duration-300 transform flex flex-col ${
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header - Responsive */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 sm:px-6 md:px-8 py-4 sm:py-5 sm:rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            <div className="relative">
              <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg md:text-xl">AI Manufacturing Assistant</h3>
              <p className="text-xs sm:text-sm text-blue-100 hidden sm:block">Powered by Grupo AI • Find, Chat & Order</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/20 rounded-lg p-1.5 sm:p-2 transition-colors"
            aria-label="Close chat"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Messages Container - Responsive */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6 bg-gray-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[80%] md:max-w-[75%] lg:max-w-[70%] ${
                  msg.isBot
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-blue-500 text-white'
                } rounded-2xl px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 shadow-sm`}
              >
                {msg.isBot && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                  </div>
                )}
                <p className="text-sm sm:text-base whitespace-pre-line leading-relaxed">{msg.content}</p>
                <p
                  className={`text-xs mt-1.5 sm:mt-2 ${
                    msg.isBot ? 'text-gray-500' : 'text-blue-100'
                  }`}
                >
                  {msg.timestamp}
                </p>
                
                {/* Manufacturer Card */}
                {msg.showManufacturerCard && (
                  <div className="mt-4">
                    {msg.manufacturerType === 'cotton' ? (
                      <ManufacturerCard
                        name="Manufacturer A"
                        rating={4.8}
                        products="T-Shirts, Shirts, Cotton Products"
                        location="Mumbai, India"
                        successRate="92% Success Rate"
                        capacity="Capacity: 10,000 units/day"
                        priceRange="$8-12 per unit"
                        onChat={handleManufacturerChat}
                        onOrder={() => handleManufacturerOrder("Manufacturer A", "$8-12 per unit", "Mumbai, India")}
                      />
                    ) : msg.manufacturerType === 'denim' ? (
                      <ManufacturerCard
                        name="Manufacturer B"
                        rating={4.6}
                        products="Jeans, Denim Jackets, Heavy Fabrics"
                        location="Guangzhou, China"
                        successRate="88% Success Rate"
                        capacity="Capacity: 5,000 units/day"
                        priceRange="$15-25 per unit"
                        onChat={handleManufacturerChat}
                        onOrder={() => handleManufacturerOrder("Manufacturer B", "$15-25 per unit", "Guangzhou, China")}
                      />
                    ) : null}
                  </div>
                )}

                {/* Order Form */}
                {msg.showOrderForm && msg.orderFormData && (
                  <div className="mt-4">
                    <OrderForm
                      manufacturerName={msg.orderFormData.manufacturerName}
                      estimatedPrice={msg.orderFormData.estimatedPrice}
                      location={msg.orderFormData.location}
                      onSubmit={handleOrderFormSubmit}
                      onCancel={handleOrderFormCancel}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input Area - Responsive */}
        <div className="p-3 sm:p-4 md:p-6 bg-white border-t border-gray-200 sm:rounded-b-2xl">
          {/* Suggested Questions as Chips */}
          <div className="mb-2 sm:mb-3 md:mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm text-gray-500 flex items-center gap-1">
                <span className="hidden sm:inline">💡</span>
                <span>Try:</span>
              </span>
              {suggestedQuestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChipClick(suggestion)}
                  className={`inline-flex items-center px-3 py-1.5 text-xs sm:text-sm rounded-full border transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${
                    selectedChip === suggestion
                      ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 hover:border-blue-300'
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Input Field */}
          <div className="flex items-end gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  // Reset selected chip if user manually types
                  if (selectedChip && e.target.value !== selectedChip) {
                    setSelectedChip(null);
                  }
                }}
                onKeyPress={handleKeyPress}
                placeholder="Ask me to find manufacturers, start a chat, or place an order..."
                className="w-full px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-4 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm sm:text-base text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl p-2.5 sm:p-3 md:p-4 transition-colors shadow-md hover:shadow-lg flex-shrink-0"
              aria-label="Send message"
            >
              <svg
                className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

