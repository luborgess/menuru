import { useState, useEffect } from 'react';
import {
  ChakraProvider,
  Box,
  VStack,
  Heading,
  Select,
  Text,
  Container,
  List,
  ListItem,
  useToast,
  Spinner,
  HStack,
  Button,
  Badge,
  Card,
  CardBody,
  extendTheme,
  IconButton,
  Input,
  Link,
  Icon,
  Flex,
  Grid,
  Center,
} from '@chakra-ui/react';
import axios from 'axios';
import { format, addDays, subDays, isToday, isFuture, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AdSense from './components/AdSense';
import CustomAd from './components/CustomAd';

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: '#faf7f2',
      },
    },
  },
});

// Emoji mapping for different dish types
const dishEmojis = {
  'Entrada': '🥗',
  'Acompanhamento': '🍚',
  'Guarnição': '🥘',
  'Sobremesa': '🍎',
  'Molho': '🥄',
  'Bebida': '🥤',
};

// Palavras-chave para identificar tipos de pratos
const keywordCategories = {
  vegano: [
    'vegano', 'vegana', 'tofu', 'soja', 'proteína vegetal',
    'grão de bico', 'grão-de-bico', 'lentilha', 'feijão', 'ervilha',
    'cogumelo', 'champignon', 'berinjela', 'abobrinha', 'quinoa',
    'falafel', 'homus', 'hummus', 'tabule'
  ],
  vegetariano: [
    'vegetariano', 'vegetariana', 'ovo', 'ovos', 'queijo', 'ricota',
    'leite', 'iogurte', 'requeijão', 'mussarela', 'parmesão'
  ],
  peixe: [
    'peixe', 'pescado', 'filé de peixe', 'atum', 'sardinha', 'merluza',
    'tilápia', 'bacalhau', 'salmão', 'pescada', 'camarão', 'frutos do mar'
  ],
  molho: [
    'molho', 'ao sugo', 'vinagrete', 'chimichurri', 'mostarda',
    'maionese', 'pesto', 'azeite', 'shoyu', 'tahine'
  ]
};

const API_URL = 'https://fump.ufmg.br:3003/cardapios';

