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
} from '@chakra-ui/react';
import axios from 'axios';
import { format, addDays, subDays, isToday, isFuture, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: '#faf7f2', // Cor creme/bege claro
      },
    },
    components: {
      Card: {
        baseStyle: {
          container: {
            borderRadius: 'xl',
            transition: 'all 0.2s ease-in-out',
            _hover: {
              transform: 'translateY(-2px)',
              boxShadow: 'lg',
            },
          },
        },
      },
      Button: {
        baseStyle: {
          borderRadius: 'lg',
        },
        variants: {
          solid: {
            transition: 'all 0.2s ease-in-out',
            _hover: {
              transform: 'translateY(-2px)',
            },
          },
        },
      },
      Badge: {
        baseStyle: {
          borderRadius: 'lg',
        },
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

const API_URL = 'http://localhost:3001/api';

function App() {
  const [restaurantes, setRestaurantes] = useState([]);
  const [selectedRestaurante, setSelectedRestaurante] = useState('');
  const [tipoRefeicao, setTipoRefeicao] = useState('Almoço');
  const [cardapio, setCardapio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const toast = useToast();

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
      const response = await axios.get(`${API_URL}/restaurantes`);
      setRestaurantes(response.data);
    } catch (error) {
      toast({
        title: 'Erro ao carregar restaurantes',
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
      const response = await axios.get(
        `${API_URL}/cardapio/${selectedRestaurante}/${tipoRefeicao}?data=${formattedDate}`
      );
      if (response.data && Object.keys(response.data).length > 0) {
        setCardapio(response.data);
      } else {
        setCardapio(null);
        toast({
          title: 'Cardápio não disponível',
          description: 'Não encontramos o cardápio para esta data',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
      setCardapio(null);
      toast({
        title: 'Cardápio não disponível',
        description: 'Não encontramos o cardápio para esta data',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event) => {
    const date = new Date(event.target.value);
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

  return (
    <ChakraProvider theme={theme}>
      <Box minH="100vh" py={8} bg="#faf7f2">
        <Container maxW="container.md">
          <VStack spacing={6} align="stretch">
            {/* Cabeçalho */}
            <Box 
              textAlign="center" 
              bg="white" 
              p={6} 
              borderRadius="2xl" 
              boxShadow="sm"
              border="1px"
              borderColor="gray.100"
            >
              <Heading 
                size="2xl" 
                mb={3}
                bgGradient="linear(to-r, teal.400, teal.600)"
                bgClip="text"
              >
                🍽️ RU UFMG
              </Heading>
            </Box>

            {/* Painel de Controle */}
            <Card 
              variant="outline" 
              boxShadow="sm"
              _hover={{ boxShadow: 'md' }}
              transition="all 0.2s"
            >
              <CardBody>
                <VStack spacing={6}>
                  {/* Seleção de Data */}
                  <HStack spacing={4} width="full" justify="center">
                    <IconButton
                      icon={<span>◀️</span>}
                      onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                      aria-label="Dia anterior"
                      colorScheme="teal"
                      variant="outline"
                      size="lg"
                      _hover={{
                        transform: 'translateX(-2px)',
                      }}
                    />
                    
                    <VStack spacing={1}>
                      <Input
                        type="date"
                        value={format(selectedDate, 'yyyy-MM-dd')}
                        onChange={handleDateChange}
                        size="lg"
                        width="200px"
                        borderRadius="lg"
                        _focus={{
                          borderColor: 'teal.400',
                          boxShadow: '0 0 0 1px var(--chakra-colors-teal-400)',
                        }}
                      />
                      <Text color="gray.600" fontSize="sm" fontWeight="medium">
                        {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                      </Text>
                    </VStack>

                    <IconButton
                      icon={<span>▶️</span>}
                      onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                      aria-label="Próximo dia"
                      colorScheme="teal"
                      variant="outline"
                      size="lg"
                      _hover={{
                        transform: 'translateX(2px)',
                      }}
                    />
                  </HStack>

                  {/* Seleção de Restaurante */}
                  <Box w="full">
                    <Select
                      placeholder="Escolha um restaurante"
                      value={selectedRestaurante}
                      onChange={(e) => setSelectedRestaurante(e.target.value)}
                      bg="white"
                      size="lg"
                      borderRadius="lg"
                      _focus={{
                        borderColor: 'teal.400',
                        boxShadow: '0 0 0 1px var(--chakra-colors-teal-400)',
                      }}
                    >
                      {restaurantes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nome}
                        </option>
                      ))}
                    </Select>
                  </Box>

                  {/* Seleção de Refeição */}
                  <HStack w="full" spacing={4}>
                    <Button
                      flex={1}
                      colorScheme={tipoRefeicao === 'Almoço' ? 'teal' : 'gray'}
                      onClick={() => setTipoRefeicao('Almoço')}
                      size="lg"
                      leftIcon={<span>🌞</span>}
                      _hover={{
                        transform: 'translateY(-2px)',
                        boxShadow: 'md',
                      }}
                      transition="all 0.2s"
                    >
                      Almoço
                    </Button>
                    <Button
                      flex={1}
                      colorScheme={tipoRefeicao === 'Jantar' ? 'teal' : 'gray'}
                      onClick={() => setTipoRefeicao('Jantar')}
                      size="lg"
                      leftIcon={<span>🌙</span>}
                      _hover={{
                        transform: 'translateY(-2px)',
                        boxShadow: 'md',
                      }}
                      transition="all 0.2s"
                    >
                      Jantar
                    </Button>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Conteúdo do Cardápio */}
            {loading ? (
              <Box 
                textAlign="center" 
                py={8}
                bg="white"
                borderRadius="xl"
                boxShadow="sm"
                border="1px"
                borderColor="gray.100"
              >
                <VStack spacing={4}>
                  <Spinner size="xl" color="teal.500" thickness="4px" />
                  <Text color="gray.600" fontSize="lg">
                    Carregando cardápio...
                  </Text>
                </VStack>
              </Box>
            ) : cardapio ? (
              <Box>
                {renderPratos(cardapio.pratos)}
              </Box>
            ) : selectedRestaurante ? (
              <Box 
                textAlign="center" 
                py={8}
                bg="orange.50"
                borderRadius="xl"
                boxShadow="sm"
                border="1px"
                borderColor="orange.100"
              >
                <Text color="orange.700" fontSize="lg">
                  Cardápio não disponível para esta data 😕
                </Text>
              </Box>
            ) : (
              <Box 
                textAlign="center" 
                py={8}
                bg="blue.50"
                borderRadius="xl"
                boxShadow="sm"
                border="1px"
                borderColor="blue.100"
              >
                <Text color="blue.700" fontSize="lg">
                  Selecione um restaurante para ver o cardápio 👆
                </Text>
              </Box>
            )}
          </VStack>
        </Container>
        <Box as="footer" py={4} textAlign="center" borderTop="1px" borderColor="gray.200" mt={8}>
          <Text fontSize="sm" color="gray.600">
            MenuRU {new Date().getFullYear()}
          </Text>
          <Text fontSize="xs" color="gray.500" mt={2}>
            Esta é uma aplicação não oficial desenvolvida de forma independente.
            Não possui qualquer vínculo oficial com instituições de ensino.
          </Text>
        </Box>
      </Box>
    </ChakraProvider>
  );
}

export default App;
