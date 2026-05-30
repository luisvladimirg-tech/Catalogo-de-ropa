/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ShoppingBag, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Trash2, 
  Plus, 
  Minus, 
  Check, 
  Loader2, 
  X, 
  ArrowRight, 
  Upload, 
  QrCode, 
  FileCheck, 
  Clock, 
  Coins, 
  ChevronRight, 
  Sparkles, 
  MapPin, 
  Mail, 
  Phone, 
  User, 
  Lock, 
  Award, 
  Truck, 
  ShieldCheck, 
  MessageCircle, 
  RefreshCw,
  Printer,
  ChevronDown
} from 'lucide-react';
import { CLOTHING_CATALOG, Product, CartItem, Order, PaymentValidation } from './types';

export default function App() {
  // Catalog states
  const [products, setProducts] = useState<Product[]>(CLOTHING_CATALOG);
  const [selectedStyle, setSelectedStyle] = useState<Product['style'] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Product['category'] | null>(null);
  const [searchText, setSearchText] = useState('');
  
  // Cart states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Checkout & Order States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState('Luis Vladimir');
  const [customerEmail, setCustomerEmail] = useState('luis.vladimirg@gmail.com');
  const [customerPhone, setCustomerPhone] = useState('945 926 207');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isValidatingPayment, setIsValidatingPayment] = useState(false);
  const [validationResult, setValidationResult] = useState<PaymentValidation | null>(null);
  const [showEmailSimulator, setShowEmailSimulator] = useState(false);

  // Voice Assistant States (Rosita)
  const [isAssistantOpen, setIsAssistantOpen] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isRositaSpeaking, setIsRositaSpeaking] = useState(false);
  const [isRositaThinking, setIsRositaThinking] = useState(false);
  const [captionText, setCaptionText] = useState('Estimado cliente, le saluda la Licenciada Rosita de Gamarra Online. Presione el micrófono para indicarme qué prendas o estilos busca hoy.');
  const [speechMuted, setSpeechMuted] = useState(false);
  const [chatLog, setChatLog] = useState<{ sender: 'user' | 'rosita'; text: string; time: string }[]>([
    { sender: 'rosita', text: 'Estimado cliente, es un placer saludarle. Le saluda la Licenciada Rosita, asesora principal de Gamarra Virtual. ¿Desea filtrar prendas de caballero, dama o algún estilo en particular hoy?', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);

  // Audio Context & Speech Web APIs references
  const recognitionRef = useRef<any>(null);
  const ttsRate = 0.95; // Speaking speed

  // Total calculation
  const cartTotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'es-PE';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        speakText('Le escucho con paciencia, dígame...', true);
      };

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        if (transcript) {
          handleUserSpeech(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event);
        setIsListening(false);
        setCaptionText('Disculpe mi estimado, no le logré escuchar bien. ¿Podría presionar el micrófono e intentar de nuevo?');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Web Speech Synthesis Speaker Helper
  const speakText = (text: string, force = false) => {
    if (speechMuted && !force) {
      setCaptionText(text);
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // stop current speak
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      
      // Try to find a Spanish female voice for Rosita
      const voices = window.speechSynthesis.getVoices();
      const spanishVoice = voices.find(v => v.lang.startsWith('es-') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('helena') || v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('sandra') || v.name.toLowerCase().includes('maria')));
      if (spanishVoice) {
        utterance.voice = spanishVoice;
      } else {
        const anySpanish = voices.find(v => v.lang.startsWith('es-'));
        if (anySpanish) utterance.voice = anySpanish;
      }

      utterance.rate = ttsRate;
      
      utterance.onstart = () => {
        setIsRositaSpeaking(true);
        setCaptionText(text);
      };
      
      utterance.onend = () => {
        setIsRositaSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      setCaptionText(text);
    }
  };

  // Process user text input or Speech Transcript
  const handleUserSpeech = async (input: string) => {
    // Add User entry to chat log
    setChatLog(prev => [...prev, { 
      sender: 'user', 
      text: input, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }]);

    setIsRositaThinking(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: input,
          activeStyle: selectedStyle,
          activeCategory: selectedCategory
        })
      });

      const data = await response.json();
      
      setIsRositaThinking(false);

      if (data.text) {
        // Speak response & update captions
        speakText(data.text);
        
        // Add rosita reply to log
        setChatLog(prev => [...prev, { 
          sender: 'rosita', 
          text: data.text, 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }]);

        // Auto filter styles or categories if Rosita instructed
        if (data.style) {
          setSelectedStyle(data.style);
        }
        if (data.category) {
          setSelectedCategory(data.category);
        }
      }
    } catch (err) {
      console.error(err);
      setIsRositaThinking(false);
      const fallbackMsg = `Estimado cliente, las disculpas por el inconveniente técnico en la red. Continúo a su total servicio para asesorarle en su compra de prendas casuales, formales o de invierno.`;
      speakText(fallbackMsg);
      setChatLog(prev => [...prev, { 
        sender: 'rosita', 
        text: fallbackMsg, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
    }
  };

  // Manual click to activate microphone
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
      } else {
        alert('Disculpe, el reconocimiento de voz no se encuentra totalmente activo en su navegador. Por favor escríbanos en el chat y le atenderemos con toda cordialidad.');
      }
    }
  };

  // Add Item to cart
  const addToCart = (product: Product, size: string, color: string) => {
    const existing = cart.find(item => 
      item.product.id === product.id && 
      item.selectedSize === size && 
      item.selectedColor === color
    );

    if (existing) {
      setCart(cart.map(item => 
        (item.product.id === product.id && item.selectedSize === size && item.selectedColor === color)
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1, selectedSize: size, selectedColor: color }]);
    }

    // Friendly speech trigger
    speakText(`Comprendido, estimado/a. He añadido el artículo ${product.name} a su canasta de compras.`);
  };

  // Remove item or change quantities
  const updateQuantity = (index: number, delta: number) => {
    const updated = [...cart];
    updated[index].quantity += delta;
    if (updated[index].quantity <= 0) {
      updated.splice(index, 1);
    }
    setCart(updated);
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const newOrder: Order = {
      id: 'GMR-' + Math.floor(1000 + Math.random() * 9000),
      items: cart,
      total: cartTotal,
      customerEmail,
      customerName,
      status: 'checkout',
      createdAt: new Date().toLocaleString()
    };
    
    setCurrentOrder(newOrder);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
    
    speakText(`Muy bien, estimado cliente. He generado su orden #${newOrder.id} de Gamarra por el monto total de S/. ${newOrder.total.toFixed(2)}. Por favor, realice su transferencia bancaria por Yape, Plin o BCP, y proceda a subir la captura de su comprobante de pago para realizar la inmediata verificación.`);
  };

  // File Upload Handler (for screenshot)
  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Generates Peruvian receipt images dynamically on canvas so Gemini can read ACTUAL graphics
  const generateSimulatedReceipt = (type: 'Yape95' | 'Bcp380' | 'Invalid5') => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const opCode = Math.floor(10000000 + Math.random() * 89999999).toString();
    const dateStr = new Date().toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    if (type === 'Yape95') {
      // Yape Theme Purple
      ctx.fillStyle = '#731a90';
      ctx.fillRect(0, 0, 400, 700);

      // Yape layout circle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(200, 160, 45, 0, Math.PI * 2);
      ctx.fill();

      // Green Checkmark icon
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(200, 160, 35, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(185, 160);
      ctx.lineTo(195, 170);
      ctx.lineTo(215, 150);
      ctx.stroke();

      // Text Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Arial, Montserrat';
      ctx.textAlign = 'center';
      ctx.fillText('¡Yapeaste!', 200, 240);

      // Amount
      ctx.font = 'bold 42px Arial, Montserrat';
      ctx.fillText('S/. 95.00', 200, 300);

      // Details Box
      ctx.fillStyle = '#651580';
      ctx.fillRect(30, 340, 340, 300);

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.font = '14px Arial';
      ctx.fillText('Para:', 50, 375);
      ctx.font = 'bold 15px Arial';
      ctx.fillText('GAMARRA ONLINE S.A.C.', 50, 395);

      ctx.fillStyle = '#dca2f2';
      ctx.font = '14px Arial';
      ctx.fillText('Fecha y hora:', 50, 440);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(dateStr, 50, 460);

      ctx.fillStyle = '#dca2f2';
      ctx.fillText('Celular de destino:', 50, 505);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('945 926 207', 50, 525);

      ctx.fillStyle = '#dca2f2';
      ctx.fillText('Número de operación:', 50, 570);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(opCode, 50, 590);

    } else if (type === 'Bcp380') {
      // BCP Theme blue
      ctx.fillStyle = '#002A54';
      ctx.fillRect(0, 0, 400, 700);

      // BCP Orange Accent Top
      ctx.fillStyle = '#FFD100';
      ctx.fillRect(0, 0, 400, 15);

      // White Body Panel
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(20, 60, 360, 580);

      // Blue check icon
      ctx.fillStyle = '#002A54';
      ctx.beginPath();
      ctx.arc(200, 120, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(190, 120);
      ctx.lineTo(197, 127);
      ctx.lineTo(210, 112);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#002A54';
      ctx.font = 'bold 18px Arial, Montserrat';
      ctx.fillText('CONGRESOS Y TRANSFERENCIA INTERBANCARIA', 200, 185);
      ctx.font = 'bold 20px Arial, Montserrat';
      ctx.fillText('Transferencia Exitosa', 200, 215);

      // Divider line
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, 240);
      ctx.lineTo(360, 240);
      ctx.stroke();

      // Amount Large
      ctx.font = 'bold 36px Arial';
      ctx.fillText('S/. 380.00', 200, 290);

      // Details Left Align
      ctx.textAlign = 'left';
      ctx.font = '13px Arial';
      ctx.fillStyle = '#64748b';
      ctx.fillText('DESDE CUENTA ORIGEN:', 50, 340);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('Ahorros Soles - 193-*****-**-21', 50, 360);

      ctx.fillStyle = '#64748b';
      ctx.font = '13px Arial';
      ctx.fillText('PARA DESTINATARIO:', 50, 410);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('GAMARRA ONLINE CORP S.A.C.', 50, 430);

      ctx.fillStyle = '#64748b';
      ctx.font = '13px Arial';
      ctx.fillText('ENTIDAD FINANCIERA:', 50, 480);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('Banco de Crédito del Perú - BCP', 50, 500);

      ctx.fillStyle = '#64748b';
      ctx.font = '13px Arial';
      ctx.fillText('REFERENCIA / OPERACIÓN ID:', 50, 550);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('BCP-' + opCode, 50, 570);

      ctx.fillStyle = '#64748b';
      ctx.font = '13px Arial';
      ctx.fillText('FECHA DE VALOR:', 50, 610);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px Arial';
      ctx.fillText(dateStr, 50, 625);

    } else if (type === 'Invalid5') {
      // Gray Scale / Failure Red Theme
      ctx.fillStyle = '#2d2d2d';
      ctx.fillRect(0, 0, 400, 700);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(20, 60, 360, 580);

      // Red cross icon
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(200, 120, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(188, 108);
      ctx.lineTo(212, 132);
      ctx.moveTo(212, 108);
      ctx.lineTo(188, 132);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#EF4444';
      ctx.font = 'bold 22px Arial';
      ctx.fillText('¡TRANSACCIÓN DENEGADA!', 200, 185);
      
      ctx.fillStyle = '#4b5563';
      ctx.font = '14px Arial';
      ctx.fillText('Saldo Insuficiente en cuenta origen', 200, 215);

      ctx.strokeStyle = '#f3f4f6';
      ctx.beginPath();
      ctx.moveTo(40, 240);
      ctx.lineTo(360, 240);
      ctx.stroke();

      ctx.fillStyle = '#111827';
      ctx.font = 'bold 36px Arial';
      ctx.fillText('S/. 5.00', 200, 290);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#4b5563';
      ctx.font = '13px Arial';
      ctx.fillText('Para:', 50, 360);
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('TIENDA DE ROPA GAMARRA', 50, 380);

      ctx.fillStyle = '#4b5563';
      ctx.fillText('Operación fallida, no se debitó el saldo.', 50, 440);
    }

    const dataUrl = canvas.toDataURL('image/png');
    setScreenshotPreview(dataUrl);
    speakText('Estimado cliente, se ha cargado el comprobante debidamente en su pantalla. Por favor presione el botón "Validar Comprobante por IA" para proceder con la verificación.');
  };

  // Submit and Validate Payment screenshot via Multi-modal server API
  const handleValidatePayment = async () => {
    if (!screenshotPreview || !currentOrder) return;

    setIsValidatingPayment(true);
    speakText('Por favor aguarde un momento, estimado cliente, estamos verificando con detalle la procedencia, fecha y monto de su comprobante a través de nuestro validador automatizado...', true);

    try {
      const response = await fetch('/api/validate-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageBase64: screenshotPreview,
          mimeType: 'image/png',
          orderTotal: currentOrder.total,
          customerEmail: currentOrder.customerEmail
        })
      });

      const data: PaymentValidation = await response.json();
      
      setIsValidatingPayment(false);
      setValidationResult(data);

      if (data.success) {
        // Change order status to approved
        setCurrentOrder(prev => prev ? { ...prev, status: 'approved', paymentValidation: data } : null);
        speakText(data.message || `¡Muchas gracias! Su pago por S/. ${data.amount} ha sido validado correctamente. Hemos enviado los detalles a su correo.`);
        
        // Push notification of payment check to chat log
        setChatLog(prev => [...prev, {
          sender: 'rosita',
          text: `[SERVICIO AL CLIENTE] Pago verificado con éxito. Banco: ${data.bank}, Operación N°: ${data.operationNumber}, Monto: S/. ${data.amount.toFixed(2)}. Pedido listo para entrega.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);

        // Automate Sending email on back-end
        triggerSimulatorEmail(data);
      } else {
        setCurrentOrder(prev => prev ? { ...prev, status: 'failed' } : null);
        speakText(data.message || 'Disculpe, estimado cliente/a, no fue posible validar dicho comprobante. Por favor asegúrese de que el importe, la fecha y los datos de la transferencia se aprecien legibles en la imagen.', true);
      }

    } catch (err) {
      console.error(err);
      setIsValidatingPayment(false);
      alert('Hubo un contratiempo técnico al validar su pago con la IA. Se reintentará de forma automática.');
    }
  };

  // Triggers email confirmation output visualizer
  const triggerSimulatorEmail = async (val: PaymentValidation) => {
    if (!currentOrder) return;
    try {
      const resp = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          order: {
            ...currentOrder,
            paymentValidation: val
          },
          customerEmail: currentOrder.customerEmail,
          customerName: customerName
        })
      });
      const data = await resp.json();
      if (data.success) {
        setShowEmailSimulator(true);
      }
    } catch (err) {
      console.error('Error simulating email', err);
    }
  };

  // Reset cart and checkout states to start fresh
  const handleResetCatalog = () => {
    setCart([]);
    setIsCheckoutOpen(false);
    setCurrentOrder(null);
    setScreenshotPreview(null);
    setValidationResult(null);
    setShowEmailSimulator(false);
    setSelectedStyle(null);
    setSelectedCategory(null);
    speakText('¡Listo mi estimado! Hemos vaciado su cuenta y estamos con las pilas recargadas para su nueva compra. ¿Qué estilo le gustaría ver ahora?');
  };

  // Auto trigger welcome speech on first user gesture
  const triggerWelcome = () => {
    speakText('¡Hola, qué gustazo saludarle, mi estimado cliente o señito! Le saluda Rosita, su cordial asesora de Gamarra Online. En la parte derecha tengo el botoncito de micrófono o comando de texto donde me puede pedir lo que guste, por ejemplo "recomiéndame algo abrigador para invierno" o "filtra ropa casual". ¿En qué tengo el honor de servirle hoy?');
  };

  return (
    <div id="app_root" className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* MAGENTA-PINK TOP ANNOUNCEMENT BAR */}
      <div id="top_pink_bar" className="bg-gamarra-pink text-white py-1.5 px-4 text-xs font-medium border-b border-rose-700">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-3">
            <span className="bg-white/15 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Gamarra 2026</span>
            <span>Estilo, Moda & Calidad directa desde el emporio comercial más grande de Sudamérica 🇵🇪</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] opacity-90 font-display">
            <span className="hover:underline cursor-pointer">¿Quiénes Somos?</span>
            <span className="hidden sm:inline text-white/45">|</span>
            <span className="hover:underline cursor-pointer">Servicios</span>
            <span className="hidden sm:inline text-white/45">|</span>
            <span className="hover:underline cursor-pointer">Guía de Envíos</span>
            <span className="hidden sm:inline text-white/45">|</span>
            <span className="hover:underline cursor-pointer bg-white/20 px-2 py-0.5 rounded font-bold">Mayoristas</span>
          </div>
        </div>
      </div>

      {/* HEADER SECTION (Gamarra logo layout) */}
      <header id="main_gamarra_header" className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo GAMARRA */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <div id="gamarra_logo" className="flex items-center gap-3 cursor-pointer" onClick={() => { setSelectedStyle(null); setSelectedCategory(null); }}>
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-rose-600 via-pink-500 to-amber-500 flex items-center justify-center text-white font-extrabold text-2xl shadow-md border-2 border-white ring-2 ring-gamarra-pink">
                G
              </div>
              <div>
                <span className="text-2xl font-black font-display tracking-tight text-slate-800 flex items-center gap-1">
                  GAMARRA <span className="text-gamarra-pink text-xs font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 uppercase">Online</span>
                </span>
                <span className="text-[10px] text-slate-400 block tracking-widest font-mono uppercase">- El Imperio de la Moda -</span>
              </div>
            </div>

            {/* Mobile Cart Button */}
            <div className="flex md:hidden items-center gap-2">
              <button 
                id="mob_cart_btn" 
                onClick={() => setIsCartOpen(true)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-full relative"
              >
                <ShoppingBag className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gamarra-pink text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse-ring">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* SEARCH BAR (Peru Style with pink/blue hints) */}
          <div className="w-full md:max-w-lg relative group">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 group-focus-within:text-gamarra-blue transition-colors">
              <Search className="w-4 h-4" />
            </span>
            <input 
              id="header_catalog_search"
              type="text" 
              placeholder="Busca casacas, vestidos, conjuntos deportivos, lino..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm outline-none focus:bg-white focus:border-gamarra-blue focus:ring-4 focus:ring-blue-50 transition-all font-sans"
            />
            {searchText && (
              <button 
                onClick={() => setSearchText('')} 
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* DESKTOP STATUS & CART */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={triggerWelcome}
              className="group text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3.5 py-2 rounded-full font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Activar Saludo de Rosita
            </button>

            <button 
              id="desk_cart_btn" 
              onClick={() => setIsCartOpen(true)}
              className="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-full flex items-center gap-2.5 transition-all shadow-sm font-sans text-sm font-semibold relative cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-gamarra-cyan" />
              <span>Mi Carrito</span>
              <span className="bg-gamarra-pink text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* CYAN-SKY BLUE BOTTOM NAV BAR */}
      <nav id="categories_cyan_bar" className="bg-gamarra-blue text-white py-2.5 px-4 shadow-sm relative z-20">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between text-xs font-semibold gap-3">
          <div className="flex flex-wrap items-center gap-1">
            <button 
              onClick={() => { setSelectedCategory(null); }}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer ${!selectedCategory ? 'bg-white/20 shadow-xs text-white underline font-bold' : 'hover:bg-white/10 text-slate-100'}`}
            >
              TODAS LAS SECCIONES
            </button>
            <span className="text-white/30 hidden sm:inline">|</span>
            <button 
              onClick={() => setSelectedCategory('damas')}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer ${selectedCategory === 'damas' ? 'bg-gamarra-pink text-white font-bold' : 'hover:bg-white/10 text-slate-100'}`}
            >
              ROPA PARA DAMAS
            </button>
            <span className="text-white/30 hidden sm:inline">|</span>
            <button 
              onClick={() => setSelectedCategory('caballeros')}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer ${selectedCategory === 'caballeros' ? 'bg-gamarra-pink text-white font-bold' : 'hover:bg-white/10 text-slate-100'}`}
            >
              ROPA PARA CABALLEROS
            </button>
            <span className="text-white/30 hidden sm:inline">|</span>
            <button 
              className="px-3 py-1.5 rounded text-white/60 cursor-not-allowed hover:bg-white/5" 
              title="Próximamente disponible mediante asistente de voz"
            >
              ROPA PARA NIÑOS
            </button>
            <span className="text-white/30 hidden sm:inline">|</span>
            <button 
              className="px-3 py-1.5 rounded text-white/60 cursor-not-allowed hover:bg-white/5" 
              title="Próximamente disponible mediante asistente de voz"
            >
              ROPA PARA BEBÉS
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[11px] bg-red-600 text-white px-2.5 py-1 rounded-full font-bold animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              <span>COMPRA AL POR MAYOR</span>
            </div>
          </div>
        </div>
      </nav>

      {/* CORE FRAMEWORK GRID (Catalog + Voice Personal Shopper) */}
      <main id="app_main_content" className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT BAR: Catalog Filters & Styles */}
        <section id="sidebar_filters" className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-6 h-fit">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <span>Filtrar por Estilo</span>
              <Sparkles className="w-4 h-4 text-gamarra-pink" />
            </h3>
            
            {/* STYLES LIST WITH PERUVIAN EMBELLISHMENTS */}
            <div className="flex flex-col gap-1">
              {(['Casual', 'Formal', 'Deportivo', 'Elegante', 'Urbano', 'Invierno'] as Product['style'][]).map(style => {
                const isActive = selectedStyle === style;
                return (
                  <button
                    key={style}
                    onClick={() => setSelectedStyle(isActive ? null : style)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all text-sm flex items-center justify-between group cursor-pointer ${
                      isActive 
                        ? 'bg-gamarra-pink-light text-gamarra-pink font-bold border-l-4 border-gamarra-pink' 
                        : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{style}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 group-hover:bg-white text-slate-500 font-mono">
                      {CLOTHING_CATALOG.filter(p => p.style === style).length}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedStyle && (
              <button 
                onClick={() => setSelectedStyle(null)}
                className="mt-4 w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                Limpiar Estilo
              </button>
            )}
          </div>

          {/* ASISTENTE CORDIAL AD BOARD */}
          <div className="bg-gradient-to-br from-gamarra-blue to-blue-700 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            <h4 className="font-display font-bold text-sm tracking-wide uppercase text-gamarra-cyan mb-1 flex items-center gap-1.5">
              <Mic className="w-4 h-4" /> Asistente de Voz
            </h4>
            <p className="text-xs text-slate-100 leading-relaxed mb-3">
              ¿Sabías que puedes pedirle a Rosita usando tu micrófono? Pruébalo diciendo:
            </p>
            <div className="bg-black/25 p-3 rounded-xl border border-white/10 text-[11px] font-mono leading-relaxed text-slate-100">
              <p className="italic text-yellow-300">"Rosita, recomiéndame un lindo terno elegante para caballeros"</p>
            </div>
          </div>
        </section>

        {/* CENTER / MAIN BOARD: Responsive Products Catalog */}
        <section id="catalog_product_grid" className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Active Filter Badges Grid */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Búsqueda activa:</span>
              
              {!selectedStyle && !selectedCategory && !searchText && (
                <span className="text-xs text-slate-600 bg-slate-100 px-3 py-1 rounded-full font-semibold">Mostrando Todo el Imperio</span>
              )}
              
              {selectedCategory && (
                <span className="text-xs bg-gamarra-blue text-white px-3 py-1 rounded-full font-bold flex items-center gap-1">
                  Sección: {selectedCategory.toUpperCase()}
                  <button onClick={() => setSelectedCategory(null)} className="hover:text-red-300 ml-1 font-bold">×</button>
                </span>
              )}

              {selectedStyle && (
                <span className="text-xs bg-gamarra-pink text-white px-3 py-1 rounded-full font-bold flex items-center gap-1 animate-bounce">
                  Estilo: {selectedStyle}
                  <button onClick={() => setSelectedStyle(null)} className="hover:text-red-300 ml-1 font-bold">×</button>
                </span>
              )}

              {searchText && (
                <span className="text-xs bg-yellow-500 text-slate-900 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                  Buscar: "{searchText}"
                  <button onClick={() => setSearchText('')} className="hover:text-red-300 ml-1 font-bold">×</button>
                </span>
              )}
            </div>

            <div className="text-xs text-slate-500 font-mono">
              Registrados: {products.filter(p => {
                const matchesStyle = !selectedStyle || p.style === selectedStyle;
                const matchesCategory = !selectedCategory || p.category === selectedCategory;
                const matchesSearch = !searchText || p.name.toLowerCase().includes(searchText.toLowerCase()) || p.description.toLowerCase().includes(searchText.toLowerCase());
                return matchesStyle && matchesCategory && matchesSearch;
              }).length} productos
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {products
              .filter(p => {
                const matchesStyle = !selectedStyle || p.style === selectedStyle;
                const matchesCategory = !selectedCategory || p.category === selectedCategory;
                const matchesSearch = !searchText || p.name.toLowerCase().includes(searchText.toLowerCase()) || p.description.toLowerCase().includes(searchText.toLowerCase());
                return matchesStyle && matchesCategory && matchesSearch;
              })
              .map(prod => {
                return (
                  <motion.div 
                    layout
                    key={prod.id}
                    id={`product_card_${prod.id}`}
                    className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-gamarra-pink/30 hover:shadow-lg transition-all group flex flex-col justify-between"
                  >
                    {/* Item Image area */}
                    <div className="relative overflow-hidden bg-slate-100 aspect-1">
                      
                      {prod.isBestSeller && (
                        <span className="absolute top-3 left-3 bg-gamarra-pink text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm tracking-wider z-10 animate-bounce">
                          ¡El más vendido! ⭐
                        </span>
                      )}

                      <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded tracking-wide z-10">
                        {prod.style}
                      </span>

                      <img 
                        src={prod.image} 
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    </div>

                    {/* Meta description */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Star Rating */}
                        <div className="flex items-center gap-1 mb-1.5">
                          <div className="flex text-amber-400 text-xs">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <span key={idx}>★</span>
                            ))}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">({prod.reviewsCount} reviews)</span>
                        </div>

                        <h3 className="font-display font-bold text-[15px] text-slate-800 leading-tight mb-2 group-hover:text-gamarra-pink transition-colors">
                          {prod.name}
                        </h3>
                        
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                          {prod.description}
                        </p>
                      </div>

                      <div>
                        {/* Prices row */}
                        <div className="flex items-baseline gap-2 mb-4">
                          <span className="text-lg font-black text-gamarra-pink">S/. {prod.price.toFixed(2)}</span>
                          {prod.originalPrice && (
                            <span className="text-xs text-slate-400 line-through">S/. {prod.originalPrice.toFixed(2)}</span>
                          )}
                        </div>

                        {/* Sizes options indicator */}
                        <div className="flex items-center gap-1.5 mb-4 text-[10px]">
                          <span className="text-slate-400 uppercase font-mono font-bold">Tallas:</span>
                          <div className="flex gap-1">
                            {prod.sizes.map(sz => (
                              <span key={sz} className="px-1.5 py-0.5 border border-slate-200 rounded font-bold text-slate-600 bg-slate-50">{sz}</span>
                            ))}
                          </div>
                        </div>

                        {/* Add to Cart button */}
                        <button
                          onClick={() => addToCart(prod, prod.sizes[0], prod.colors[0].name)}
                          className="w-full bg-slate-900 border border-slate-900 hover:bg-gamarra-pink hover:border-gamarra-pink text-white py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          Agregar a Compra
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>

          {/* Empty filtered list handle */}
          {products.filter(p => {
            const matchesStyle = !selectedStyle || p.style === selectedStyle;
            const matchesCategory = !selectedCategory || p.category === selectedCategory;
            const matchesSearch = !searchText || p.name.toLowerCase().includes(searchText.toLowerCase()) || p.description.toLowerCase().includes(searchText.toLowerCase());
            return matchesStyle && matchesCategory && matchesSearch;
          }).length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center p-6">
              <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-gamarra-pink mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">¡Oh mi estimado, no encontramos esa combinación!</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                No disponemos de prendas registradas con ese filtro actualmente. Dile a Rosita por voz "Muestra todo" o haz click para restablecer el catálogo.
              </p>
              <button 
                onClick={() => { setSelectedStyle(null); setSelectedCategory(null); setSearchText(''); }}
                className="bg-gamarra-pink hover:bg-rose-700 text-white px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Ver Todo el Catálogo
              </button>
            </div>
          )}

          {/* COMPRA SEGURA VALUES row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 bg-white p-5 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Compra Segura</h4>
                <p className="text-[11px] text-slate-500">Garantía total de pago</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">El Mejor Precio</h4>
                <p className="text-[11px] text-slate-500">Precios de fábrica garantizados</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pink-50 text-gamarra-pink flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Ventas por Mayor</h4>
                <p className="text-[11px] text-slate-500">Surtido para emprendedores</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">A Todo el Perú</h4>
                <p className="text-[11px] text-slate-500">Envíos diarios y seguros</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* CHAT Gamarra Ribbon / Floating Panel */}
      <AnimatePresence>
        {isAssistantOpen && (
          <motion.div 
            id="rosita_assistant_panel"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-6 right-6 z-40 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden w-96 max-w-[calc(100vw-32px)] flex flex-col max-h-[580px] origin-bottom-right"
          >
            {/* Header of Rosita Chat Drawer */}
            <div className="bg-gradient-to-r from-gamarra-pink to-rose-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Simulated live avatar of Rosita */}
                <div className="relative">
                  <div className="w-11 h-11 rounded-full bg-white border border-rose-300 flex items-center justify-center text-slate-800 font-bold overflow-hidden">
                    👩‍💼
                  </div>
                  {/* Glowing/pulsing status dot */}
                  <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${isListening ? 'bg-red-500 animate-ping' : isRositaSpeaking ? 'bg-emerald-500 animate-pulse' : 'bg-green-400'}`}></span>
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-sm tracking-wide">
                    Rosita - Asesora IA
                  </h3>
                  <div className="flex items-center gap-1 text-[10px] text-rose-100 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{isListening ? 'MICRO ACTIVO - ESCUCHANDO' : isRositaSpeaking ? 'HABLANDO CONTIGO' : 'CON CONEXIÓN SECURE'}</span>
                  </div>
                </div>
              </div>

              {/* Sound Controls Header */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSpeechMuted(!speechMuted)}
                  className="rounded-full p-1.5 text-rose-100 hover:text-white hover:bg-white/10 transition-colors"
                  title={speechMuted ? 'Activar Voz de Rosita' : 'Silenciar Voz'}
                >
                  {speechMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsAssistantOpen(false)}
                  className="rounded-full p-1.5 text-rose-200 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Rosita Soundwaves Panel */}
            <div className="bg-slate-900 px-4 py-3 text-slate-100 flex items-center gap-3.5 border-b border-slate-800/60 shrink-0">
              <div className="flex gap-1 h-6 items-center shrink-0 w-8 justify-center">
                {isListening ? (
                  // Red active voice recorder ring
                  <div className="w-4 h-4 rounded-full bg-red-500 animate-ping"></div>
                ) : isRositaSpeaking ? (
                  // Elegant dancing soundwaves bar inside Gamarra colors
                  Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`w-0.5 h-4 bg-gamarra-pink rounded-full wave-bar wave-bar-${i+1}`}></span>
                  ))
                ) : (
                  // Static subtle microphone icons
                  <Volume2 className="w-4.5 h-4.5 text-slate-500" />
                )}
              </div>
              <div className="text-xs prose leading-tight text-slate-200 max-h-16 overflow-y-auto">
                <span className="text-[10px] font-bold text-gamarra-cyan uppercase block font-mono">Último Mensaje de Rosita:</span>
                <span className="italic">"{captionText}"</span>
              </div>
            </div>

            {/* Conversation Messages Center Log */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 flex flex-col gap-3 min-h-[180px]">
              {chatLog.map((log, index) => {
                const isUser = log.sender === 'user';
                return (
                  <div 
                    key={index} 
                    className={`flex flex-col max-w-[85%] ${isUser ? 'self-end items-end' : 'self-start items-start'}`}
                  >
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      isUser 
                        ? 'bg-slate-900 text-white rounded-tr-none' 
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-xs'
                    }`}>
                      {log.text}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 font-mono">{log.time}</span>
                  </div>
                );
              })}

              {isRositaThinking && (
                <div className="flex items-center gap-2 text-slate-400 self-start text-xs bg-white border border-slate-100 px-3 py-2 rounded-2xl shadow-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-gamarra-pink" />
                  <span className="font-mono text-[10px]">Rosita está buscando...</span>
                </div>
              )}
            </div>

            {/* Assistant input controllers */}
            <div className="p-3 border-t border-slate-100 bg-white flex flex-col gap-2 shrink-0">
              
              {/* Mic pulse action block */}
              <div className="flex items-center gap-2">
                
                {/* Voice speech toggle */}
                <button
                  onClick={toggleListening}
                  className={`relative flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isListening 
                      ? 'bg-red-500 text-white ring-4 ring-red-100' 
                      : 'bg-gamarra-pink hover:bg-rose-700 text-white'
                  }`}
                  title="Grabar o decir comando con voz"
                >
                  {isListening ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
                  
                  {/* Subtle pulsing outer rings when assistant is silent, hinting at interaction */}
                  {!isListening && (
                    <span className="absolute inset-0 rounded-full bg-gamarra-pink/20 animate-pulse-ring pointer-events-none"></span>
                  )}
                </button>

                {/* Instant Input search bar */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formEl = e.currentTarget;
                    const inputEl = formEl.elements.namedItem('assistant_text') as HTMLInputElement;
                    if (inputEl && inputEl.value.trim() !== '') {
                      handleUserSpeech(inputEl.value);
                      inputEl.value = '';
                    }
                  }}
                  className="flex-1 flex gap-1 bg-slate-100 rounded-2xl items-center px-3 py-1 border border-slate-200 focus-within:bg-white focus-within:border-gamarra-pink transition-all"
                >
                  <input 
                    name="assistant_text"
                    type="text" 
                    placeholder="Escríbele o pídele algo a Rosita..."
                    className="flex-1 bg-transparent border-none text-xs outline-none py-1.5 focus:ring-0 text-slate-800 font-sans"
                  />
                  <button type="submit" className="text-gamarra-pink hover:text-rose-700 p-1">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* Sample Commands Quick Badges */}
              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100/60">
                <button 
                  onClick={() => handleUserSpeech('Muestra el estilo Invierno abrigador de la tienda')}
                  className="text-[9px] bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded-md px-2 py-0.5 font-semibold transition-all"
                >
                  ❄️ "Estilo Invierno"
                </button>
                <button 
                  onClick={() => handleUserSpeech('Recomiéndame ropa estilo deportivo para damas')}
                  className="text-[9px] bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-md px-2 py-0.5 font-semibold transition-all"
                >
                  🏃‍♀️ "Ropa deportiva damas"
                </button>
                <button 
                  onClick={() => handleUserSpeech('Restaurar catálogo y limpiar filtros')}
                  className="text-[9px] bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md px-2 py-0.5 font-semibold transition-all"
                >
                  🔄 "Ver todo"
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Floating Toggle button if closed */}
        {!isAssistantOpen && (
          <motion.button
            onClick={() => { setIsAssistantOpen(true); speakText('¡Hola coronita! Ya estoy de vuelta para ayudarte. ¿Qué modelito vestiremos hoy?'); }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="fixed bottom-6 right-6 z-40 bg-gamarra-pink text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:bg-rose-700 transition-all cursor-pointer ring-4 ring-rose-100 animate-bounce"
            title="Chat con la Asistente de Ventas"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* SHOPPING CART RIGHT DRAWER (Traditional sidebar layout) */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={() => setIsCartOpen(false)} />
            
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-screen max-w-md bg-white flex flex-col shadow-2xl h-full"
              >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-gamarra-pink" />
                    <h2 className="text-lg font-black text-slate-800">Tu Saco de Compras</h2>
                  </div>
                  <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-100 transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Items Box */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                  {cart.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4 border border-dashed border-slate-200">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 mb-1">¡Su canasta está vacía!</h3>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        Anímate a explorar el emporio con Rosita y añade hermosas prendas de excelente calidad.
                      </p>
                    </div>
                  ) : (
                    cart.map((item, index) => (
                      <div key={index} className="flex gap-4 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-all bg-white relative group">
                        
                        {/* Thumbnail */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 relative">
                          <img src={item.product.image} alt={item.product.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 truncate leading-tight group-hover:text-gamarra-pink">{item.product.name}</h4>
                          <span className="text-[10px] text-slate-400 block font-semibold mb-1">Estilo: {item.product.style} | Talla: {item.selectedSize}</span>
                          <span className="text-xs font-black text-slate-750">S/. {item.product.price.toFixed(2)}</span>
                          
                          {/* Quantities button toolbar */}
                          <div className="flex items-center gap-2.5 mt-2">
                            <button 
                              onClick={() => updateQuantity(index, -1)}
                              className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold font-mono text-slate-800">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(index, 1)}
                              className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Price computation */}
                        <div className="text-right flex flex-col justify-between items-end h-full flex-shrink-0">
                          <span className="text-sm font-black text-slate-900 font-mono">S/. {(item.product.price * item.quantity).toFixed(2)}</span>
                          <button 
                            onClick={() => updateQuantity(index, -item.quantity)}
                            className="text-slate-350 hover:text-red-500 p-1 rounded hover:bg-slate-50 transition-colors mt-2"
                            title="Eliminar del carro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer block */}
                {cart.length > 0 && (
                  <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col gap-4">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Subtotal:</span>
                      <span className="text-2xl font-black text-gamarra-pink font-mono">S/. {cartTotal.toFixed(2)}</span>
                    </div>

                    {/* Standard details form */}
                    <form onSubmit={handleCheckoutSubmit} className="flex flex-col gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Nombre Completo:</label>
                        <input 
                          required
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-gamarra-pink transition-all"
                          placeholder="p.ej. Luis Vladimir"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Correo Electrónico:</label>
                        <input 
                          required
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-gamarra-pink transition-all"
                          placeholder="luis.vladimirg@gmail.com"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Teléfono:</label>
                        <input 
                          required
                          type="text"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-gamarra-pink transition-all"
                          placeholder="945926207"
                        />
                      </div>

                      <button 
                        type="submit"
                        className="w-full mt-2 bg-gamarra-pink hover:bg-rose-700 text-white font-bold py-3 text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        Pagar Pedido con Yape/Plin <ArrowRight className="w-4 h-4 text-rose-200 animate-pulse" />
                      </button>
                    </form>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAILED CHECKOUT SCREEN (QR CODE & AUTOMATIC AI RECEIPT CHECKER) */}
      <AnimatePresence>
        {isCheckoutOpen && currentOrder && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 relative"
            >
              <button 
                onClick={() => setIsCheckoutOpen(false)}
                className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full p-2 transition-all z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* COL 1: Order Details & QR code for Yape/Plin payment */}
              <div className="p-6 md:p-8 bg-slate-50 border-r border-slate-200 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-2">
                    <QrCode className="w-6 h-6 text-gamarra-pink" />
                    <span>Portal de Pago Seguro</span>
                  </h3>
                  <p className="text-xs text-slate-500 leading-normal mb-4">
                    Su pedido de ropa de Gamarra ha sido reservado. Por favor use el QR para escanear y enviar su pago directamente a Gamarra Online.
                  </p>

                  {/* Summary order list */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 mb-4 shadow-sm text-xs">
                    <div className="flex justify-between items-center mb-2.5 border-b border-slate-100 pb-2">
                      <span className="font-bold text-slate-700">Pedido: {currentOrder.id}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{currentOrder.createdAt}</span>
                    </div>
                    <div className="max-h-24 overflow-y-auto mb-2 flex flex-col gap-1.5 pr-2">
                      {currentOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-baseline text-slate-650">
                          <span className="truncate max-w-40">{item.product.name} (x{item.quantity})</span>
                          <span className="font-semibold font-mono">S/. {(item.product.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-baseline pt-2 border-t border-slate-100 font-bold text-slate-800 text-sm">
                      <span>Total a Transferir:</span>
                      <span className="text-gamarra-pink font-black text-lg">S/. {currentOrder.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Gamarra QR graphic placeholder */}
                  <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200 mb-2 shadow-xs">
                    <div className="w-36 h-36 bg-gradient-to-tr from-purple-800 via-pink-600 to-amber-500 p-2 rounded-xl flex items-center justify-center relative shadow-sm">
                      {/* Generates a nice styled QR pattern with overlay Gamarra logo */}
                      <div className="bg-white w-full h-full rounded p-1.5 flex items-center justify-center relative">
                        <img 
                          src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://gamarra-fake.pe/yape-to-pay" 
                          alt="QR Gamarra Online"
                          className="w-full h-full"
                        />
                        <div className="absolute w-8 h-8 rounded-full bg-gamarra-pink text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-md">
                          G
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-3 text-[10px] font-bold text-slate-600">
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full flex items-center gap-1">💜 Yape</span>
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full flex items-center gap-1">💚 Plin</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 text-center font-semibold">Titular: Gamarra Online S.A.C | RUC: 20459385921</p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-1 justify-center mt-3">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Conexión cifrada SLL y validada por Rosita IA
                </div>
              </div>

              {/* COL 2: Payment Receipt Uploader / Multi-modal visualizer */}
              <div className="p-6 md:p-8 flex flex-col justify-between bg-white text-slate-800">
                
                {/* Status indicator */}
                <div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 mb-4">
                    <FileCheck className="w-5.5 h-5.5 text-gamarra-pink" />
                    <span>Subida de Comprobante</span>
                  </h3>

                  {/* Pre-baked TEST BUTTONS for easy multimodal testing without actual images handy */}
                  <div className="bg-rose-50/70 border border-rose-100 p-3 rounded-2xl mb-4">
                    <span className="text-[11px] font-bold text-gamarra-pink uppercase block mb-1.5 font-display flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Probar con Comprobantes Demo (Recomendado)
                    </span>
                    <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                      ¿No tienes un comprobante real en tu computadora? Genera uno ilustrado para que la IA de Gemini lo audite en tiempo real:
                    </p>
                    <div className="flex flex-col gap-1.5">
                      <button 
                        onClick={() => generateSimulatedReceipt('Yape95')}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-1.5 px-3 rounded-lg text-xs transition-colors flex items-center justify-between text-left shadow-xs cursor-pointer"
                      >
                        <span>📄 Generar Voucher de Yape (S/. 95.00)</span>
                        <span className="bg-purple-800 text-[9px] px-1.5 py-0.5 rounded">Yape Válido</span>
                      </button>
                      <button 
                        onClick={() => generateSimulatedReceipt('Bcp380')}
                        className="w-full bg-sky-700 hover:bg-sky-800 text-white font-semibold py-1.5 px-3 rounded-lg text-xs transition-colors flex items-center justify-between text-left shadow-xs cursor-pointer"
                      >
                        <span>📄 Generar Transferencia BCP (S/. 380.00)</span>
                        <span className="bg-sky-900 text-[9px] px-1.5 py-0.5 rounded">BCP Válido</span>
                      </button>
                      <button 
                        onClick={() => generateSimulatedReceipt('Invalid5')}
                        className="w-full bg-neutral-600 hover:bg-neutral-700 text-white font-semibold py-1.5 px-3 rounded-lg text-xs transition-colors flex items-center justify-between text-left shadow-xs cursor-pointer"
                      >
                        <span>📄 Generar Captura Inválida (S/. 5.00)</span>
                        <span className="bg-neutral-800 text-[9px] px-1.5 py-0.5 rounded">Rechazado</span>
                      </button>
                    </div>
                  </div>

                  {/* Real File Input Drag Drop area */}
                  <div className="mt-4">
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1 uppercase tracking-wider">Cargar su propio comprobante:</label>
                    <div className="border-2 border-dashed border-slate-200 hover:border-gamarra-pink rounded-2xl p-4 text-center cursor-pointer relative bg-slate-50 transition-colors">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleScreenshotUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                      <p className="text-[11px] font-semibold text-slate-750">Arrastra o selecciona tu captura aquí</p>
                      <p className="text-[9px] text-slate-400 mt-1">Soporta formatos JPG, PNG de Yape, Plin o correos de bancos</p>
                    </div>
                  </div>

                  {/* Thumbnail / Upload state visualizer */}
                  {screenshotPreview && (
                    <div className="mt-4 bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-14 bg-white border border-slate-200 rounded overflow-hidden shadow-xs relative object-cover flex-shrink-0">
                          <img src={screenshotPreview} alt="Payment Receipt" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-800">Comprobante Cargado</p>
                          <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Listo para auditar
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setScreenshotPreview(null)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Validation Actions Panel */}
                <div className="pt-6 border-t border-slate-100 mt-4">
                  {currentOrder.status === 'draft' || currentOrder.status === 'checkout' || currentOrder.status === 'failed' ? (
                    <button
                      onClick={handleValidatePayment}
                      disabled={!screenshotPreview || isValidatingPayment}
                      className={`w-full py-3.5 rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 ${
                        !screenshotPreview
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                          : isValidatingPayment
                            ? 'bg-gamarra-pink text-white cursor-wait'
                            : 'bg-gamarra-pink hover:bg-rose-700 text-white cursor-pointer'
                      }`}
                    >
                      {isValidatingPayment ? (
                        <>
                          <Loader2 className="w-4.5 h-4.5 animate-spin text-white" />
                          <span>Rosita está validando tu comprobante de pago...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4.5 h-4.5 text-yellow-300 animate-pulse" />
                          <span>Validar Comprobante con IA (Gemini 3.5)</span>
                        </>
                      )}
                    </button>
                  ) : null}

                  {/* SUCCESS APPROVED BOARD */}
                  {validationResult && currentOrder.status === 'approved' && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-emerald-700 font-bold">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">✓</div>
                        <span>¡COMPROBANTE APROBADO CON ÉXITO!</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-650 bg-white/70 p-3 rounded-lg border border-emerald-100 mt-1">
                        <div><strong>Banco u Origen:</strong> {validationResult.bank}</div>
                        <div><strong>Monto Validado:</strong> S/. {validationResult.amount.toFixed(2)}</div>
                        <div><strong>N° Operación:</strong> {validationResult.operationNumber}</div>
                        <div><strong>Emisor:</strong> {validationResult.sender}</div>
                      </div>

                      <div className="flex gap-2 mt-2">
                        <button 
                          onClick={() => setShowEmailSimulator(!showEmailSimulator)}
                          className="flex-1 bg-gamarra-blue hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          {showEmailSimulator ? 'Ocultar Email Confirmación' : 'Ver Email de Confirmación'}
                        </button>
                        <button 
                          onClick={handleResetCatalog}
                          className="flex-1 bg-slate-800 hover:bg-black text-white font-bold py-2 rounded-lg text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Volver a Comprar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* FAILURE REJECTED BOARD */}
                  {validationResult && currentOrder.status === 'failed' && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-red-700 font-bold">
                        <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px]">✕</div>
                        <span>AUTOCONTROL DE PAGO RECHAZADO</span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium">
                        El comprobante fue auditado pero la operación no coincide con el total de S/. {currentOrder.total.toFixed(2)} o la transacción está denegada o es ilegible.
                      </p>
                      <button 
                        onClick={() => { setScreenshotPreview(null); setValidationResult(null); }}
                        className="bg-red-650 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-[10px] transition-all mt-1 cursor-pointer"
                      >
                        Subir Otra Captura de Pago
                      </button>
                    </div>
                  )}

                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAILED GORGEOUS EMAIL SIMULATOR OF ORDER CONFIRMATION IN MAIN VIEWPORT (Below catalog, or triggered on view) */}
      <AnimatePresence>
        {showEmailSimulator && currentOrder && validationResult && (
          <div className="bg-slate-100 p-6 md:p-8 border-t border-slate-300">
            <div className="max-w-xl mx-auto bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-300">
              {/* Simulator Outer Bar */}
              <div className="bg-slate-900 px-4 py-2.5 text-white flex items-center justify-between text-xs font-mono select-none">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span className="text-slate-400 ml-1">Simulador de Correo Saliente (Servidor Gamarra)</span>
                </div>
                <button onClick={() => setShowEmailSimulator(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Email Envelope address summary */}
              <div className="p-4 border-b border-rose-100 bg-rose-50/50 text-[11px] text-slate-600 leading-normal flex flex-col gap-1 font-mono">
                <div><strong>De:</strong> pedidos@gamarraonline.com.pe &lt;Rosita la Cordial&gt;</div>
                <div><strong>Para:</strong> {currentOrder.customerEmail} &lt;{customerName}&gt;</div>
                <div><strong>Asunto:</strong> ¡Pago validado con éxito! Confirmación de Pedido Especial Gamarra #{currentOrder.id} 🇵🇪 🎉</div>
              </div>

              {/* Real HTML content rendered directly inside the viewport exactly matching referential images */}
              <div className="p-4 md:p-6 bg-white">
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  
                  {/* Banner header of invoice */}
                  <div className="bg-gradient-to-r from-gamarra-pink to-rose-600 text-white p-6 text-center">
                    <h4 className="text-sm font-extrabold tracking-widest uppercase mb-1">Gamarra Online S.A.C</h4>
                    <p className="text-[10px] text-rose-100">¡AUDITORÍA DE COMPROBANTE TOTAL CON ÉXITO!</p>
                    <div className="mt-3 inline-block bg-white/25 px-4 py-1.5 rounded text-[11px] font-bold">
                      PEDIDO CONFIRMADO #{currentOrder.id}
                    </div>
                  </div>

                  {/* Body markup */}
                  <div className="p-5 text-slate-800 text-xs leading-relaxed">
                    <p className="mb-3">Estimado(a) <strong>{customerName}</strong>,</p>
                    <p className="mb-4">
                      ¡Qué alegría, mi estimado caballero! Le saluda Rosita con el corazón contento. Le confirmo que nuestro sistema de inteligencia artificial ha fiscalizado su captura de pago y la transferencia se ha acreditado exitosamente. Ya ingresamos su confección a nuestro circuito de despacho en Gamarra.
                    </p>

                    {/* Verified transaction summary panel */}
                    <div className="bg-emerald-50/60 border-l-4 border-emerald-500 p-4 rounded-r-xl mb-5 flex flex-col gap-1 text-[11px] text-slate-700">
                      <span className="font-bold text-emerald-800 uppercase text-[10px] block mb-1">✓ Transacción Confirmada</span>
                      <div><strong>Canal de Pago:</strong> {validationResult.bank}</div>
                      <div><strong>Código Operación:</strong> {validationResult.operationNumber}</div>
                      <div><strong>Transferencia Leída:</strong> S/. {validationResult.amount.toFixed(2)}</div>
                      <div><strong>Fecha de Validación:</strong> {validationResult.date || new Date().toLocaleString()}</div>
                    </div>

                    {/* Invoice table list of clothes products */}
                    <h5 className="font-bold text-slate-700 border-b border-slate-100 pb-1 mb-2">Prendas de Vestir Seleccionadas</h5>
                    <div className="flex flex-col gap-2 mb-4">
                      {currentOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[11px] border-b border-dashed border-slate-100 pb-1.5">
                          <div>
                            <span className="font-bold text-slate-800">{item.product.name}</span>
                            <span className="text-[9px] text-slate-400 block font-normal">Talla: {item.selectedSize} | Color: {item.selectedColor}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-500 mr-4">Cant: {item.quantity}</span>
                            <span className="font-semibold text-slate-850 font-mono">S/. {(item.product.price * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-baseline pt-2 border-t border-slate-100 font-bold text-slate-800 mb-6 text-sm">
                      <span>MONTO TOTAL PAGADO:</span>
                      <span className="text-gamarra-pink font-black text-lg font-mono">S/. {currentOrder.total.toFixed(2)}</span>
                    </div>

                    {/* Peruvian signature cordial block */}
                    <div className="text-center bg-slate-50 p-4 rounded-xl border border-slate-100 text-[11px] text-slate-500 leading-normal">
                      <p className="font-semibold italic text-gamarra-pink mb-1">"¡Gracias por apostar por la industria y confección 100% peruana!"</p>
                      <p>Soporte las 24 horas: ventas@gamarraonline.com.pe | Gamarra, La Victoria, Lima.</p>
                    </div>

                  </div>

                </div>
              </div>

              {/* Bottom printable toolbar link */}
              <div className="bg-slate-50 px-4 py-3 select-none flex justify-end gap-2 border-t border-slate-200">
                <button 
                  onClick={() => window.print()}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-3 py-1.5 rounded text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir Comprobante
                </button>
                <button 
                  onClick={() => setShowEmailSimulator(false)}
                  className="bg-gamarra-pink hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded text-[10px] transition-all cursor-pointer"
                >
                  Entendido
                </button>
              </div>

            </div>
          </div>
        )}
      </AnimatePresence>

      {/* FOOTER OF GAMARRA ONLINE CATALOGUE (Referential Image branding style match) */}
      <footer id="app_gamarra_footer" className="bg-slate-900 text-white mt-12 py-10 px-4 border-t border-slate-850">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-sm">
          <div>
            <span className="text-lg font-black font-display tracking-wider flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-rose-600 via-pink-500 to-amber-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">G</span>
              GAMARRA ONLINE
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              El emporio comercial textil más grande del Perú ahora digitalizado a tu alcance, asistido por inteligencia artificial auditores de pago en tiempo real.
            </p>
          </div>
          
          <div>
            <h4 className="font-display font-bold text-xs uppercase tracking-widest text-gamarra-cyan mb-3">Direcciones de Gamarra</h4>
            <div className="flex flex-col gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gamarra-pink" /> Jirón Gamarra, La Victoria 15018, Lima</span>
              <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gamarra-pink" /> Teléfono: +51 945 926 207</span>
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gamarra-pink" /> ventas@gamarraonline.com.pe</span>
            </div>
          </div>

          <div>
            <h4 className="font-display font-bold text-xs uppercase tracking-widest text-gamarra-cyan mb-3">Métodos de Pago</h4>
            <p className="text-xs text-slate-400 mb-3 leading-normal">
              Aceptamos transferencias peruanas inmediatas de todas las carteras móviles y bancos nacionales.
            </p>
            <div className="flex flex-wrap gap-2 text-[10px] font-bold">
              <span className="bg-purple-950/80 text-purple-200 border border-purple-800 px-2 py-1 rounded">Yape con QR</span>
              <span className="bg-emerald-950/85 text-emerald-200 border border-emerald-800 px-2 py-1 rounded">Plin</span>
              <span className="bg-sky-950/85 text-sky-200 border border-sky-850 px-2 py-1 rounded">BCP</span>
              <span className="bg-blue-950/85 text-blue-200 border border-blue-800 px-2 py-1 rounded">BBVA Transit</span>
            </div>
          </div>

          <div>
            <h4 className="font-display font-bold text-xs uppercase tracking-widest text-gamarra-cyan mb-3">Asistente de Voz</h4>
            <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 flex items-start gap-2.5">
              <div className="text-xl">👩‍💼</div>
              <div>
                <p className="text-xs font-semibold text-slate-100">Rosita la Cordial</p>
                <p className="text-[10px] text-slate-400 leading-snug mt-0.5">"¡Pregúntame por estilos de invierno, deportivo, elegante o casual sin salir de casa!"</p>
                <button 
                  onClick={() => setIsAssistantOpen(true)}
                  className="text-[10px] text-gamarra-pink hover:text-rose-400 font-bold underline mt-1 block text-left"
                >
                  Abrir asistente ahora
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic decorative Peruvian color strips at the bottom matching referential images */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-orange-500 via-yellow-400 via-green-500 via-blue-500 to-purple-600 mb-6 rounded-full"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 gap-4 border-t border-slate-800/40 pt-4">
          <div>
            <span>© 2026 Gamarra Online. Confecciones KOI'I en kom.pe. Todos los derechos reservados.</span>
          </div>
          <div className="flex gap-4">
            <span className="hover:underline cursor-pointer">Políticas de Privacidad</span>
            <span>•</span>
            <span className="hover:underline cursor-pointer">Libro de Reclamaciones</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
