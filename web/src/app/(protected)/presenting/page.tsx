"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PresentingDrawer } from "@/components/PresentingDrawer";
import { PresentingPreview } from "@/components/PresentingPreview";
import { Toast } from "@/components/Toast";
import type { PresentingContent, PresentingMessage } from "@/lib/presenting/types";
import { createPresentingChannel } from "@/lib/presenting/channel";

export default function PresentingControlPage() {
  const router = useRouter();
  const [content, setContent] = useState<PresentingContent | null>(null);
  const [status, setStatus] = useState("Ready to present");
  const [sessionId, setSessionId] = useState<string>(() => getOrCreateSessionId());
  const [isOutputOpen, setIsOutputOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false
  });
  const channelRef = useRef<ReturnType<typeof createPresentingChannel> | null>(null);

  function goBack() {
    router.push("/dashboard");
  }

  function openOutput() {
    const outputWindow = window.open("/presenting/output?session=" + sessionId, "_blank");
    if (outputWindow) {
      setIsOutputOpen(true);
      setStatus("Output window opened");
    }
  }

  const handleContentSend = (newContent: PresentingContent) => {
    setContent(newContent);
    
    // Send to output window via broadcast channel
    if (channelRef.current) {
      channelRef.current.send({ type: "SET_CONTENT", content: newContent });
      setStatus("✅ Content sent to output successfully!");
      
      // Show success toast
      setToast({
        message: "Content sent to output successfully!",
        type: 'success',
        isVisible: true
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setStatus("Ready to present");
      }, 3000);
    } else {
      setStatus("❌ Output window not connected. Please open output first.");
      
      // Show error toast
      setToast({
        message: "Output window not connected. Please open output first.",
        type: 'error',
        isVisible: true
      });
    }
  };

  const handleStatusUpdate = (newStatus: string) => {
    setStatus(newStatus);
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  // Set up communication channel
  useEffect(() => {
    const channel = createPresentingChannel(sessionId);
    channelRef.current = channel;

    // Listen for messages from output window
    const unsubscribe = channel.subscribe((message: PresentingMessage) => {
      if (message.type === "READY") {
        setStatus("✅ Output window connected and ready");
        setIsOutputOpen(true);
        
        // Show connection toast
        setToast({
          message: "Output window connected and ready!",
          type: 'success',
          isVisible: true
        });
      } else if (message.type === "PLAYBACK_ENDED") {
        setStatus("🎵 Audio playback ended");
      }
    });

    return () => {
      unsubscribe();
      channel.close();
    };
  }, [sessionId]);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Simple Presenting</h1>
          <div className="text-sm text-gray-400">
            Scripture, text, and YouTube audio presentation
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={openOutput}
            className="px-4 py-2 rounded-lg font-semibold border border-blue-600 bg-blue-700 hover:bg-blue-600 transition-colors"
          >
            Open Output
          </button>
          <button 
            onClick={goBack} 
            className="px-4 py-2 rounded-lg font-semibold border border-gray-600 bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-300">{status}</div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOutputOpen ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-400">
              {isOutputOpen ? 'Output Connected' : 'Output Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Control Panel */}
        <div className="w-96 border-r border-gray-700">
          <PresentingDrawer 
            onContentSend={handleContentSend}
            onStatusUpdate={handleStatusUpdate}
          />
        </div>

        {/* Preview Area */}
        <div className="flex-1">
          <PresentingPreview content={content} />
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
      />
    </div>
  );
}

function getOrCreateSessionId() {
  const key = "presenting-session-id";
  if (typeof localStorage !== "undefined") {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const newId = Math.random().toString(36).slice(2);
    localStorage.setItem(key, newId);
    return newId;
  }
  return Math.random().toString(36).slice(2);
}