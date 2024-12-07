import { useState, useEffect } from 'react';
import { Box } from '@chakra-ui/react';
import CustomAd from './CustomAd';

const ads = {
  horizontal: [
    {
      id: 1,
      imageUrl: '/ads/ad1.jpg',
      title: 'Anúncio 1',
      description: 'Descrição do anúncio 1',
      link: 'https://exemplo1.com',
      weight: 2, // Peso para frequência do anúncio
    },
    // Adicione mais anúncios aqui
  ],
  vertical: [
    // Anúncios verticais
  ],
  rectangle: [
    // Anúncios retangulares
  ]
};

const AdManager = ({ format, position }) => {
  const [currentAd, setCurrentAd] = useState(null);

  useEffect(() => {
    // Função para selecionar anúncio baseado em peso
    const selectAd = () => {
      const availableAds = ads[format] || [];
      if (availableAds.length === 0) return null;

      // Cálculo baseado em peso
      const totalWeight = availableAds.reduce((sum, ad) => sum + (ad.weight || 1), 0);
      let random = Math.random() * totalWeight;
      
      for (const ad of availableAds) {
        random -= (ad.weight || 1);
        if (random <= 0) return ad;
      }
      
      return availableAds[0];
    };

    // Atualiza o anúncio periodicamente
    const updateAd = () => {
      setCurrentAd(selectAd());
    };

    updateAd();
    const interval = setInterval(updateAd, 30000); // Muda a cada 30 segundos

    return () => clearInterval(interval);
  }, [format]);

  if (!currentAd) return null;

  return (
    <Box>
      <CustomAd
        format={format}
        imageUrl={currentAd.imageUrl}
        title={currentAd.title}
        description={currentAd.description}
        link={currentAd.link}
      />
    </Box>
  );
};

export default AdManager;
