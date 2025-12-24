'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import apiService, { getApiBaseOrigin } from '../../lib/apiService';
import MessageAttachment from './MessageAttachment';

interface ChatWindowProps {
  conversationId: string;
  buyerId: string;
  manufacturerId: string;
  onClose?: () => void;
  title?: string;
  inline?: boolean;
  selfRole?: 'buyer' | 'manufacturer';
  onConversationRead?: (conversationId: string) => void;
  requirement?: any | null;
  aiDesign?: any | null;
}

interface Attachment {
  id?: string;
  file_url: string;
  file_type?: string;
  mime_type?: string;
  original_name?: string;
  thumbnail_url?: string;
  size_bytes?: number;
  width?: number;
  height?: number;
  duration?: number;
}

interface ChatMessage {
  id?: string;
  client_temp_id?: string;
  conversation_id: string;
  sender_role: 'buyer' | 'manufacturer';
  sender_id: string;
  body: string;
  created_at?: string;
  is_read?: boolean;
  attachments?: Attachment[];
  requirement_id?: string | null;
  ai_design_id?: string | null;
}

interface RequirementTab {
  id: string;
  requirement_text: string;
  requirement_no?: string;
  created_at?: string;
}

interface RequirementDetails {
  id: string;
  buyer_id: string;
  requirement_text: string;
  requirement_no?: string;
  quantity?: number | null;
  product_type?: string | null;
  product_link?: string | null;
  image_url?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  status?: 'accepted' | 'negotiating' | null;
}

interface AIDesignTab {
  id: string;
  design_no?: string;
  apparel_type: string;
  design_description?: string;
  image_url?: string;
  created_at?: string;
}

interface AIDesignDetails {
  id: string;
  buyer_id: string;
  apparel_type: string;
  design_description?: string;
  image_url?: string;
  quantity?: number;
  preferred_colors?: string;
  print_placement?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export default function ChatWindow({
  conversationId,
  buyerId,
  manufacturerId,
  onClose,
  title,
  inline,
  selfRole = 'buyer',
  onConversationRead,
  requirement,
  aiDesign
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [peerTyping, setPeerTyping] = useState(false);
  const typingTimerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // Audio ref for sent message sound
  const sentSoundRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    sentSoundRef.current = new Audio('/sent.mp3');
    sentSoundRef.current.volume = 0.5; // Set volume to 50%

    // Cleanup on unmount
    return () => {
      if (sentSoundRef.current) {
        sentSoundRef.current.pause();
        sentSoundRef.current = null;
      }
    };
  }, []);

  // Helper function to play sent sound
  const playSentSound = () => {
    if (sentSoundRef.current) {
      sentSoundRef.current.currentTime = 0; // Reset to start
      sentSoundRef.current.play().catch((err) => {
        // Silently handle autoplay restrictions
        console.log('Could not play sound:', err);
      });
    }
  };
  
  // Initialize activeRequirementId from requirement prop only (no localStorage)
  // Default to first requirement tab if available, otherwise null
  const [activeRequirementId, setActiveRequirementId] = useState<string | null>(requirement?.id || null);
  const [requirementTabs, setRequirementTabs] = useState<RequirementTab[]>([]);
  const [loadingRequirements, setLoadingRequirements] = useState(false);
  const [activeRequirementDetails, setActiveRequirementDetails] = useState<RequirementDetails | null>(null);
  const [loadingRequirementDetails, setLoadingRequirementDetails] = useState(false);
  
  // AI Design tabs state
  const [activeAIDesignId, setActiveAIDesignId] = useState<string | null>(aiDesign?.id || null);
  const [aiDesignTabs, setAiDesignTabs] = useState<AIDesignTab[]>([]);
  const [loadingAIDesigns, setLoadingAIDesigns] = useState(false);
  const [activeAIDesignDetails, setActiveAIDesignDetails] = useState<AIDesignDetails | null>(null);
  const [loadingAIDesignDetails, setLoadingAIDesignDetails] = useState(false);
  
  // Track active tab type: 'requirement' or 'ai-design'
  const [activeTabType, setActiveTabType] = useState<'requirement' | 'ai-design' | null>(null);
  
  // Toggle between Requirements and Designs
  const [contentType, setContentType] = useState<'requirements' | 'designs'>('requirements');

