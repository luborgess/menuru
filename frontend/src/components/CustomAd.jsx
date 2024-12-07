import { Box, Link, Image } from '@chakra-ui/react';

const CustomAd = ({ 
  imageUrl, 
  link, 
  format = 'horizontal'
}) => {
  const heights = {
    horizontal: {
      base: '50px',
      sm: '60px',
      md: '90px',
      lg: '90px'
    },
    vertical: {
      base: '100px',
      sm: '400px',
      md: '500px',
      lg: '600px'
    },
    rectangle: {
      base: '300px',
      sm: '300px',
      md: '300px',
      lg: '300px'
    }
  };

  // Configurações específicas para cada formato
  const isRectangle = format === 'rectangle';
  const containerStyles = isRectangle ? {
    width: '100%',
    maxWidth: '300px',
    mx: 'auto'
  } : {
    width: '100vw',
    position: 'relative',
    left: '50%',
    right: '50%',
    marginLeft: '-50vw',
    marginRight: '-50vw'
  };

  return (
    <Box
      {...containerStyles}
      height={heights[format]}
      overflow="hidden"
    >
      <Link
        href={link}
        isExternal
        _hover={{ textDecoration: 'none' }}
        display="block"
        height="100%"
        width="100%"
      >
        <Box
          transition="all 0.2s"
          _hover={{ transform: 'scale(1.02)' }}
          height="100%"
          width="100%"
        >
          <Image
            src={imageUrl}
            alt="Advertisement"
            objectFit={isRectangle ? 'contain' : 'cover'}
            width="100%"
            height="100%"
          />
        </Box>
      </Link>
    </Box>
  );
};

export default CustomAd;
