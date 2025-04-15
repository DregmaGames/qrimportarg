export interface Producto {
  // Identification
  codigo_unico: string;
  
  // Product Information
  nombre_producto: string;
  marca: string;
  modelo: string;
  caracteristicas_tecnicas: string;
  materiales: string;
  capacidades_limitaciones: string;
  identificacion: string;
  resolution: string;
  
  // Manufacturer Information
  fabricante: string;
  domicilio_fabricante: string;
  
  // Documentation
  certificado_url?: string;
  djc_documento?: string;
  djc_fecha?: string;
  djc_estado: 'pendiente' | 'cargado';
  
  // QR Code
  qr_generado: boolean;
  qr_code_url?: string;
  qr_version: number;
  qr_generated_at: string;
  
  // Audit Fields
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface DeletedProduct extends Producto {
  deletion_timestamp: string;
  deleted_by: string;
  restore_deadline: string;
}

export interface DeletionLog {
  id: string;
  action_type: 'delete' | 'restore';
  product_id: string;
  performed_by: string;
  timestamp: string;
  details: Record<string, any>;
}