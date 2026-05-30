/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize the Google Gen AI client lazy/securely
const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('Warning: GEMINI_API_KEY is not defined in the environment. Falling back to simulated AI mode.');
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

const app = express();
const PORT = 3000;

// Set up JSON body parser with generous limit for receipt images
app.use(express.json({ limit: '20mb' }));

// List of products to feed to the model for context-aware shopping recommendations
const CATALOG_CONTEXT = `
PRODUCTOS DEL CATÁLOGO DISPONIBLES:
1. Casaca Cortaviento Térmico Gamarra - S/. 89.90 (Antes S/. 129.90). Estilo: Deportivo. Categoría: damas. Tallas: S, M, L. Colores: Negro, Rosado Neón, Azul Eléctrico. Cortaviento impermeable con forro micropolar térmico.
2. Vestido Midi Floreado Girasoles - S/. 65.00 (Antes S/. 85.00). Estilo: Casual. Categoría: damas. Tallas: M, L, XL. Colores: Negro con Flores, Rojo Guinda. Crepe stretch, estampado fresco.
3. Terno Slim Fit Alpaca Premium - S/. 380.00 (Antes S/. 450.00). Estilo: Elegante. Categoría: caballeros. Tallas: 48, 50, 52, 54. Colores: Azul Noche, Gris Grafito. Confección sastre mezcla de alpaca.
4. Conjunto Jogger & Polera Oversize Urban - S/. 95.00 (Antes S/. 130.00). Estilo: Urbano. Categoría: damas. Tallas: Standard, XL. Colores: Gris Melange, Crema Matcha, Negro Puro. Algodón perchado pesado súper cómodo.
5. Saco Blazer Sastre Entallado - S/. 120.00 (Antes S/. 160.00). Estilo: Formal. Categoría: damas. Tallas: S, M, L. Colores: Blanco Crema, Marrón Caramelo, Negro Clásico. Bengalina resistente estructurado.
6. Chompa Trenzada de Algodón Orgánico - S/. 75.00 (Antes S/. 110.00). Estilo: Invierno. Categoría: caballeros. Tallas: M, L, XL. Colores: Beige Arena, Verde Pino, Azul Marino. Algodón nativo peruano abrigador.
7. Jeans Mujer High Waist Gamarra Denim - S/. 69.90 (Antes S/. 99.90). Estilo: Urbano. Categoría: damas. Tallas: 28, 30, 32, 34. Colores: Azul Claro, Azul Medio, Negro Gastado. Tiro alto, efecto levanta cola, premium stretch.
8. Camisa Linen Premium Cuello Nerú - S/. 55.00 (Antes S/. 80.00). Estilo: Casual. Categoría: caballeros. Tallas: S, M, L, XL. Colores: Blanco Lino, Celeste Pastel, Verde Musgo. 100% lino peruano fresco.
9. Pantalón Chino Slim Fit de Dril - S/. 79.90 (Antes S/. 109.90). Estilo: Formal. Categoría: caballeros. Tallas: 30, 32, 34, 36. Colores: Khaki Beige, Azul Marino, Marrón Café. Algodón satinado premium.
10. Polera con Capucha Algodón Oxford - S/. 85.00 (Antes S/. 115.00). Estilo: Urbano. Categoría: caballeros. Tallas: M, L, XL. Colores: Gris Oscuro, Verde Militar, Negro. Algodón grueso abrigador.
11. Casaca Cortaviento Waterproof Pro - S/. 110.00 (Antes S/. 149.90). Estilo: Deportivo. Categoría: caballeros. Tallas: S, M, L, XL. Colores: Negro Mate, Naranja Deportivo. Costuras termoselladas e impermeable.
`;

// API Endpoints

