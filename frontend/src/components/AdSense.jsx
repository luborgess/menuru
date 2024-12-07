import { useEffect } from 'react';
import { Box } from '@chakra-ui/react';

const AdSense = ({ slot, format = 'auto', responsive = true, style = {} }) => {
  useEffect(() => {
    try {
      // Sempre que o componente montar, tenta carregar os anúncios
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('Error loading AdSense:', err);
    }
  }, []);

  return (
    <Box
      as="ins"
      className="adsbygoogle"
      style={style}
      data-ad-client="ca-pub-6208007749288227"
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive}
    />
  );
};

export default AdSense;
