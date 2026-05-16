import { useEffect } from 'react';
import { useGetSettingsQuery } from '@/features/api/settingsApi';

const SEOHead = () => {
  const { data: settingsData } = useGetSettingsQuery();
  const settings = settingsData?.settings;

  useEffect(() => {
    if (!settings) return;

    // Get base URL (for absolute image URLs)
    const baseUrl = window.location.origin;
    const currentPath = window.location.pathname;
    const siteUrl = `${baseUrl}${currentPath}`;
    
    // Set default values
    const siteTitle = settings.siteTitle || settings.companyName || 'Robowunder LMS';
    const siteDescription = settings.siteDescription || 'Learn robotics and STEM skills with Robowunder';
    let siteThumbnail = settings.siteThumbnail || settings.logoUrl || '';
    
    // Ensure absolute HTTPS URL for thumbnail (required for WhatsApp, Facebook, etc.)
    if (siteThumbnail) {
      // Convert http to https (required by WhatsApp)
      if (siteThumbnail.startsWith('http://')) {
        siteThumbnail = siteThumbnail.replace('http://', 'https://');
      } 
      // If it's not a full URL (Cloudinary URLs are already absolute), make it absolute
      else if (!siteThumbnail.startsWith('https://')) {
        // Make relative URL absolute
        if (siteThumbnail.startsWith('/')) {
          siteThumbnail = `${baseUrl}${siteThumbnail}`;
        } else {
          siteThumbnail = `${baseUrl}/${siteThumbnail}`;
        }
      }
    }
    
    // Detect image MIME type from URL extension (for og:image:type)
    const getImageMimeType = (url) => {
      if (!url) return 'image/jpeg';
      const lowerUrl = url.toLowerCase();
      // Check URL extension
      if (lowerUrl.match(/\.png(\?|$)/)) return 'image/png';
      if (lowerUrl.match(/\.(jpg|jpeg)(\?|$)/)) return 'image/jpeg';
      if (lowerUrl.match(/\.webp(\?|$)/)) return 'image/webp';
      if (lowerUrl.match(/\.gif(\?|$)/)) return 'image/gif';
      // Default to jpeg (most compatible)
      return 'image/jpeg';
    };
    
    const imageMimeType = siteThumbnail ? getImageMimeType(siteThumbnail) : 'image/jpeg';

    // Update document title
    document.title = siteTitle;

    // Function to update or create meta tag by property (for Open Graph)
    const updateMetaTag = (property, content) => {
      if (!content) return;
      
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Function to update or create meta tag by name
    const updateMetaTagByName = (name, content) => {
      if (!content) return;
      
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Update standard meta tags
    updateMetaTagByName('description', siteDescription);
    updateMetaTagByName('keywords', 'robotics, STEM, education, LMS, Robowunder');

    // Update Open Graph meta tags (for Facebook, WhatsApp, LinkedIn, etc.)
    updateMetaTag('og:type', 'website');
    updateMetaTag('og:title', siteTitle);
    updateMetaTag('og:description', siteDescription);
    updateMetaTag('og:url', siteUrl);
    updateMetaTag('og:site_name', settings.companyName || 'Robowunder LMS');
    updateMetaTag('og:locale', 'en_US');
    
    // Update Open Graph image tags (critical for WhatsApp/Facebook)
    if (siteThumbnail) {
      // WhatsApp requires: og:image with absolute HTTPS URL
      // These tags MUST be set for WhatsApp to show the image
      updateMetaTag('og:image', siteThumbnail);
      updateMetaTag('og:image:secure_url', siteThumbnail); // HTTPS URL (required)
      updateMetaTag('og:image:url', siteThumbnail); // Alternative format
      updateMetaTag('og:image:width', '1200'); // Recommended size
      updateMetaTag('og:image:height', '630'); // Recommended size
      updateMetaTag('og:image:type', imageMimeType); // MIME type
      updateMetaTag('og:image:alt', siteTitle); // Alt text
      
      // Also add standard image meta tag
      updateMetaTagByName('image', siteThumbnail);
    }

    // Update Twitter Card meta tags
    updateMetaTagByName('twitter:card', 'summary_large_image');
    updateMetaTagByName('twitter:title', siteTitle);
    updateMetaTagByName('twitter:description', siteDescription);
    if (siteThumbnail) {
      updateMetaTagByName('twitter:image', siteThumbnail);
      updateMetaTagByName('twitter:image:alt', siteTitle);
    }

    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', siteUrl);

    // Verify and log meta tags
    console.log('🔍 SEO Meta Tags Updated:');
    console.log('Title:', siteTitle);
    console.log('Description:', siteDescription);
    console.log('Thumbnail URL:', siteThumbnail || 'NOT SET');
    console.log('Image MIME Type:', imageMimeType);
    
    // Verify og:image tag is set correctly
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (siteThumbnail && ogImage) {
      const imageUrl = ogImage.getAttribute('content');
      console.log('✅ og:image tag found:', imageUrl);
      console.log('✅ Image URL is HTTPS:', imageUrl?.startsWith('https://'));
      console.log('✅ Image URL is absolute:', imageUrl?.startsWith('http'));
      
      // Verify image is accessible (test load)
      const testImg = new Image();
      testImg.onload = () => {
        console.log('✅ Thumbnail image is accessible and loaded successfully');
      };
      testImg.onerror = () => {
        console.error('❌ Thumbnail image failed to load! URL might be invalid or inaccessible:', imageUrl);
      };
      testImg.src = imageUrl;
    } else if (!siteThumbnail) {
      console.warn('⚠️ No thumbnail set in settings! Please upload a site thumbnail in Admin → Settings → Website Settings');
    } else {
      console.warn('⚠️ og:image tag NOT found in DOM! This will cause WhatsApp to not show the image.');
    }

  }, [settings]);

  // This component doesn't render anything
  return null;
};

export default SEOHead;