  // Clear active selections when switching content types and auto-select first item
  useEffect(() => {
    if (contentType === 'requirements') {
      setActiveAIDesignId(null);
      setActiveAIDesignDetails(null);
      // Auto-select first requirement if available
      if (requirementTabs.length > 0 && !requirement?.id) {
        setActiveRequirementId(requirementTabs[0].id);
        setActiveTabType('requirement');
      } else {
        setActiveRequirementId(null);
        setActiveTabType(null);
      }
    } else {
      setActiveRequirementId(null);
      setActiveRequirementDetails(null);
      // Auto-select first AI design if available
      if (aiDesignTabs.length > 0 && !aiDesign?.id) {
        setActiveAIDesignId(aiDesignTabs[0].id);
        setActiveTabType('ai-design');
      } else {
        setActiveAIDesignId(null);
        setActiveTabType(null);
      }
    }
    setMessages([]);
  }, [contentType, requirementTabs, aiDesignTabs, requirement?.id, aiDesign?.id]);

  const token = useMemo(() => apiService.getToken(), []);
  const wsUrl = useMemo(() => process.env.NEXT_PUBLIC_WS_URL || getApiBaseOrigin(), []);
  const wsPath = useMemo(() => process.env.NEXT_PUBLIC_WS_PATH || '/socket.io', []);

  const markConversationRead = useCallback(
    async (latestMessageId?: string) => {
      try {
        await apiService.markRead(conversationId, latestMessageId ? { upToMessageId: latestMessageId } : {});
        onConversationRead?.(conversationId);
      } catch (err) {
        console.error('[ChatWindow] Failed to mark conversation read:', err);
      }
    },
    [conversationId, onConversationRead]
  );

  // Stable reference for markConversationRead that won't cause re-renders
  const markConversationReadRef = useRef(markConversationRead);
  useEffect(() => {
    markConversationReadRef.current = markConversationRead;
  }, [markConversationRead]);

  // Load negotiating requirements for this conversation as tabs
  useEffect(() => {
    if (!conversationId || contentType !== 'requirements') {
      setRequirementTabs([]);
      setLoadingRequirements(false);
      return;
    }

    let mounted = true;
    setLoadingRequirements(true);

    async function loadNegotiatingRequirements() {
      try {
        // Fetch negotiating and accepted requirements for this specific conversation
        // These are requirements where:
        // - requirement_responses.status = 'negotiating' OR 'accepted'
        // - requirement_responses.manufacturer_id = conversation.manufacturer_id
        // - requirements.buyer_id = conversation.buyer_id
        const res = await apiService.getNegotiatingRequirementsForConversation(conversationId);
        
        if (!mounted) return;
        
        if (res.success && res.data && Array.isArray(res.data)) {
          // Map requirements to tabs
          const requirements: RequirementTab[] = res.data.map((req: any) => ({
            id: req.id,
            requirement_text: req.requirement_text || 'Requirement',
            requirement_no: req.requirement_no,
            created_at: req.created_at
          }));

          // Sort by created_at (newest first)
          requirements.sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
          });

          if (mounted) {
            setRequirementTabs(requirements);
            
            // Auto-select first requirement if available (always select first when tabs load)
            if (requirements.length > 0 && !requirement?.id) {
              // Only auto-select if we're on requirements tab or if no tab type is set
              if (contentType === 'requirements' || !activeTabType) {
                setActiveRequirementId(requirements[0].id);
                setActiveTabType('requirement');
              }
            }
          }
        } else {
          if (mounted) {
            setRequirementTabs([]);
          }
        }
      } catch (err) {
        console.error('[ChatWindow] Failed to load negotiating requirements:', err);
        if (mounted) {
          setRequirementTabs([]);
        }
      } finally {
        if (mounted) {
          setLoadingRequirements(false);
        }
      }
    }

    loadNegotiatingRequirements();

