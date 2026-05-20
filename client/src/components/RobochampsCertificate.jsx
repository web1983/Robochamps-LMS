import React, { useRef, forwardRef } from 'react';
import { Button } from './ui/button';
import { Download, Award } from 'lucide-react';
import { useGetSettingsQuery } from '@/features/api/settingsApi';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

const DEFAULT_LOGO_URL =
  "https://res.cloudinary.com/dtj4pbuvg/image/upload/q_auto/f_auto/v1779183520/Group_1000002763_ssbduq.png";

const RobochampsCertificate = forwardRef(({ userName, completionDate, isPreview = false }, ref) => {
  const { data: settingsData } = useGetSettingsQuery();
  const certificateRef = useRef(null);
  
  const settings = settingsData?.settings;
  const logoUrl = settings?.logoUrl || DEFAULT_LOGO_URL;
  const signatureUrl = 'https://res.cloudinary.com/dmlk8egiw/image/upload/v1766400837/Untitled_design_49_suxtjh.png';
  const year = new Date(completionDate).getFullYear();
  const formattedDate = new Date(completionDate).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const downloadCertificate = async () => {
    if (!certificateRef.current) return;

    try {
      toast.loading('Generating certificate...');
      
      // Wait for images to load
      if (logoUrl) {
        await new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = resolve;
          img.onerror = resolve; // Continue even if image fails
          img.src = logoUrl;
        });
      }

      // Wait for signature image to load
      if (signatureUrl) {
        await new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = resolve;
          img.onerror = resolve; // Continue even if image fails
          img.src = signatureUrl;
        });
      }

      // Scroll the certificate element into view to ensure it's fully rendered
      certificateRef.current.scrollIntoView({ behavior: 'auto', block: 'center' });
      
      // Wait a bit for all styles and images to render
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const element = certificateRef.current;
      
      // Save original styles
      const originalMaxHeight = element.style.maxHeight;
      const originalMaxWidth = element.style.maxWidth;
      
      // Temporarily remove maxHeight/maxWidth constraints to ensure full A4 size is rendered
      element.style.maxHeight = 'none';
      element.style.maxWidth = 'none';
      
      // Force reflow to apply style changes
      void element.offsetHeight;
      
      // Wait for layout to update
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Get the element's actual dimensions (should be full A4 size now)
      const rect = element.getBoundingClientRect();
      const elementWidth = rect.width;
      const elementHeight = rect.height;
      
      // Create canvas from the certificate with higher quality settings
      const canvas = await html2canvas(element, {
        scale: 4, // Higher scale for better quality (4x for crisp text and borders)
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#fffbeb', // Match certificate background
        logging: false,
        width: elementWidth,
        height: elementHeight,
        windowWidth: elementWidth,
        windowHeight: elementHeight,
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
        removeContainer: false,
        imageTimeout: 20000,
      });
      
      // Restore original styles
      element.style.maxHeight = originalMaxHeight;
      element.style.maxWidth = originalMaxWidth;

      // A4 portrait dimensions in mm (210mm x 297mm)
      const pdfWidth = 210; // A4 width in mm (portrait)
      const pdfHeight = 297; // A4 height in mm (portrait)

      // Calculate dimensions maintaining aspect ratio, always fit to height to preserve footer
      const canvasAspectRatio = canvas.width / canvas.height;
      
      // Always fit to height to ensure footer is included
      const imgHeight = pdfHeight;
      const imgWidth = pdfHeight * canvasAspectRatio;
      const xPos = (pdfWidth - imgWidth) / 2; // Center horizontally if needed
      const yPos = 0; // Align to top

      const imgData = canvas.toDataURL('image/png', 1.0); // Highest quality
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      // Add certificate image - fit to height to ensure footer is preserved
      pdf.addImage(imgData, 'PNG', xPos, yPos, imgWidth, imgHeight, undefined, 'FAST');
      pdf.save(`${userName.replace(/\s+/g, '_')}_Robochamps_Certificate_${year}.pdf`);
      
      toast.dismiss();
      toast.success('Certificate downloaded successfully!');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to download certificate');
      console.error('Error generating certificate:', error);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4" style={{ width: '100%' }}>
      {/* Certificate Preview */}
      <div 
        ref={(node) => {
          certificateRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className="shadow-2xl"
        style={{ 
          width: '210mm',
          height: '297mm',
          maxWidth: 'calc(100vw - 2rem)',
          maxHeight: '90vh',
          aspectRatio: '210/297',
          margin: '0 auto',
          border: '8px double #d97706', // amber-600 double border
          backgroundColor: '#fffbeb', // light beige background
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div 
          className="relative h-full p-8 md:p-12"
          style={{
            width: '100%',
            height: '100%',
            background: '#fffbeb', // Solid background for better PDF rendering
            boxSizing: 'border-box',
          }}
        >
          {/* Decorative L-shaped Corners */}
          <div 
            className="absolute top-4 left-4" 
            style={{ 
              width: '64px', 
              height: '64px', 
              borderTop: '4px solid #d97706', 
              borderLeft: '4px solid #d97706',
              boxSizing: 'border-box'
            }}
          ></div>
          <div 
            className="absolute top-4 right-4" 
            style={{ 
              width: '64px', 
              height: '64px', 
              borderTop: '4px solid #d97706', 
              borderRight: '4px solid #d97706',
              boxSizing: 'border-box'
            }}
          ></div>
          <div 
            className="absolute bottom-4 left-4" 
            style={{ 
              width: '64px', 
              height: '64px', 
              borderBottom: '4px solid #d97706', 
              borderLeft: '4px solid #d97706',
              boxSizing: 'border-box'
            }}
          ></div>
          <div 
            className="absolute bottom-4 right-4" 
            style={{ 
              width: '64px', 
              height: '64px', 
              borderBottom: '4px solid #d97706', 
              borderRight: '4px solid #d97706',
              boxSizing: 'border-box'
            }}
          ></div>

          {/* Content Container */}
          <div className="relative h-full flex flex-col items-center justify-between">
            {/* Header Section */}
            <div className="text-center space-y-4">
              {/* Logo */}
              {logoUrl ? (
                <div className="flex justify-center mb-4" style={{ minHeight: '80px', display: 'flex', alignItems: 'center' }}>
                  <img 
                    src={logoUrl} 
                    alt="Robochamps Logo" 
                    style={{
                      height: '80px',
                      width: '80px',
                      objectFit: 'contain',
                      display: 'block'
                    }}
                    crossOrigin="anonymous"
                    onError={(e) => {
                      // Fallback to Award icon if image fails to load
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                  <div className="flex justify-center" style={{ display: 'none' }}>
                    <Award className="h-20 w-20" style={{ color: '#d97706' }} />
                  </div>
                </div>
              ) : (
                <div className="flex justify-center mb-4" style={{ minHeight: '80px', display: 'flex', alignItems: 'center' }}>
                  <Award className="h-20 w-20" style={{ color: '#d97706', display: 'block' }} />
                </div>
              )}

              {/* Company Name */}
              <h1 className="text-3xl md:text-4xl font-bold tracking-wider" style={{ color: '#1f2937' }}>
                ROBOCHAMPS
              </h1>
              
              {/* Certificate Title */}
              <div className="space-y-2" style={{ marginTop: '16px' }}>
                <div 
                  className="mx-auto" 
                  style={{ 
                    width: '128px', 
                    height: '2px', 
                    background: '#d97706',
                    opacity: 0.5
                  }}
                ></div>
                <h2 
                  className="text-2xl font-serif italic" 
                  style={{ 
                    color: '#b45309',
                    fontSize: '24px',
                    fontWeight: 'normal',
                    fontStyle: 'italic',
                    margin: '8px 0'
                  }}
                >
                  Certificate of Participation
                </h2>
                <div 
                  className="mx-auto" 
                  style={{ 
                    width: '128px', 
                    height: '2px', 
                    background: '#d97706',
                    opacity: 0.5
                  }}
                ></div>
              </div>
            </div>

            {/* Main Content */}
            <div className="text-center space-y-6 max-w-3xl px-4">
              <p className="text-base md:text-lg leading-relaxed" style={{ color: '#374151' }}>
                This is to certify that
              </p>

              {/* Student Name */}
              <div className="my-6" style={{ margin: '24px 0' }}>
                <h3 
                  className="font-bold mb-2 font-serif" 
                  style={{ 
                    color: '#1e3a8a',
                    fontSize: '36px',
                    fontWeight: 'bold',
                    marginBottom: '8px'
                  }}
                >
                  {userName}
                </h3>
                <div 
                  className="mx-auto" 
                  style={{ 
                    width: '256px', 
                    height: '1px', 
                    backgroundColor: '#1f2937',
                    margin: '0 auto'
                  }}
                ></div>
              </div>

              {/* Description */}
              <p className="text-sm md:text-base leading-relaxed px-4" style={{ color: '#374151' }}>
                has successfully participated in the
                <br />
                <span className="font-bold" style={{ color: '#1e3a8a' }}>Robochamps International Robotics Championship 2026</span>,
                <br />
                demonstrating exceptional creativity, teamwork, and innovation
                <br />
                in the field of Robotics and STEM Education.
              </p>

              <p className="text-sm md:text-base italic pt-4" style={{ color: '#4b5563' }}>
                We appreciate your active participation and wish you continued success
                <br />
                in your future endeavors.
              </p>
            </div>

            {/* Footer Section */}
            <div className="flex justify-between items-end w-full pt-8 px-4 md:px-8">
              {/* Date */}
              <div className="text-center">
                <div className="w-32 h-0.5 mb-2" style={{ backgroundColor: '#1f2937' }}></div>
                <p className="text-xs md:text-sm" style={{ color: '#4b5563' }}>Date</p>
                <p className="text-xs md:text-sm font-semibold" style={{ color: '#1f2937' }}>{formattedDate}</p>
              </div>

              {/* Award Icon */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div 
                  className="rounded-full flex items-center justify-center" 
                  style={{ 
                    width: '64px', 
                    height: '64px', 
                    background: '#d97706',
                    borderRadius: '50%'
                  }}
                >
                  <Award className="h-10 w-10" style={{ color: '#ffffff' }} />
                </div>
              </div>

              {/* Signature */}
              <div className="text-center">
                <div className="mb-2 flex justify-center">
                  <img 
                    src={signatureUrl} 
                    alt="Authorized Signature" 
                    style={{
                      height: '60px',
                      width: 'auto',
                      objectFit: 'contain',
                      display: 'block'
                    }}
                    crossOrigin="anonymous"
                  />
                </div>
                <div className="w-32 h-0.5 mb-2 mx-auto" style={{ backgroundColor: '#1f2937' }}></div>
                <p className="text-xs md:text-sm" style={{ color: '#4b5563' }}>Authorized Signature</p>
                <p className="text-xs md:text-sm font-semibold" style={{ color: '#1f2937' }}>Robochamps Team</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Download Button */}
      {!isPreview && (
        <Button
          onClick={downloadCertificate}
          className="font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          style={{ 
            background: 'linear-gradient(to right, #d97706, #b45309)',
            color: '#ffffff'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #b45309, #92400e)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #d97706, #b45309)'}
        >
          <Download className="h-5 w-5 mr-2" />
          Download Certificate
        </Button>
      )}
    </div>
  );
});

RobochampsCertificate.displayName = 'RobochampsCertificate';

export default RobochampsCertificate;

