import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import SignatureCanvas from '../components/SignatureCanvas';

const DJCForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    // Resolución
    resolucion: 'Res. SIYC N° 16/2025',
    
    // Número de Identificación de DJC
    numeroDJC: '',
    
    // Información del Fabricante o Importador
    razonSocial: '',
    cuit: '',
    marca: '',
    domicilioLegal: '',
    domicilioPlanta: '',
    telefono: '',
    email: '',
    
    // Representante Autorizado
    representanteNombre: '',
    representanteDomicilio: '',
    representanteCuit: '',
    
    // Información del Producto
    codigoProducto: '',
    fabricante: '',
    identificacionProducto: '',
    
    // Normas y Evaluación de la Conformidad
    reglamentos: '',
    normasTecnicas: '',
    documentoEvaluacion: '',
    
    // Otros Datos
    enlaceDeclaracion: '',
    
    // Fecha y Lugar
    fechaLugar: format(new Date(), 'PPP', { locale: es }) + ', Buenos Aires, Argentina',
  });
  
  const [signature, setSignature] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [existingDjc, setExistingDjc] = useState<any>(null);

  useEffect(() => {
    if (isEditing && id) {
      fetchDJC(id);
    }
  }, [id, isEditing]);

  const fetchDJC = async (djcId: string) => {
    try {
      const { data, error } = await supabase
        .from('djc')
        .select('*')
        .eq('id', djcId)
        .single();

      if (error) throw error;
      
      if (data) {
        setExistingDjc(data);
        setFormData({
          resolucion: data.resolucion || 'Res. SIYC N° 16/2025',
          numeroDJC: data.numero_djc || '',
          razonSocial: data.razon_social || '',
          cuit: data.cuit || '',
          marca: data.marca || '',
          domicilioLegal: data.domicilio_legal || '',
          domicilioPlanta: data.domicilio_planta || '',
          telefono: data.telefono || '',
          email: data.email || '',
          representanteNombre: data.representante_nombre || '',
          representanteDomicilio: data.representante_domicilio || '',
          representanteCuit: data.representante_cuit || '',
          codigoProducto: data.codigo_producto || '',
          fabricante: data.fabricante || '',
          identificacionProducto: data.identificacion_producto || '',
          reglamentos: data.reglamentos || '',
          normasTecnicas: data.normas_tecnicas || '',
          documentoEvaluacion: data.documento_evaluacion || '',
          enlaceDeclaracion: data.enlace_declaracion || '',
          fechaLugar: data.fecha_lugar || (format(new Date(), 'PPP', { locale: es }) + ', Buenos Aires, Argentina'),
        });
        // Fix: Ensure signature is null if firma_url is empty or not a valid data URL
        setSignature(data.firma_url || null);
      }
    } catch (error) {
      console.error('Error fetching DJC:', error);
      toast.error('Error al cargar la declaración jurada');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (requireSignature: boolean = true) => {
    const newErrors: Record<string, string> = {};
    
    // Campos requeridos
    const requiredFields: Record<string, string> = {
      razonSocial: 'Razón Social',
      marca: 'Nombre Comercial o Marca Registrada',
      domicilioLegal: 'Domicilio Legal',
      domicilioPlanta: 'Domicilio de la Planta de Producción',
      telefono: 'Teléfono',
      email: 'Correo Electrónico',
      codigoProducto: 'Código de Identificación Único del Producto',
      fabricante: 'Fabricante',
      identificacionProducto: 'Identificación del Producto',
      reglamentos: 'Reglamento/s Aplicable/s',
      normasTecnicas: 'Norma/s Técnica/s',
      documentoEvaluacion: 'Documento de Evaluación de la Conformidad',
      fechaLugar: 'Fecha y Lugar',
    };
    
    Object.entries(requiredFields).forEach(([field, label]) => {
      if (!formData[field as keyof typeof formData]) {
        newErrors[field] = `El campo ${label} es requerido`;
      }
    });
    
    // Validar correo electrónico
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Por favor ingrese un correo electrónico válido';
    }
    
    // Validar firma solo si se requiere
    if (requireSignature && !signature) {
      newErrors.signature = 'La firma es requerida para completar la declaración';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generatePDF = async () => {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Add a page to the document
    let page = pdfDoc.addPage([595, 842]); // A4 size
    
    // Get the fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Set the font size and color
    const titleFontSize = 16;
    const sectionFontSize = 14;
    const normalFontSize = 12;
    const textColor = rgb(0, 0, 0);
    
    // Set margins
    const margin = 50;
    const pageWidth = page.getWidth() - margin * 2;
    
    // Helper function to add text
    let currentY = page.getHeight() - margin;
    
    const addText = (text: string, fontSize: number, font: typeof helveticaFont, indent = 0) => {
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = fontSize * 1.2;
      
      // Check if we need a new page
      if (currentY < margin + textHeight) {
        const newPage = pdfDoc.addPage([595, 842]);
        page = newPage;
        currentY = page.getHeight() - margin;
      }
      
      page.drawText(text, {
        x: margin + indent,
        y: currentY,
        size: fontSize,
        font: font,
        color: textColor,
        maxWidth: pageWidth - indent,
      });
      
      currentY -= textHeight;
      return textHeight;
    };
    
    const addWrappedText = (text: string, fontSize: number, font: typeof helveticaFont, indent = 0) => {
      const words = text.split(' ');
      let line = '';
      const maxWidth = pageWidth - indent;
      
      for (const word of words) {
        const testLine = line + (line ? ' ' : '') + word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);
        
        if (testWidth > maxWidth) {
          addText(line, fontSize, font, indent);
          line = word;
        } else {
          line = testLine;
        }
      }
      
      if (line) {
        addText(line, fontSize, font, indent);
      }
    };
    
    // Add title
    addText('DECLARACIÓN JURADA DE CONFORMIDAD (DJC)', titleFontSize, helveticaBold);
    
    // Add resolution
    currentY -= 10;
    addText(formData.resolucion, normalFontSize, helveticaFont);
    
    // Add DJC Number if provided
    if (formData.numeroDJC) {
      addText(`Número de Identificación de DJC: ${formData.numeroDJC}`, normalFontSize, helveticaFont);
    }
    
    currentY -= 20;
    
    // Información del Fabricante o Importador
    addText('Información del Fabricante o Importador', sectionFontSize, helveticaBold);
    currentY -= 10;
    
    addText(`Razón Social: ${formData.razonSocial}`, normalFontSize, helveticaFont);
    if (formData.cuit) {
      addText(`C.U.I.T. N°: ${formData.cuit}`, normalFontSize, helveticaFont);
    }
    addText(`Nombre Comercial o Marca Registrada: ${formData.marca}`, normalFontSize, helveticaFont);
    addText(`Domicilio Legal: ${formData.domicilioLegal}`, normalFontSize, helveticaFont);
    addText(`Domicilio de la Planta de Producción o Depósito: ${formData.domicilioPlanta}`, normalFontSize, helveticaFont);
    addText(`Teléfono: ${formData.telefono}`, normalFontSize, helveticaFont);
    addText(`Correo Electrónico: ${formData.email}`, normalFontSize, helveticaFont);
    
    currentY -= 20;
    
    // Representante Autorizado
    if (formData.representanteNombre || formData.representanteDomicilio || formData.representanteCuit) {
      addText('Representante Autorizado (si corresponde)', sectionFontSize, helveticaBold);
      currentY -= 10;
      
      if (formData.representanteNombre) {
        addText(`Nombre y Apellido / Razón Social: ${formData.representanteNombre}`, normalFontSize, helveticaFont);
      }
      if (formData.representanteDomicilio) {
        addText(`Domicilio Legal: ${formData.representanteDomicilio}`, normalFontSize, helveticaFont);
      }
      if (formData.representanteCuit) {
        addText(`C.U.I.T. N°: ${formData.representanteCuit}`, normalFontSize, helveticaFont);
      }
      
      currentY -= 20;
    }
    
    // Información del Producto
    addText('Información del Producto', sectionFontSize, helveticaBold);
    currentY -= 10;
    
    addText(`Código de Identificación Único del Producto: ${formData.codigoProducto}`, normalFontSize, helveticaFont);
    addText('Fabricante (Incluir domicilio de la planta):', normalFontSize, helveticaFont);
    addWrappedText(formData.fabricante, normalFontSize, helveticaFont, 10);
    
    addText('Identificación del Producto (marca, modelo, características):', normalFontSize, helveticaFont);
    addWrappedText(formData.identificacionProducto, normalFontSize, helveticaFont, 10);
    
    currentY -= 20;
    
    // Normas y Evaluación de la Conformidad
    addText('Normas y Evaluación de la Conformidad', sectionFontSize, helveticaBold);
    currentY -= 10;
    
    addText('Reglamento/s Aplicable/s:', normalFontSize, helveticaFont);
    addWrappedText(formData.reglamentos, normalFontSize, helveticaFont, 10);
    
    addText('Norma/s Técnica/s:', normalFontSize, helveticaFont);
    addWrappedText(formData.normasTecnicas, normalFontSize, helveticaFont, 10);
    
    addText(`Referencia al Documento de Evaluación de la Conformidad: ${formData.documentoEvaluacion}`, normalFontSize, helveticaFont);
    
    currentY -= 20;
    
    // Otros Datos
    if (formData.enlaceDeclaracion) {
      addText('Otros Datos', sectionFontSize, helveticaBold);
      currentY -= 10;
      
      addText(`Enlace a la Declaración de Conformidad en Internet: ${formData.enlaceDeclaracion}`, normalFontSize, helveticaFont);
      
      currentY -= 20;
    }
    
    // Fecha, Lugar y Firma
    addText('Fecha, Lugar y Firma', sectionFontSize, helveticaBold);
    currentY -= 10;
    
    addText(`Fecha y Lugar: ${formData.fechaLugar}`, normalFontSize, helveticaFont);
    
    // Add signature image if available
    if (signature) {
      currentY -= 20;
      
      try {
        // Convert data URL to Uint8Array
        const signatureParts = signature.split(',');
        if (signatureParts.length > 1) {
          const signatureBase64 = signatureParts[1];
          const signatureBytes = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));
          
          // Embed the signature image
          const signatureImage = await pdfDoc.embedPng(signatureBytes);
          const signatureDims = signatureImage.scale(0.3); // Scale to approximately 100x50px
          
          page.drawImage(signatureImage, {
            x: margin,
            y: currentY - signatureDims.height,
            width: signatureDims.width,
            height: signatureDims.height,
          });
        }
      } catch (error) {
        console.error('Error embedding signature in PDF:', error);
        // Continue without the signature if there's an error
      }
    }
    
    // Serialize the PDFDocument to bytes
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  };

  const saveFormData = async (generatePdfAndSignature: boolean = true) => {
    const isValid = validateForm(!generatePdfAndSignature); // Solo requerir firma si estamos generando el PDF completo
    
    if (!isValid) {
      // Focus on the first field with an error
      const firstErrorField = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        (element as HTMLElement).focus();
      }
      
      toast.error('Por favor complete todos los campos requeridos');
      return false;
    }
    
    try {
      setIsSubmitting(true);
      
      // Variables para URLs
      let pdfUrl = existingDjc?.pdf_url || null;
      let signatureUrl = existingDjc?.firma_url || null;
      
      // Generar y subir PDF y firma solo si es necesario
      if (generatePdfAndSignature) {
        // Generate PDF
        const pdfBytes = await generatePDF();
        const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        // Convert signature to Blob if exists
        let signatureBlob = null;
        if (signature) {
          try {
            const base64Response = await fetch(signature);
            signatureBlob = await base64Response.blob();
          } catch (error) {
            console.error('Error converting signature to blob:', error);
            toast.error('Error al procesar la firma. Por favor intente nuevamente.');
            return false;
          }
        }
        
        // Upload PDF
        if (pdfBlob) {
          const pdfFileName = `djc_${formData.codigoProducto}_${Date.now()}.pdf`;
          const { data: pdfData, error: pdfError } = await supabase.storage
            .from('djc_documents')
            .upload(pdfFileName, pdfBlob);
          
          if (pdfError) throw pdfError;
          
          const { data: pdfUrlData } = supabase.storage
            .from('djc_documents')
            .getPublicUrl(pdfFileName);
          
          pdfUrl = pdfUrlData.publicUrl;
        }
        
        // Upload Signature if exists
        if (signatureBlob) {
          const signatureFileName = `signature_${formData.codigoProducto}_${Date.now()}.png`;
          const { data: signatureData, error: signatureError } = await supabase.storage
            .from('djc_documents')
            .upload(signatureFileName, signatureBlob);
          
          if (signatureError) throw signatureError;
          
          const { data: signatureUrlData } = supabase.storage
            .from('djc_documents')
            .getPublicUrl(signatureFileName);
          
          signatureUrl = signatureUrlData.publicUrl;
        }
        
        // Descargar el PDF si se generó
        if (pdfBlob) {
          saveAs(pdfBlob, 'DJC.pdf');
        }
      }
      
      // Preparar datos para guardar
      const djcData = {
        resolucion: formData.resolucion,
        numero_djc: formData.numeroDJC,
        razon_social: formData.razonSocial,
        cuit: formData.cuit,
        marca: formData.marca,
        domicilio_legal: formData.domicilioLegal,
        domicilio_planta: formData.domicilioPlanta,
        telefono: formData.telefono,
        email: formData.email,
        representante_nombre: formData.representanteNombre,
        representante_domicilio: formData.representanteDomicilio,
        representante_cuit: formData.representanteCuit,
        codigo_producto: formData.codigoProducto,
        fabricante: formData.fabricante,
        identificacion_producto: formData.identificacionProducto,
        reglamentos: formData.reglamentos,
        normas_tecnicas: formData.normasTecnicas,
        documento_evaluacion: formData.documentoEvaluacion,
        enlace_declaracion: formData.enlaceDeclaracion,
        fecha_lugar: formData.fechaLugar,
        firma_url: generatePdfAndSignature ? signatureUrl : existingDjc?.firma_url || null,
        pdf_url: generatePdfAndSignature ? pdfUrl : existingDjc?.pdf_url || null,
        created_by: user?.id,
        producto_id: formData.codigoProducto
      };
      
      // Determine changed fields for history
      let changedFields = {};
      if (isEditing && existingDjc) {
        changedFields = Object.keys(djcData).reduce((acc, key) => {
          if (djcData[key] !== existingDjc[key]) {
            acc[key] = djcData[key];
          }
          return acc;
        }, {});
      }
      
      // Guardar en la base de datos
      if (isEditing) {
        // Actualizar declaración existente
        const { error: updateError } = await supabase
          .from('djc')
          .update(djcData)
          .eq('id', id);
        
        if (updateError) throw updateError;
        
        // Registrar en el historial si hay cambios
        if (Object.keys(changedFields).length > 0) {
          const historyEntry = {
            djc_id: id,
            action: signature && !existingDjc.firma_url ? 'sign' : 'update',
            changed_fields: changedFields,
            created_by: user?.id
          };
          
          const { error: historyError } = await supabase
            .from('djc_history')
            .insert([historyEntry]);
          
          if (historyError) throw historyError;
        }
        
        toast.success(generatePdfAndSignature 
          ? 'Declaración Jurada actualizada y firmada exitosamente' 
          : 'Declaración Jurada actualizada exitosamente');
      } else {
        // Crear nueva declaración
        const { data: insertedDjc, error: insertError } = await supabase
          .from('djc')
          .insert([djcData])
          .select()
          .single();
        
        if (insertError) throw insertError;
        
        // Registrar en el historial
        const historyEntry = {
          djc_id: insertedDjc.id,
          action: 'create',
          changed_fields: djcData,
          created_by: user?.id
        };
        
        const { error: historyError } = await supabase
          .from('djc_history')
          .insert([historyEntry]);
        
        if (historyError) throw historyError;
        
        toast.success(generatePdfAndSignature 
          ? 'Declaración Jurada creada y firmada exitosamente' 
          : 'Declaración Jurada guardada exitosamente');
      }
      
      return true;
    } catch (error) {
      console.error('Error al guardar la declaración jurada:', error);
      toast.error('Error al guardar la declaración jurada. Por favor intente nuevamente.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await saveFormData(true);
    if (success) {
      navigate('/djc');
    }
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await saveFormData(false);
    if (success) {
      navigate('/djc');
    }
  };

  // CSS classes for form inputs
  const inputClasses = "block w-full rounded-md shadow-sm sm:text-sm border-2 border-gray-300 px-4 py-2.5 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors";
  const inputErrorClasses = "block w-full rounded-md shadow-sm sm:text-sm border-2 border-red-300 px-4 py-2.5 bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors";
  const labelClasses = "block text-sm font-medium text-gray-700 mb-1";
  const labelRequiredClasses = "block text-sm font-medium text-gray-700 mb-1 after:content-['*'] after:ml-0.5 after:text-red-500";

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? 'Editar Declaración Jurada de Conformidad (DJC)' : 'Nueva Declaración Jurada de Conformidad (DJC)'}
      </h1>
      
      {/* Selector de Resolución */}
      <div className="mb-6">
        <label htmlFor="resolucion" className={labelRequiredClasses}>
          Resolución SIYC
        </label>
        <select
          id="resolucion"
          name="resolucion"
          value={formData.resolucion}
          onChange={handleChange}
          className={inputClasses}
          required
        >
          <option value="Res. SIYC N° 16/2025">Res. SIYC N° 16/2025</option>
          <option value="Res. SIYC N° 17/2025">Res. SIYC N° 17/2025</option>
          <option value="Res. SIYC N° 236/24 - Materiales para instalaciones eléctricas">Res. SIYC N° 236/24 - Materiales para instalaciones eléctricas</option>
        </select>
      </div>
      
      {/* Número de Identificación de DJC */}
      <div className="mb-6">
        <label htmlFor="numeroDJC" className={labelClasses}>
          Número de Identificación de DJC
        </label>
        <input
          type="text"
          id="numeroDJC"
          name="numeroDJC"
          value={formData.numeroDJC}
          onChange={handleChange}
          className={errors.numeroDJC ? inputErrorClasses : inputClasses}
        />
        {errors.numeroDJC && (
          <p className="mt-1 text-sm text-red-600">{errors.numeroDJC}</p>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Información del Fabricante o Importador */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Información del Fabricante o Importador</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="razonSocial" className={labelRequiredClasses}>
                Razón Social
              </label>
              <input
                type="text"
                id="razonSocial"
                name="razonSocial"
                value={formData.razonSocial}
                onChange={handleChange}
                className={errors.razonSocial ? inputErrorClasses : inputClasses}
                required
              />
              {errors.razonSocial && (
                <p className="mt-1 text-sm text-red-600">{errors.razonSocial}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="cuit" className={labelClasses}>
                C.U.I.T. N°
              </label>
              <input
                type="text"
                id="cuit"
                name="cuit"
                value={formData.cuit}
                onChange={handleChange}
                className={inputClasses}
              />
            </div>
            
            <div>
              <label htmlFor="marca" className={labelRequiredClasses}>
                Nombre Comercial o Marca Registrada
              </label>
              <input
                type="text"
                id="marca"
                name="marca"
                value={formData.marca}
                onChange={handleChange}
                className={errors.marca ? inputErrorClasses : inputClasses}
                required
              />
              {errors.marca && (
                <p className="mt-1 text-sm text-red-600">{errors.marca}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="domicilioLegal" className={labelRequiredClasses}>
                Domicilio Legal
              </label>
              <input
                type="text"
                id="domicilioLegal"
                name="domicilioLegal"
                value={formData.domicilioLegal}
                onChange={handleChange}
                className={errors.domicilioLegal ? inputErrorClasses : inputClasses}
                required
              />
              {errors.domicilioLegal && (
                <p className="mt-1 text-sm text-red-600">{errors.domicilioLegal}</p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="domicilioPlanta" className={labelRequiredClasses}>
                Domicilio de la Planta de Producción o Depósito
              </label>
              <input
                type="text"
                id="domicilioPlanta"
                name="domicilioPlanta"
                value={formData.domicilioPlanta}
                onChange={handleChange}
                className={errors.domicilioPlanta ? inputErrorClasses : inputClasses}
                required
              />
              {errors.domicilioPlanta && (
                <p className="mt-1 text-sm text-red-600">{errors.domicilioPlanta}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="telefono" className={labelRequiredClasses}>
                Teléfono
              </label>
              <input
                type="text"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className={errors.telefono ? inputErrorClasses : inputClasses}
                required
              />
              {errors.telefono && (
                <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="email" className={labelRequiredClasses}>
                Correo Electrónico
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? inputErrorClasses : inputClasses}
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Representante Autorizado */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Representante Autorizado (si corresponde)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="representanteNombre" className={labelClasses}>
                Nombre y Apellido / Razón Social
              </label>
              <input
                type="text"
                id="representanteNombre"
                name="representanteNombre"
                value={formData.representanteNombre}
                onChange={handleChange}
                className={inputClasses}
              />
            </div>
            
            <div>
              <label htmlFor="representanteDomicilio" className={labelClasses}>
                Domicilio Legal
              </label>
              <input
                type="text"
                id="representanteDomicilio"
                name="representanteDomicilio"
                value={formData.representanteDomicilio}
                onChange={handleChange}
                className={inputClasses}
              />
            </div>
            
            <div>
              <label htmlFor="representanteCuit" className={labelClasses}>
                C.U.I.T. N°
              </label>
              <input
                type="text"
                id="representanteCuit"
                name="representanteCuit"
                value={formData.representanteCuit}
                onChange={handleChange}
                className={inputClasses}
              />
            </div>
          </div>
        </div>
        
        {/* Información del Producto */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Información del Producto</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="codigoProducto" className={labelRequiredClasses}>
                Código de Identificación Único del Producto
              </label>
              <input
                type="text"
                id="codigoProducto"
                name="codigoProducto"
                value={formData.codigoProducto}
                onChange={handleChange}
                className={errors.codigoProducto ? inputErrorClasses : inputClasses}
                required
              />
              {errors.codigoProducto && (
                <p className="mt-1 text-sm text-red-600">{errors.codigoProducto}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="fabricante" className={labelRequiredClasses}>
                Fabricante (Incluir domicilio de la planta)
              </label>
              <textarea
                id="fabricante"
                name="fabricante"
                rows={3}
                value={formData.fabricante}
                onChange={handleChange}
                className={errors.fabricante ? inputErrorClasses : inputClasses}
                required
              />
              {errors.fabricante && (
                <p className="mt-1 text-sm text-red-600">{errors.fabricante}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="identificacionProducto" className={labelRequiredClasses}>
                Identificación del Producto (marca, modelo, características)
              </label>
              <textarea
                id="identificacionProducto"
                name="identificacionProducto"
                rows={3}
                value={formData.identificacionProducto}
                onChange={handleChange}
                className={errors.identificacionProducto ? inputErrorClasses : inputClasses}
                required
              />
              {errors.identificacionProducto && (
                <p className="mt-1 text-sm text-red-600">{errors.identificacionProducto}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Normas y Evaluación de la Conformidad */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Normas y Evaluación de la Conformidad</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="reglamentos" className={labelRequiredClasses}>
                Reglamento/s Aplicable/s
              </label>
              <textarea
                id="reglamentos"
                name="reglamentos"
                rows={3}
                value={formData.reglamentos}
                onChange={handleChange}
                className={errors.reglamentos ? inputErrorClasses : inputClasses}
                required
              />
              {errors.reglamentos && (
                <p className="mt-1 text-sm text-red-600">{errors.reglamentos}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="normasTecnicas" className={labelRequiredClasses}>
                Norma/s Técnica/s
              </label>
              <textarea
                id="normasTecnicas"
                name="normasTecnicas"
                rows={3}
                value={formData.normasTecnicas}
                onChange={handleChange}
                className={errors.normasTecnicas ? inputErrorClasses : inputClasses}
                required
              />
              {errors.normasTecnicas && (
                <p className="mt-1 text-sm text-red-600">{errors.normasTecnicas}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="documentoEvaluacion" className={labelRequiredClasses}>
                Referencia al Documento de Evaluación de la Conformidad
              </label>
              <input
                type="text"
                id="documentoEvaluacion"
                name="documentoEvaluacion"
                value={formData.documentoEvaluacion}
                onChange={handleChange}
                className={errors.documentoEvaluacion ? inputErrorClasses : inputClasses}
                required
              />
              {errors.documentoEvaluacion && (
                <p className="mt-1 text-sm text-red-600">{errors.documentoEvaluacion}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Otros Datos */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Otros Datos</h2>
          <div>
            <label htmlFor="enlaceDeclaracion" className={labelClasses}>
              Enlace a la Declaración de Conformidad en Internet
            </label>
            <input
              type="url"
              id="enlaceDeclaracion"
              name="enlaceDeclaracion"
              value={formData.enlaceDeclaracion}
              onChange={handleChange}
              className={inputClasses}
              placeholder="https://ejemplo.com/declaracion"
            />
          </div>
        </div>
        
        {/* Fecha, Lugar y Firma */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Fecha, Lugar y Firma</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="fechaLugar" className={labelRequiredClasses}>
                Fecha y Lugar
              </label>
              <input
                type="text"
                id="fechaLugar"
                name="fechaLugar"
                value={formData.fechaLugar}
                onChange={handleChange}
                className={errors.fechaLugar ? inputErrorClasses : inputClasses}
                required
              />
              {errors.fechaLugar && (
                <p className="mt-1 text-sm text-red-600">{errors.fechaLugar}</p>
              )}
            </div>
            
            <div>
              <label className={labelClasses}>
                Firma (Opcional para guardar como borrador)
              </label>
              <SignatureCanvas onSignatureChange={setSignature} initialSignature={signature} />
              {errors.signature && (
                <p className="mt-1 text-sm text-red-600">{errors.signature}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Submit Buttons */}
        <div className="flex justify-end pt-5 space-x-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="inline-flex justify-center rounded-md border-2 border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar borrador'}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center rounded-md border-2 border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
                  <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando...
              </span>
            ) : (
              'Finalizar y generar PDF'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DJCForm;