    return () => {
      mounted = false;
    };
  }, [conversationId, manufacturerId, contentType]); // Re-run when conversation, manufacturer, or contentType changes

  // Load accepted AI designs for this conversation as tabs
  useEffect(() => {
    if (!conversationId || contentType !== 'designs') {
      setAiDesignTabs([]);
      setLoadingAIDesigns(false);
      return;
    }

    let mounted = true;
    setLoadingAIDesigns(true);

    async function loadAcceptedAIDesigns() {
      try {
        // Fetch accepted AI designs for this specific conversation
        // These are AI designs where:
        // - ai_design_responses.status = 'accepted'
        // - ai_design_responses.manufacturer_id = conversation.manufacturer_id
        // - ai_designs.buyer_id = conversation.buyer_id
        const res = await apiService.getAcceptedAIDesignsForConversation(conversationId);
        
        if (!mounted) return;
        
        if (res.success && res.data && Array.isArray(res.data)) {
          // Map AI designs to tabs
          const aiDesigns: AIDesignTab[] = res.data.map((design: any) => ({
            id: design.id,
            design_no: design.design_no,
            apparel_type: design.apparel_type || 'AI Design',
            design_description: design.design_description,
            image_url: design.image_url,
            created_at: design.created_at
          }));

          // Sort by created_at (newest first)
          aiDesigns.sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
          });

          if (mounted) {
            setAiDesignTabs(aiDesigns);
            
            // If aiDesign prop is provided, ensure it's selected (it might be set before tabs load)
            if (aiDesign?.id) {
              // Verify the design exists in the loaded tabs
              const designExists = aiDesigns.some(d => d.id === aiDesign.id);
              if (designExists) {
                // Force selection even if already set, to ensure it's active
                setActiveAIDesignId(aiDesign.id);
                setActiveTabType('ai-design');
                setContentType('designs');
              }
            } else if (aiDesigns.length > 0) {
              // Auto-select first AI design if available (always select first when tabs load)
              // Only if we're on designs tab or if no tab type is set
              if (contentType === 'designs' || (!activeTabType && requirementTabs.length === 0)) {
                setActiveAIDesignId(aiDesigns[0].id);
                setActiveTabType('ai-design');
              }
            }
          }
        } else {
          if (mounted) {
            setAiDesignTabs([]);
          }
        }
      } catch (err) {
        console.error('[ChatWindow] Failed to load accepted AI designs:', err);
        if (mounted) {
          setAiDesignTabs([]);
        }
      } finally {
        if (mounted) {
          setLoadingAIDesigns(false);
        }
      }
    }

    loadAcceptedAIDesigns();

    return () => {
      mounted = false;
    };
  }, [conversationId, manufacturerId, contentType]); // Re-run when conversation, manufacturer, or contentType changes

  // Fetch requirement details when activeRequirementId changes
  useEffect(() => {
    if (!activeRequirementId) {
      setActiveRequirementDetails(null);
      setLoadingRequirementDetails(false);
      return;
    }

    let mounted = true;
    let cancelled = false;

    async function loadRequirementDetails() {
      try {
        setLoadingRequirementDetails(true);
        const res = await apiService.getRequirement(activeRequirementId!);
        
        if (cancelled || !mounted) return;
        
        if (res.success && res.data) {
          // Fetch requirement responses to get the status for this conversation's manufacturer
          try {
            const responsesRes = await apiService.getRequirementResponses(activeRequirementId!);
            let status: 'accepted' | 'negotiating' | null = null;
            
            if (responsesRes.success && responsesRes.data && Array.isArray(responsesRes.data)) {
              // Find the response from the manufacturer in this conversation
              const manufacturerResponse = responsesRes.data.find((resp: any) => 
                resp.manufacturer_id === manufacturerId && 
                (resp.status === 'accepted' || resp.status === 'negotiating')
              );
              
              if (manufacturerResponse) {
                status = manufacturerResponse.status === 'accepted' ? 'accepted' : 'negotiating';
              }
            }
            
            setActiveRequirementDetails({
              ...res.data,
              status
            });
          } catch (responsesErr) {
            // If fetching responses fails, still set the requirement details without status
            console.error('[ChatWindow] Failed to load requirement responses:', responsesErr);
            setActiveRequirementDetails(res.data);
          }
        } else {
          setActiveRequirementDetails(null);
        }
      } catch (err) {
        console.error('[ChatWindow] Failed to load requirement details:', err);
        if (!cancelled && mounted) {
          setActiveRequirementDetails(null);
        }
      } finally {
        if (!cancelled && mounted) {
          setLoadingRequirementDetails(false);
        }
      }
    }
    
    loadRequirementDetails();

    return () => {
      cancelled = true;
      mounted = false;
    };
  }, [activeRequirementId, manufacturerId]);

  // Fetch AI design details when activeAIDesignId changes
  useEffect(() => {
    if (!activeAIDesignId) {
      setActiveAIDesignDetails(null);
      setLoadingAIDesignDetails(false);
      return;
    }

    let mounted = true;
    let cancelled = false;

    async function loadAIDesignDetails() {
      try {
        setLoadingAIDesignDetails(true);
        const res = await apiService.getAIDesign(activeAIDesignId!);
        
        if (cancelled || !mounted) return;
        
        if (res.success && res.data) {
          setActiveAIDesignDetails(res.data);
        } else {
          setActiveAIDesignDetails(null);
        }
      } catch (err) {
        console.error('[ChatWindow] Failed to load AI design details:', err);
        if (!cancelled && mounted) {
          setActiveAIDesignDetails(null);
        }
      } finally {
        if (!cancelled && mounted) {
          setLoadingAIDesignDetails(false);
        }
      }
    }
    
    loadAIDesignDetails();

    return () => {
      cancelled = true;
      mounted = false;
    };
  }, [activeAIDesignId]);

  // Clear selections and messages when conversationId changes, then auto-select first items
  useEffect(() => {
    // Clear all selections when switching conversations
    setActiveRequirementId(null);
    setActiveAIDesignId(null);
    setActiveTabType(null);
    setActiveRequirementDetails(null);
    setActiveAIDesignDetails(null);
    setMessages([]);
    setLoading(true);
    // Reset to requirements tab by default
    setContentType('requirements');
  }, [conversationId]);

  // Load messages filtered by conversation_id AND requirement_id/ai_design_id from backend
  useEffect(() => {
    // Determine active ID based on tab type
    const activeId = activeTabType === 'ai-design' ? activeAIDesignId : activeRequirementId;
    
    if (!conversationId || !activeId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    let mounted = true;
    let cancelled = false;

    async function loadMessagesForActiveTab() {
      try {
        setLoading(true);
        setMessages([]); // Clear messages immediately when starting to load
        // Use the appropriate endpoint based on tab type
        let res;
        if (activeTabType === 'ai-design') {
          res = await apiService.getMessagesForAIDesign(conversationId, activeId!, { 
            limit: 200 
          });
        } else {
          res = await apiService.getMessagesForRequirement(conversationId, activeId!, { 
            limit: 200 
          });
        }
        
        if (cancelled || !mounted) return;
        
        const loadedMessages = res.data.messages || [];
        setMessages(loadedMessages);

        // Mark as read (use ref to avoid dependency issues)
        const lastMessage = loadedMessages.length ? loadedMessages[loadedMessages.length - 1] : null;
        if (lastMessage && !cancelled && mounted) {
          markConversationReadRef.current(lastMessage.id);
        }
      } catch (err) {
        console.error('[ChatWindow] Failed to load messages for active tab:', err);
        if (!cancelled && mounted) {
          setMessages([]);
        }
      } finally {
        if (!cancelled && mounted) {
          setLoading(false);
        }
      }
    }
    
    loadMessagesForActiveTab();

    return () => {
      cancelled = true;
      mounted = false;
    };
  }, [conversationId, activeRequirementId, activeAIDesignId, activeTabType]);
  
  // Auto-select first requirement tab when tabs load (for new conversations or when switching to requirements)
  useEffect(() => {
    if (contentType === 'requirements' && requirementTabs.length > 0 && !requirement?.id) {
      // Always select first requirement if none is selected or if we just switched conversations
      if (!activeRequirementId || activeTabType !== 'requirement') {
        const firstReqId = requirementTabs[0].id;
        setActiveRequirementId(firstReqId);
        setActiveTabType('requirement');
      }
    }
  }, [requirementTabs, contentType, requirement?.id, conversationId]);

  // Auto-select first AI design tab when tabs load (for new conversations or when switching to designs)
  useEffect(() => {
    if (contentType === 'designs' && aiDesignTabs.length > 0 && !aiDesign?.id) {
      // Always select first design if none is selected or if we just switched conversations
      if (!activeAIDesignId || activeTabType !== 'ai-design') {
        const firstDesignId = aiDesignTabs[0].id;
        setActiveAIDesignId(firstDesignId);
        setActiveTabType('ai-design');
      }
    }
  }, [aiDesignTabs, contentType, aiDesign?.id, conversationId]);

  // Set active requirement when requirement prop changes (e.g., from "Negotiate" button)
  useEffect(() => {
    if (requirement?.id) {
      // Set as active requirement when prop is provided
      setContentType('requirements');
      setActiveRequirementId(requirement.id);
      setActiveAIDesignId(null);
      setActiveTabType('requirement');
    }
  }, [requirement?.id]);

  // Set active AI design when aiDesign prop changes (e.g., from "Accept" button)
  useEffect(() => {
    if (aiDesign?.id) {
      // Set as active AI design when prop is provided
      setContentType('designs');
      setActiveAIDesignId(aiDesign.id);
      setActiveRequirementId(null);
      setActiveTabType('ai-design');
    }
  }, [aiDesign?.id]);

  // Ensure the requirement from prop is selected when tabs load
  useEffect(() => {
    if (requirement?.id) {
      if (requirementTabs.length > 0) {
        // Verify the requirement exists in the loaded tabs and ensure it's selected
        const requirementExists = requirementTabs.some(r => r.id === requirement.id);
        if (requirementExists && activeRequirementId !== requirement.id) {
          setActiveRequirementId(requirement.id);
          setActiveTabType('requirement');
          setContentType('requirements');
        }
      } else if (activeRequirementId !== requirement.id) {
        // Tabs haven't loaded yet, but we have the prop - ensure selection is set
        setActiveRequirementId(requirement.id);
        setActiveTabType('requirement');
        setContentType('requirements');
      }
    }
  }, [requirement?.id, requirementTabs.length, activeRequirementId]);

  // Ensure the AI design from prop is selected when tabs load
  useEffect(() => {
    if (aiDesign?.id) {
      if (aiDesignTabs.length > 0) {
        // Verify the design exists in the loaded tabs and ensure it's selected
        const designExists = aiDesignTabs.some(d => d.id === aiDesign.id);
        if (designExists && activeAIDesignId !== aiDesign.id) {
          setActiveAIDesignId(aiDesign.id);
          setActiveTabType('ai-design');
          setContentType('designs');
        }
      } else if (activeAIDesignId !== aiDesign.id) {
        // Tabs haven't loaded yet, but we have the prop - ensure selection is set
        setActiveAIDesignId(aiDesign.id);
        setActiveTabType('ai-design');
        setContentType('designs');
      }
    }
  }, [aiDesign?.id, aiDesignTabs.length, activeAIDesignId]);

  useEffect(() => {
    if (!token || !wsUrl) return;
    const socket = io(wsUrl, { path: wsPath, auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      // no-op
    });

    socket.on('message:new', async ({ message }) => {
      if (message.conversation_id !== conversationId) return;
      
      // Add to messages if it matches active requirement or AI design
      // Check both requirement_id and ai_design_id fields
      const messageReqId = message.requirement_id ? String(message.requirement_id) : null;
      const messageAiDesignId = (message as any).ai_design_id ? String((message as any).ai_design_id) : null;
      
      let shouldAdd = false;
      if (activeTabType === 'ai-design') {
        const activeId = activeAIDesignId ? String(activeAIDesignId) : null;
        shouldAdd = messageAiDesignId === activeId;
      } else if (activeTabType === 'requirement') {
        const activeId = activeRequirementId ? String(activeRequirementId) : null;
        shouldAdd = messageReqId === activeId;
      }
      
      if (shouldAdd) {
        setMessages((prev) => {
          // Replace optimistic by client_temp_id if present
          if (message.client_temp_id) {
            const idx = prev.findIndex(m => m.client_temp_id === message.client_temp_id);
            if (idx !== -1) {
              const clone = prev.slice();
              clone[idx] = message;
              return clone;
            }
          }
          return [...prev, message];
        });
      }

      // Note: Requirement tabs are loaded from backend, not from individual messages
      // This ensures all requirements are always visible as tabs

      scrollToBottom();
      if (message.sender_role !== selfRole) {
        await markConversationRead(message.id);
      }
    });

    socket.on('typing', ({ conversationId: cid, isTyping: typing }) => {
      if (cid !== conversationId) return;
      // Disable typing indicator UI entirely
      setPeerTyping(false);
    });

    socket.on('message:read', ({ conversationId: cid }) => {
      if (cid !== conversationId) return;
      // could update local read flags if desired
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, wsUrl, wsPath, conversationId, selfRole, markConversationRead]);

  // Reset typing indicator when switching conversations
  useEffect(() => {
    setPeerTyping(false);
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  }, [conversationId]);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    const hasText = input.trim().length > 0;
    const hasFiles = selectedFiles.length > 0;

    if ((!hasText && !hasFiles) || sending) return;

    const body = input.trim();
    const clientTempId = crypto.randomUUID();
    setSending(true);
    setInput('');

    let uploadedAttachments: any[] = [];

    try {
      // Upload files if any
      if (hasFiles) {
        setUploadingFiles(true);
        const uploadPromises = selectedFiles.map(file => 
          apiService.uploadChatFile(file, conversationId)
        );
        const uploadResults = await Promise.all(uploadPromises);
        uploadedAttachments = uploadResults.map(result => result.data);
        setSelectedFiles([]);
        setUploadingFiles(false);
      }

      // Determine active ID based on tab type
      const activeId = activeTabType === 'ai-design' ? activeAIDesignId : activeRequirementId;
      const requirementId = activeTabType === 'requirement' ? activeRequirementId : null;
      const aiDesignId = activeTabType === 'ai-design' ? activeAIDesignId : null;
      
      // optimistic append
      const optimistic: ChatMessage = {
        client_temp_id: clientTempId,
        conversation_id: conversationId,
        sender_role: selfRole,
        sender_id: 'me',
        body,
        created_at: new Date().toISOString(),
        is_read: false,
        attachments: uploadedAttachments,
        requirement_id: requirementId || null
      };
      setMessages((prev) => [...prev, optimistic]);
      scrollToBottom();
      
      // Play sent sound when message is sent
      playSentSound();

      // Prefer WebSocket
      if (socketRef.current?.connected) {
        socketRef.current.emit('message:send', { 
          conversationId, 
          body, 
          clientTempId,
          attachments: uploadedAttachments,
          requirementId: requirementId,
          aiDesignId: aiDesignId
        });
      } else {
        // fallback to REST
        await apiService.sendMessage(conversationId, { 
          body, 
          clientTempId,
          attachments: uploadedAttachments,
          requirementId: requirementId,
          aiDesignId: aiDesignId
        });
      }
    } catch (err) {
      console.error('Send failed', err);
      setUploadingFiles(false);
    } finally {
      setSending(false);
    }
  };

  // Typing indicator disabled

  const containerClass = inline
    ? 'h-full bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden shadow-sm'
    : 'fixed bottom-4 right-4 w-96 max-w-[95vw] bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden z-50';

  const headerClass = inline
    ? 'flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50'
    : 'flex items-center justify-between px-4 py-3 border-b border-gray-200';

  const titleClass = inline ? 'font-semibold text-black' : 'font-semibold text-gray-900';
  const closeClass = inline ? 'text-gray-500 hover:text-black' : 'text-gray-500 hover:text-gray-700';
  const listClass = inline ? 'flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50' : 'flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50';

  function formatDateLabel(date: Date) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / (24 * 60 * 60 * 1000));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';

    const formatter = new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });

    return formatter.format(date);
  }

  const timelineItems = useMemo(() => {
    const items: Array<
      | { type: 'date'; id: string; label: string }
      | { type: 'message'; id: string; data: ChatMessage; timestamp: Date }
    > = [];

    let lastDateKey: string | null = null;

    for (const message of messages) {
      const timestamp = message.created_at ? new Date(message.created_at) : new Date();
      const dateKey = timestamp.toDateString();

      if (dateKey !== lastDateKey) {
        items.push({
          type: 'date',
          id: `date-${dateKey}`,
          label: formatDateLabel(timestamp)
        });
        lastDateKey = dateKey;
      }

      items.push({
        type: 'message',
        id: message.id || message.client_temp_id || `${timestamp.getTime()}`,
        data: message,
        timestamp
      });
    }

    return items;
  }, [messages]);

  const whatsappHref = useMemo(() => 'https://wa.me/917671062042', []);

  return (
    <div className={containerClass}>
      <div className={headerClass}>
        <div className={titleClass}>{title || 'Chat'}</div>
        <div className="flex items-center gap-2">
          {/* Toggle between Requirements and AI Requirements */}
          {conversationId && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => {
                  setContentType('requirements');
                  setActiveAIDesignId(null);
                  setActiveTabType(null);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  contentType === 'requirements'
                    ? 'bg-white text-[#22a2f2] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Requirements"
              >
                Requirements
              </button>
              <button
                onClick={() => {
                  setContentType('designs');
                  setActiveRequirementId(null);
                  setActiveTabType(null);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  contentType === 'designs'
                    ? 'bg-white text-[#22a2f2] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="AI Requirements"
              >
                AI Requirements
              </button>
            </div>
          )}
          <button onClick={onClose} className={closeClass}>✕</button>
        </div>
      </div>

      {/* Requirement or AI Design Tabs - Show based on contentType toggle */}
      {conversationId && (
        <div className="border-b border-gray-200 bg-white overflow-x-auto">
          <div className="flex items-center gap-3 px-4 py-2">
            {/* Design Thumbnail Preview - Show when viewing an AI design */}
            {activeAIDesignId && activeAIDesignDetails?.image_url && (
              <div className="flex-shrink-0">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-[#22a2f2]/30 shadow-sm">
                  <img
                    src={activeAIDesignDetails.image_url.replace(/^http:\/\//i, 'https://')}
                    alt={activeAIDesignDetails.apparel_type || 'AI Design'}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
            
            {/* Tabs */}
            <div className="flex gap-2 flex-1 min-w-0">
              {contentType === 'requirements' ? (
                loadingRequirements ? (
                  <div className="px-4 py-2 text-sm text-gray-500 animate-pulse">Loading requirements...</div>
                ) : requirementTabs.length > 0 ? (
                  requirementTabs.map((reqTab) => (
                    <button
                      key={`req-${reqTab.id}`}
                      onClick={() => {
                        setActiveRequirementId(reqTab.id);
                        setActiveAIDesignId(null);
                        setActiveTabType('requirement');
                      }}
                      className={`px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                        activeTabType === 'requirement' && activeRequirementId === reqTab.id
                          ? 'bg-[#22a2f2] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title={reqTab.requirement_no || reqTab.requirement_text}
                    >
                      {reqTab.requirement_no || 'Requirement'}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-400">No requirements found</div>
                )
              ) : (
                loadingAIDesigns ? (
                  <div className="px-4 py-2 text-sm text-gray-500 animate-pulse">Loading designs...</div>
                ) : aiDesignTabs.length > 0 ? (
                  aiDesignTabs.map((designTab) => (
                    <button
                      key={`design-${designTab.id}`}
                      onClick={() => {
                        setActiveAIDesignId(designTab.id);
                        setActiveRequirementId(null);
                        setActiveTabType('ai-design');
                      }}
                      className={`px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                        activeTabType === 'ai-design' && activeAIDesignId === designTab.id
                          ? 'bg-[#22a2f2] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title={designTab.design_no || designTab.apparel_type || 'AI Design'}
                    >
                      {designTab.design_no || designTab.apparel_type || 'AI Design'}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-400">No designs found</div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Requirement Details - Compact info bar below tabs */}
      {activeRequirementId && (
        <div className="border-b border-gray-200 bg-white px-4 py-2">
          {loadingRequirementDetails ? (
            <div className="text-xs text-gray-400 animate-pulse">Loading...</div>
          ) : activeRequirementDetails ? (
            (activeRequirementDetails.quantity || 
             activeRequirementDetails.product_type ||
             activeRequirementDetails.status) ? (
              <div className="flex items-center gap-3 flex-wrap">
                {activeRequirementDetails.status && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">Status:</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      activeRequirementDetails.status === 'accepted'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {activeRequirementDetails.status === 'accepted' ? 'Accepted' : 'Negotiating'}
                    </span>
                  </div>
                )}
                {activeRequirementDetails.quantity && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">Qty:</span>
                    <span className="text-xs font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full">
                      {activeRequirementDetails.quantity.toLocaleString()}
                    </span>
                  </div>
                )}
                {activeRequirementDetails.product_type && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">Type:</span>
                    <span className="text-xs font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full">
                      {activeRequirementDetails.product_type}
                    </span>
                  </div>
                )}
              </div>
            ) : null
          ) : null}
        </div>
      )}

      {/* AI Design Details - Compact info bar below tabs */}
      {activeAIDesignId && (
        (loadingAIDesignDetails || 
         (activeAIDesignDetails && 
          (activeAIDesignDetails.preferred_colors || activeAIDesignDetails.print_placement))) && (
          <div className="border-b border-gray-200 bg-white px-4 py-2">
            {loadingAIDesignDetails ? (
              <div className="text-xs text-gray-400 animate-pulse">Loading...</div>
            ) : activeAIDesignDetails ? (
              <div className="flex items-center gap-3 flex-wrap">
                {activeAIDesignDetails.preferred_colors && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">Colors:</span>
                    <span className="text-xs font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full">
                      {activeAIDesignDetails.preferred_colors}
                    </span>
                  </div>
                )}
                {activeAIDesignDetails.print_placement && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">Print:</span>
                    <span className="text-xs font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full">
                      {activeAIDesignDetails.print_placement}
                    </span>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )
      )}

      <div ref={listRef} className={listClass}>
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 border-4 border-[#22a2f2]/20 rounded-full"></div>
                <div className="w-8 h-8 border-4 border-[#22a2f2] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>
              <p className={inline ? 'text-sm text-gray-400' : 'text-sm text-gray-500'}>Loading messages...</p>
            </div>
          </div>
        )}
        {!loading && timelineItems.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center max-w-sm">
              <div className="relative mx-auto mb-4 w-16 h-16">
                <div className="absolute inset-0 bg-gray-100 rounded-full"></div>
                <svg className="w-8 h-8 text-gray-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">No messages yet</p>
              <p className="text-xs text-gray-500">Start the conversation by sending a message</p>
            </div>
          </div>
        )}
        {!loading && timelineItems.length > 0 && timelineItems.map((item) => {
          if (item.type === 'date') {
            return (
              <div key={item.id} className="flex justify-center my-3">
                <span className="text-xs font-medium text-gray-500 bg-white/70 backdrop-blur border border-gray-200 rounded-full px-3 py-1 shadow-sm">
                  {item.label}
                </span>
              </div>
            );
          }

          const message = item.data;
          const isSelf = message.sender_role === selfRole;
          const wrapperClass = isSelf ? 'flex justify-end' : 'flex justify-start';
          const bubbleTone = isSelf
            ? 'bg-[#22a2f2] text-white shadow-[#22a2f2]/20'
            : (inline
                ? 'bg-gray-100 text-gray-900 border border-[#22a2f2]/10 shadow-sm'
                : 'bg-white text-gray-900 border border-[#22a2f2]/20 shadow-sm');

          return (
            <div key={item.id} className={wrapperClass}>
              <div
                className={`inline-flex max-w-[80%] w-fit flex-col gap-2 whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-sm shadow-sm ${bubbleTone}`}
              >
                {message.attachments && message.attachments.length > 0 && (
                  <div className="space-y-2">
                    {message.attachments.map((att, idx) => (
                      <MessageAttachment key={att.id || idx} attachment={att} />
                    ))}
                  </div>
                )}
                {message.body && <div>{message.body}</div>}
              </div>
            </div>
          );
        })}
        {/* Typing indicator disabled */}
      </div>

      <div className={inline ? 'p-3 border-t border-gray-200 bg-white' : 'p-3 border-t border-gray-200'}>
        {/* File preview */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-xs text-gray-800 shadow-sm"
              >
                <span className="truncate max-w-[160px] font-medium text-gray-900">{file.name}</span>
                <span className="text-[11px] text-gray-500">
                  {(file.size / 1024).toFixed(0)}KB
                </span>
                <button
                  onClick={() => removeSelectedFile(idx)}
                  className="ml-1 rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-200 hover:text-red-600"
                  aria-label="Remove file"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* File upload button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || uploadingFiles}
            className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 rounded-lg hover:bg-gray-100"
            title="Attach file"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={uploadingFiles ? "Uploading..." : "Type a message"}
            disabled={uploadingFiles}
            className={inline
              ? 'flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50'
              : 'flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50'}
          />
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-[#25D366] hover:text-[#1ebe5d] rounded-lg hover:bg-[#25D366]/10 transition-colors"
            aria-label="Continue chat on WhatsApp"
            title="Open WhatsApp chat"
          >
            <svg className="w-6 h-6" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
              <path d="M27.54 4.46A15.88 15.88 0 0016 0a15.9 15.9 0 00-13.5 24.47L0 32l7.74-2.46A15.9 15.9 0 0016 32h.01c8.82 0 15.99-7.17 15.99-16a15.87 15.87 0 00-4.46-11.54zm-11.53 24.5h-.01a13.3 13.3 0 01-6.79-1.86l-.49-.29-4.6 1.47 1.5-4.47-.32-.52A13.31 13.31 0 012.67 16 13.34 13.34 0 0127.33 16c0 7.35-5.98 12.96-11.32 12.96zm7.48-9.72c-.41-.2-2.42-1.19-2.79-1.33-.37-.14-.64-.2-.9.2-.27.41-1.03 1.33-1.26 1.6-.23.27-.46.3-.86.1-.41-.2-1.73-.64-3.3-2.03-1.22-1.09-2.04-2.43-2.27-2.84-.23-.41-.02-.63.18-.83.18-.18.41-.47.61-.7.2-.23.27-.41.41-.68.14-.27.07-.5-.03-.7-.1-.2-.9-2.17-1.23-2.97-.32-.77-.65-.67-.9-.68h-.77c-.27 0-.7.1-1.06.5-.36.41-1.4 1.37-1.4 3.34 0 1.97 1.44 3.87 1.64 4.14.2.27 2.84 4.33 6.88 6.07.96.41 1.7.66 2.28.84.96.31 1.83.27 2.52.16.77-.12 2.42-.99 2.76-1.95.34-.96.34-1.78.23-1.95-.11-.18-.37-.28-.79-.49z" />
            </svg>
          </a>
          <button 
            onClick={handleSend} 
            disabled={sending || uploadingFiles || (!input.trim() && selectedFiles.length === 0)} 
            className='px-3 py-2 bg-[#22a2f2] hover:bg-[#1b8bd0] disabled:opacity-50 text-white rounded-lg text-sm shadow-sm transition-colors'
          >
            {uploadingFiles ? 'Uploading...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}


