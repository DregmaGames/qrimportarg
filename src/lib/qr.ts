import QRCode from 'qrcode';
import { supabase } from './supabase';

export async function generateQRCode(productId: string): Promise<string> {
  try {
    // Generate QR code for the landing page URL
    const qrDataUrl = await QRCode.toDataURL(`${window.location.origin}/qr/${productId}`, {
      type: 'image/png',
      width: 1000,
      margin: 1,
      errorCorrectionLevel: 'H', // Highest error correction level
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    // Convert base64 to blob
    const base64Data = qrDataUrl.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

export async function uploadQRCode(
  qrBlob: Blob,
  productId: string,
  version: number
): Promise<string> {
  const fileName = `qr_${productId}_v${version}.png`;
  
  try {
    const { data, error } = await supabase.storage
      .from('certificates')
      .upload(`qr/${fileName}`, qrBlob, {
        contentType: 'image/png',
        cacheControl: '31536000' // 1 year cache
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('certificates')
      .getPublicUrl(`qr/${fileName}`);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading QR code:', error);
    throw error;
  }
}