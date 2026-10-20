'use client';

import { useEffect, useState } from 'react';

export function WelcomeModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('kuroneko-welcome-seen');
    if (!hasSeen) {
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const closeModal = () => {
    setShow(false);
    localStorage.setItem('kuroneko-welcome-seen', 'true');
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={closeModal} aria-label="Tutup">
          ✕
        </button>
        
        <div className="modal-body">
          <h2 className="modal-title">Selamat Datang di Kuroneko</h2>
          <p className="modal-desc">
            Biar nggak ketinggalan update chapter terbaru dan info menarik lainnya, 
            yuk ikuti sosial media kami!
          </p>
          
          <div className="modal-actions">
            {/* INSTAGRAM */}
            <a 
              href="https://instagram.com/zuraofc_" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="modal-icon-btn"
              aria-label="Follow Instagram Kuroneko"
              title="Follow Instagram"
            >
              <InstagramIcon />
            </a>
            
            {/* WHATSAPP CHANNEL */}
            <a 
              href="https://whatsapp.com/channel/0029VbDWE5UCHDyk8H4iXm0C" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="modal-icon-btn"
              aria-label="Gabung Saluran WhatsApp Kuroneko"
              title="Gabung Saluran WA"
            >
              <WhatsAppIcon />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function InstagramIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      <path d="M16 13.3a1 1 0 0 0-1.4 0l-1.1 1.1a10 10 0 0 1-4.9-4.9l1.1-1.1a1 1 0 0 0 0-1.4L8.3 5.6a1 1 0 0 0-1.4 0L5.7 6.8a2 2 0 0 0-.5 1.4A15 15 0 0 0 15.8 18a2 2 0 0 0 1.4-.5l1.2-1.2a1 1 0 0 0 0-1.4L16 13.3z" />
    </svg>
  );
}