function App() {
  const [restaurantes, setRestaurantes] = useState([]);
  const [selectedRestaurante, setSelectedRestaurante] = useState('');
  const [tipoRefeicao, setTipoRefeicao] = useState('Almoço');
  const [cardapio, setCardapio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const toast = useToast();

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  };

  useEffect(() => {
    fetchRestaurantes();
  }, []);

  useEffect(() => {
    if (selectedRestaurante) {
      fetchCardapio();
    }
  }, [selectedRestaurante, tipoRefeicao, selectedDate]);

  const fetchRestaurantes = async () => {
    try {
      const response = await axios.get(`${API_URL}/restaurantes`, { headers });
      setRestaurantes(response.data);
    } catch (error) {
      toast({
        title: 'Erro ao carregar restaurantes',
        description: 'Não foi possível carregar a lista de restaurantes',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchCardapio = async () => {
    setLoading(true);
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const params = {
        id: selectedRestaurante,
        dataInicio: formattedDate,
        dataFim: formattedDate
      };
      
      const response = await axios.get(`${API_URL}/cardapio`, { 
        params,
        headers 
      });

      const cardapios = response.data.cardapios;
      if (!cardapios || cardapios.length === 0) {
        setCardapio(null);
        toast({
          title: 'Cardápio não disponível',
          description: 'Não encontramos o cardápio para esta data',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Find the specific meal type
      let selectedMenu = null;
      for (const cardapio of cardapios) {
        for (const refeicao of cardapio.refeicoes) {
          if (refeicao.tipoRefeicao === tipoRefeicao) {
            selectedMenu = refeicao;
            break;
          }
        }
      }

      if (!selectedMenu) {
        setCardapio(null);
        toast({
          title: 'Cardápio não disponível',
          description: 'Tipo de refeição não encontrado para esta data',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setCardapio(selectedMenu);
    } catch (error) {
      console.error('Error fetching menu:', error);
      setCardapio(null);
      toast({
        title: 'Cardápio não disponível',
        description: 'Não foi possível carregar o cardápio',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event) => {
    const dateStr = event.target.value;
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month - 1 porque os meses em JS são 0-based
    setSelectedDate(date);
  };

  const getEmojiForType = (tipo, descricao = '') => {
    const tipoLower = tipo.toLowerCase();
    const descricaoLower = descricao.toLowerCase();
    
    // Emojis específicos para cada categoria de prato protéico
    if (tipoLower.includes('prato protéico')) {
      if (tipoLower.includes('veg')) {
        if (keywordCategories.vegano.some(keyword => descricaoLower.includes(keyword))) {
          return '🌱';
        }
        return '🥚';
      }
      if (tipoLower.includes('mar')) {
        return '🐟';
      }
      return '🍖';
    }
    
    // Para outros tipos de pratos, usa o mapeamento padrão
    for (const [key, emoji] of Object.entries(dishEmojis)) {
      if (tipoLower.includes(key.toLowerCase())) {
        return emoji;
      }
    }
    return '🍽️';
  };

  // Função para determinar a cor de fundo do cabeçalho da categoria
  const getTipoBgColor = (tipo) => {
    const tipoLower = tipo.toLowerCase();
    if (tipoLower.includes('veg')) return 'green.50';
    if (tipoLower.includes('mar')) return 'blue.50';
    if (tipoLower.includes('protéico')) return 'orange.50';
    if (tipoLower === 'entrada') return 'purple.50';
    if (tipoLower === 'acompanhamento') return 'pink.50';
    if (tipoLower === 'guarnição') return 'cyan.50';
    if (tipoLower === 'molho') return 'red.50';
    if (tipoLower === 'sobremesa') return 'teal.50';
    if (tipoLower === 'bebida') return 'gray.50';
    return 'gray.50';
  };

  // Função para determinar a cor da borda do cabeçalho
  const getTipoBorderColor = (tipo) => {
    const tipoLower = tipo.toLowerCase();
    if (tipoLower.includes('veg')) return 'green.100';
    if (tipoLower.includes('mar')) return 'blue.100';
    if (tipoLower.includes('protéico')) return 'orange.100';
    if (tipoLower === 'entrada') return 'purple.100';
    if (tipoLower === 'acompanhamento') return 'pink.100';
    if (tipoLower === 'guarnição') return 'cyan.100';
    if (tipoLower === 'molho') return 'red.100';
    if (tipoLower === 'sobremesa') return 'teal.100';
    if (tipoLower === 'bebida') return 'gray.100';
    return 'gray.100';
  };

  // Função para determinar a cor do texto do cabeçalho
  const getTipoTextColor = (tipo) => {
    const tipoLower = tipo.toLowerCase();
    if (tipoLower.includes('veg')) return 'green.700';
    if (tipoLower.includes('mar')) return 'blue.700';
    if (tipoLower.includes('protéico')) return 'orange.700';
    if (tipoLower === 'entrada') return 'purple.700';
    if (tipoLower === 'acompanhamento') return 'pink.700';
    if (tipoLower === 'guarnição') return 'cyan.700';
    if (tipoLower === 'molho') return 'red.700';
    if (tipoLower === 'sobremesa') return 'teal.700';
    if (tipoLower === 'bebida') return 'gray.700';
    return 'gray.700';
  };

  const renderPratos = (pratos) => {
    const pratosPorTipo = {};
    
    // Adiciona refresco como item padrão
    pratosPorTipo['Bebida'] = ['Refresco'];
    
    pratos.forEach((prato) => {
      // Normaliza o tipo do prato removendo números e simplificando nomes
      const descricaoLower = prato.descricaoPrato.toLowerCase();
      let tipo = prato.tipoPrato
        .replace(/\s*\d+\s*(\(.*\))?\s*/g, '') // Remove números e textos entre parênteses
        .replace(/\s+/g, ' ') // Remove espaços extras
        .trim();

      // Ignora a categoria "um copo" já que refresco é padrão
      if (tipo.toLowerCase().includes('um copo')) {
        return;
      }

      // Simplifica os nomes das categorias
      const tipoMap = {
        'Entrada': 'Entrada',
        'Acompanhamento': 'Acompanhamento',
        'Guarnição': 'Guarnição',
        'Sobremesa': 'Sobremesa',
      };

      // Verifica se é um molho
      if (keywordCategories.molho.some(keyword => descricaoLower.includes(keyword))) {
        tipo = 'Molho';
      } 
      // Se for prato protéico, categoriza baseado no conteúdo
      else if (tipo.toLowerCase().includes('prato protéico')) {
        // Verifica o conteúdo do prato para determinar a categoria
        if (keywordCategories.vegano.some(keyword => descricaoLower.includes(keyword)) ||
            keywordCategories.vegetariano.some(keyword => descricaoLower.includes(keyword))) {
          tipo = 'Prato Proteico Veg';
        } else if (keywordCategories.peixe.some(keyword => descricaoLower.includes(keyword))) {
          tipo = 'Prato Proteico do Mar';
        } else {
          tipo = 'Prato Proteico';
        }
      } else {
        // Aplica o mapeamento de tipos padrão
        for (const [key, value] of Object.entries(tipoMap)) {
          if (tipo.toLowerCase().includes(key.toLowerCase())) {
            tipo = value;
            break;
          }
        }
      }
      
      if (!pratosPorTipo[tipo]) {
        pratosPorTipo[tipo] = [];
      }
      pratosPorTipo[tipo].push(prato.descricaoPrato);
    });

    // Define a ordem de exibição das categorias
    const ordemCategorias = [
      'Entrada',
      'Prato Proteico Veg',
      'Prato Proteico do Mar',
      'Prato Proteico',
      'Acompanhamento',
      'Guarnição',
      'Molho',
      'Sobremesa',
      'Bebida'
    ];

    // Ordena as categorias
    const categorias = Object.entries(pratosPorTipo);
    categorias.sort((a, b) => {
      const indexA = ordemCategorias.indexOf(a[0]);
      const indexB = ordemCategorias.indexOf(b[0]);
      return indexA - indexB;
    });

    return categorias.map(([tipo, pratos]) => (
      <Card 
        key={tipo} 
        mb={4} 
        variant="outline" 
        boxShadow="sm"
        bg="white"
        borderRadius="xl"
        overflow="hidden"
        _hover={{
          transform: 'translateY(-2px)',
          boxShadow: 'md',
        }}
        transition="all 0.2s"
      >
        <CardBody>
          <Box
            bg={getTipoBgColor(tipo)}
            mx={-4}
            mt={-4}
            mb={4}
            p={4}
            borderBottom="1px"
            borderColor={getTipoBorderColor(tipo)}
          >
            <Text 
              fontSize="lg" 
              fontWeight="bold" 
              color={getTipoTextColor(tipo)}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text as="span" fontSize="2xl" mr={2}>
                {getEmojiForType(tipo, pratos[0])}
              </Text>
              {tipo}
            </Text>
          </Box>
          <List spacing={3}>
            {pratos.map((prato, index) => (
              <ListItem 
                key={index} 
                display="flex" 
                alignItems="center"
                p={3}
                borderRadius="md"
                _hover={{ bg: 'gray.50' }}
                transition="all 0.2s"
              >
                <Text ml={2} color="gray.700">{prato}</Text>
              </ListItem>
            ))}
          </List>
        </CardBody>
      </Card>
    ));
  };

  const renderControls = () => (
    <VStack spacing={4} mb={6}>
      <Input
        type="date"
        value={format(selectedDate, 'yyyy-MM-dd')}
        onChange={handleDateChange}
        size="lg"
        maxW="300px"
      />
      <Select
        placeholder="Escolha um restaurante"
        value={selectedRestaurante}
        onChange={(e) => setSelectedRestaurante(e.target.value)}
        size="lg"
        maxW="300px"
      >
        {restaurantes.map((r) => (
          <option key={r.id} value={r.id}>
            {r.nome}
          </option>
        ))}
      </Select>
      <HStack spacing={4}>
        <Button
          colorScheme={tipoRefeicao === 'Almoço' ? 'teal' : 'gray'}
          onClick={() => setTipoRefeicao('Almoço')}
          leftIcon={<span>🌞</span>}
        >
          Almoço
        </Button>
        <Button
          colorScheme={tipoRefeicao === 'Jantar' ? 'teal' : 'gray'}
          onClick={() => setTipoRefeicao('Jantar')}
          leftIcon={<span>🌙</span>}
        >
          Jantar
        </Button>
      </HStack>
    </VStack>
  );

  const renderCardapio = () => {
    if (loading) {
      return (
        <Center p={8}>
          <Spinner size="xl" color="teal.500" />
        </Center>
      );
    }

    if (!cardapio) {
      return (
        <Text color="gray.500" textAlign="center">
          Selecione um restaurante e uma data para ver o cardápio
        </Text>
      );
    }

    return (
      <VStack spacing={4} align="stretch">
        {renderPratos(cardapio.pratos)}
      </VStack>
    );
  };

  return (
    <ChakraProvider theme={theme}>
      <Box minH="100vh" bg="#FAF7F2">
        {/* Header */}
        <Box bg="white" boxShadow="sm" position="sticky" top={0} zIndex={10}>
          <Container maxW="container.lg" py={4}>
            <Heading size="lg" color="green.600">MenuRU</Heading>
          </Container>
        </Box>

        {/* Anúncio Superior - Seu Anúncio Personalizado */}
        <CustomAd
          format="horizontal"
          imageUrl="/ads/lp.png"
          link="https://wa.me/5531936199338"
        />

        <Container maxW="container.lg" py={4}>
          <Grid 
            templateColumns={{ 
              base: "1fr", 
              lg: "200px 1fr 200px"
            }} 
            gap={{ base: 4, lg: 6 }}
          >
            {/* Sidebar Esquerda - AdSense */}
            <Box display={{ base: "none", lg: "block" }}>
              <Box 
                position="sticky"
                top="100px"
                width="100%"
              >
                <AdSense
                  slot="YOUR-SLOT-ID-2"
                  style={{
                    display: 'block',
                    width: '100%',
                    height: '600px',
                    maxWidth: '160px',
                    margin: '0 auto'
                  }}
                  format="vertical"
                />
              </Box>
            </Box>

            {/* Conteúdo Principal */}
            <Box>
              {renderControls()}
              {renderCardapio()}
            </Box>

            {/* Sidebar Direita - AdSense */}
            <Box display={{ base: "none", lg: "block" }}>
              <Box 
                position="sticky"
                top="100px"
                width="100%"
              >
                <AdSense
                  slot="YOUR-SLOT-ID-3"
                  style={{
                    display: 'block',
                    width: '100%',
                    height: '600px',
                    maxWidth: '160px',
                    margin: '0 auto'
                  }}
                  format="vertical"
                />
              </Box>
            </Box>
          </Grid>

          {/* Anúncios Mobile - Aparecem entre o conteúdo em telas pequenas */}
          <Box 
            display={{ base: "block", lg: "none" }} 
            mt={6}
          >
            <Grid templateColumns="1fr" gap={4}>
              {/* Anúncio Mobile Superior */}
              <AdSense
                slot="YOUR-SLOT-ID-4"
                style={{
                  display: 'block',
                  width: '100%',
                  height: '250px',
                  maxWidth: '300px',
                  margin: '0 auto'
                }}
                format="rectangle"
              />
              
              {/* Seu Anúncio Mobile */}
              <CustomAd
                format="rectangle"
                imageUrl="/ads/lp-mobile.png"
                link="https://wa.me/5531936199338"
              />
            </Grid>
          </Box>
        </Container>

        {/* Footer */}
        <Box as="footer" py={4} textAlign="center" borderTop="1px" borderColor="gray.200" mt={8} bg="white">
          <Text fontSize="sm" color="gray.600">
            MenuRU {new Date().getFullYear()}
          </Text>
          <Link 
            href="https://www.linkedin.com/in/luborgs/" 
            isExternal 
            display="inline-flex"
            alignItems="center"
            color="linkedin.500"
            mt={2}
            _hover={{ textDecoration: 'none', color: 'linkedin.600' }}
          >
            <Text fontSize="sm" mr={2}>Desenvolvido por Lucas Borges</Text>
            <Icon viewBox="0 0 24 24" boxSize={5}>
              <path
                fill="currentColor"
                d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.68 1.68 0 0 0-1.68 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"
              />
            </Icon>
          </Link>
        </Box>
      </Box>
    </ChakraProvider>
  );
}

export default App;