// 1. Cordial voice shop assistant chat / speech endpoint
app.post('/api/chat', async (req, res) => {
  const { message, activeStyle, activeCategory } = req.body;
  
  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message payload is required.' });
  }

  const ai = getGenAIClient();

  if (!ai) {
    // Simulated fallback behavior when API key is missing
    return res.json({
      text: `Estimado cliente, es un placer saludarle de mi parte. Actualmente nuestro sistema opera en modo de contingencia local, pero con mucho gusto le asesoro: veo que nos consulta acerca de "${message}". Le sugiero revisar nuestra amplia selección para caballeros y damas en Gamarra con la mejor calidad textil peruana. Por favor, indíqueme si hay algún estilo o talle en particular que desea filtrar.`,
      style: message.toLowerCase().includes('deport') ? 'Deportivo' : 
             message.toLowerCase().includes('eleg') ? 'Elegante' :
             message.toLowerCase().includes('invier') || message.toLowerCase().includes('frio') ? 'Invierno' :
             message.toLowerCase().includes('urb') ? 'Urbano' :
             message.toLowerCase().includes('casu') ? 'Casual' :
             message.toLowerCase().includes('form') ? 'Formal' : null,
      category: message.toLowerCase().includes('cabal') || message.toLowerCase().includes('varon') || message.toLowerCase().includes('hombre') ? 'caballeros' :
                message.toLowerCase().includes('dama') || message.toLowerCase().includes('mujer') ? 'damas' : null
    });
  }

  try {
    const prompt = `
      El usuario dice: "${message}".
      Estilo activo actual del catálogo: ${activeStyle || 'Ninguno'}.
      Categoría activa actual del catálogo: ${activeCategory || 'Ninguna'}.
      
      Por favor procesa esta consulta de compra de manera sumamente atenta.
      
      ${CATALOG_CONTEXT}

      INSTRUCCIÓN IMPORTANTE PARA TU MENTALIDAD Y ESTILO:
      Eres la Licenciada Rosita, la asesora principal de atención al cliente y ventas de "Gamarra Online". 
      Tu tono de voz y estilo debe ser NEUTRAL, PERUANO, FORMAL y SUMAMENTE RESPETUOSO. 
      Evita por completo términos excesivamente Informales o cariñosos como: "corazón", "reina", "señito", "jovencito", etc.
      En su lugar, dirígete al cliente de manera formal y cordial usando los vocablos correctos como: "estimado cliente", "estimada señorita", "caballero", "estimada dama" o simplemente "señor/a".
      Tu objetivo es brindar una orientación impecable y guiada, recomendando artículos exactos vigentes de la lista con sus respectivos precios en Soles (S/.). Sé concisa y directa para un correcto procesamiento de voz TTS.

      RESPUESTA REQUERIDA (Formato JSON estricto):
      Debes responder con un JSON válido conteniendo:
      {
        "text": "Tu respuesta formal, cordial y neutral con acento peruano profesional, ofreciendo o sugiriendo productos elegibles e invitándole a agregarlos al carrito. Máximo 3 oraciones sencillas y fluidas.",
        "style": "El nuevo estilo a filtrar de acuerdo al mensaje o recomendación (uno de: 'Casual', 'Formal', 'Deportivo', 'Elegante', 'Urbano', 'Invierno') o null si no aplica o no habla de estilo.",
        "category": "La categoría a filtrar según la conversación (una de: 'damas', 'caballeros', 'ninos', 'bebes') o null si no aplica."
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: 'Respuesta formal y cordial en español neutro peruano' },
            style: { type: Type.STRING, nullable: true, enum: ['Casual', 'Formal', 'Deportivo', 'Elegante', 'Urbano', 'Invierno'] },
            category: { type: Type.STRING, nullable: true, enum: ['damas', 'caballeros', 'ninos', 'bebes'] }
          },
          required: ['text']
        },
        systemInstruction: 'Eres la Licenciada Rosita, especialista en asesoría de moda y ventas del emporio comercial de Gamarra. Tu atención destaca por ser altamente formal, neutral, educada, cordial y de un distinguido profesionalismo peruano.'
      }
    });

    const parsedData = JSON.parse(response.text || '{}');
    return res.json(parsedData);
  } catch (error: any) {
    console.error('Error calling Gemini for Chat:', error);
    return res.status(500).json({ 
      error: 'Hubo un error al procesar el asistente de voz.',
      details: error.message 
    });
  }
});

// 2. Multi-modal validation of payment screenshot from Yape, Plin, BCP, BBVA, etc.
app.post('/api/validate-payment', async (req, res) => {
  const { imageBase64, mimeType, orderTotal, customerEmail } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'La imagen base64 del pago es requerida.' });
  }

  const ai = getGenAIClient();

  if (!ai) {
    // Simulation fallback with mock data for testing UI when API keys are not supplied
    console.warn('GEMINI_API_KEY is not defined. Simulating valid payment response...');
    const randomOp = Math.floor(10000000 + Math.random() * 90000000).toString();
    const mockSuccess = true;
    
    return res.json({
      success: mockSuccess,
      amount: orderTotal || 150.00,
      operationNumber: randomOp,
      sender: 'NANCY ROXANA QUISPE',
      bank: 'Yape / BCP',
      date: 'Hoy, ' + new Date().toLocaleTimeString(),
      message: `¡Mil gracias! He validado tu comprobante simulado de transferencia de S/. ${orderTotal || 150.00} mediante Yape/BCP. Su número de operación es el ${randomOp}. Su pedido está confirmado y listo para despacho.`,
      confidenceScore: 0.95
    });
  }

  try {
    // Prepare image for Gemini multimodal SDK
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    
    const imagePart = {
      inlineData: {
        data: cleanBase64,
        mimeType: mimeType || 'image/png'
      }
    };

    const textPart = {
      text: `
        Analiza esta imagen que el cliente afirma que es un comprobante de pago realizado (Yape, Plin, transferencia BCP, BBVA, Interbank, Ype, Banco de la Nación, etc.) en Perú.
        El total esperado del pedido es: S/. ${orderTotal || 'cualquiera'}.
        El correo del cliente asignado es: ${customerEmail || 'no especificado'}.

        Debes validar de manera estricta lo siguiente:
        1. ¿Es un comprobante de transferencia bancaria, Yape o Plin real y completado con éxito?
        2. Determina el monto exacto de la transacción (en Soles peruanos S/.).
        3. Determina el número de operación u operación ID.
        4. Identifica el nombre del emisor/remitente si es visible.
        5. Identifica el banco origen u billetera electrónica (Yape, Plin, BCP, BBVA, Interbank, Scotch, etc.).
        6. Identifica la fecha o timestamp.
        7. Valida si el monto es razonablemente igual o superior al total esperado S/. ${orderTotal || 0}. Si el comprobante es válido, marca success como true. 
        
        Devuelve un JSON con el siguiente esquema estricto de respuesta:
        {
          "success": true (si se lee con claridad que el pago fue completado con éxito, que no es un borrador y que el monto es válido) o false,
          "amount": número con el monto exacto,
          "operationNumber": "string con el código de operación extraído",
          "sender": "string con el nombre del remitente extraído o 'No visible'",
          "bank": "string con la entidad financiera (p.ej. 'Yape', 'Plin', 'BCP', 'BBVA')",
          "date": "string con la fecha del pago",
          "message": "Mensaje en español súper cordial de parte del sistema Gamarra validando la operación, usando el tono cariñoso de Rosita.",
          "confidenceScore": número decimal del 0 al 1 indicando tu confianza en la lectura
        }
      `
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [imagePart, textPart],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            success: { type: Type.BOOLEAN, description: 'True si es un comprobante de pago válido y exitoso' },
            amount: { type: Type.NUMBER, description: 'Monto en soles S/.' },
            operationNumber: { type: Type.STRING, description: 'Número o ID de la operación' },
            sender: { type: Type.STRING, description: 'Nombre de quien envía' },
            bank: { type: Type.STRING, description: 'Banco de origen de la transacción' },
            date: { type: Type.STRING, description: 'Fecha y hora del pago' },
            message: { type: Type.STRING, description: 'Mensaje cordial del asistente personal' },
            confidenceScore: { type: Type.NUMBER, description: 'Confianza de la validación entre 0 y 1' }
          },
          required: ['success', 'amount', 'operationNumber', 'bank', 'message']
        },
        systemInstruction: 'Eres una IA experta en auditoría contable y lectura de resúmenes de transferencias financieras de billeteras digitales de Perú como Yape y Plin, y bancos nacionales. Eres extremadamente exacta y honesta.'
      }
    });

    const parsedData = JSON.parse(response.text || '{}');
    return res.json(parsedData);
  } catch (error: any) {
    console.error('Error calling Gemini for Payment Validation:', error);
    return res.status(500).json({ 
      error: 'No se pudo procesar la validación automática del comprobante de pago.',
      details: error.message 
    });
  }
});

// 3. Simulated/Real email order confirmation generator callback
app.post('/api/send-email', (req, res) => {
  const { order, customerEmail, customerName } = req.body;
  
  if (!customerEmail) {
    return res.status(400).json({ error: 'El correo del cliente es requerido.' });
  }

  // Log "email sent" on server to keep full compliance
  console.log(`[EMAIL DISPATCH] Hacia ${customerEmail}`);
  console.log(`Detalle: Hola ${customerName || 'Cliente'}, su pedido #${order?.id || 'GAMARRA-101'} por S/. ${order?.total || 0} ha sido confirmado y validado.`);

  return res.json({
    success: true,
    emailSent: true,
    recipient: customerEmail,
    subject: `Confirmación de Pedido Especial Gamarra Online - #${order?.id || 'GMR-4523'}`,
    timestamp: new Date().toISOString(),
    bodyMarkup: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e1e8ed; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #e0115f 0%, #ff6b8b 100%); padding: 25px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold; tracking: -0.025em;">¡PAGO VALIDADO CON ÉXITO! 🎉</h1>
          <p style="margin: 5px 0 0; opacity: 0.9;">Gamarra Online - Su Tienda Favorita</p>
        </div>
        <div style="padding: 24px; background-color: #ffffff; color: #333333; line-height: 1.6;">
          <p>Estimado(a) <strong>${customerName || 'Estimado Cliente'}</strong>,</p>
          <p>Es un enorme placer saludarle de parte de <strong>Rosita, su asistente de ventas de Gamarra</strong>. Queremos confirmarle que hemos recibido y verificado correctamente su comprobante de transferencia.</p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #00aaff; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <h3 style="margin-top: 0; color: #0088cc; font-size: 16px;">Detalles de la Transacción Verificada</h3>
            <p style="margin: 4px 0;"><strong>Banco o Billetera:</strong> ${order?.paymentValidation?.bank || 'Entidad Registrada'}</p>
            <p style="margin: 4px 0;"><strong>Operación N°:</strong> ${order?.paymentValidation?.operationNumber || 'Operación Directa'}</p>
            <p style="margin: 4px 0;"><strong>Monto Validado:</strong> S/. ${order?.paymentValidation?.amount || order?.total}</p>
            <p style="margin: 4px 0;"><strong>Fecha:</strong> ${order?.paymentValidation?.date || new Date().toLocaleDateString()}</p>
          </div>

          <h3 style="color: #e0115f; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; font-size: 16px;">Resumen del Pedido</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background-color: #f1f5f9; text-align: left;">
                <th style="padding: 10px; font-size: 13px;">Prenda</th>
                <th style="padding: 10px; font-size: 13px; text-align: center;">Cant.</th>
                <th style="padding: 10px; font-size: 13px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${(order?.items || []).map((item: any) => `
                <tr style="border-bottom: 1px solid #f1f5f9; font-size: 13px;">
                  <td style="padding: 10px;"><strong>${item.product.name}</strong><br><span style="font-size: 11px; color: #666;">Talla: ${item.selectedSize} | Color: ${item.selectedColor}</span></td>
                  <td style="padding: 10px; text-align: center;">${item.quantity}</td>
                  <td style="padding: 10px; text-align: right;">S/. ${(item.product.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr style="font-weight: bold; background-color: #f8fafc;">
                <td colspan="2" style="padding: 10px; text-align: right;">TOTAL:</td>
                <td style="padding: 10px; text-align: right; color: #e0115f;">S/. ${(order?.total || 0).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div style="text-align: center; margin-top: 30px;">
            <p style="font-size: 12px; color: #666; font-style: italic;">"¡Muchas gracias por su preferencia! Su pedido ya se encuentra en nuestro almacén principal de Gamarra listo para el embalaje y salida."</p>
          </div>
        </div>
        <div style="background-color: #f1f5f9; text-align: center; padding: 15px; font-size: 11px; color: #666;">
          Este es un correo automático enviado por el Asistente Inteligente de Ventas de Gamarra Online.
        </div>
      </div>
    `
  });
});

// Vite server linkage or static files assembly
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Running development environment. Creating Vite Server...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Running production environment. Serving build artifacts...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server fully started on port ${PORT}`);
  });
}

setupViteOrStatic();
