const express = require('express');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Configuração de segurança básica
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 900000, // 15 minutos
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100 // Limite de requisições por IP
});
app.use(limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Configuração CORS
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'Pragma',
        'Expires'
    ],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Adiciona headers para todas as respostas
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Accept,Origin,Authorization,Cache-Control,Pragma,Expires');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Headers para prevenir cache
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
});

// Carregar dados dos restaurantes
const restaurantesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'restaurantes.json'), 'utf8'));

// Configuração da API do RU
const baseUrl = 'https://fump.ufmg.br:3003/cardapios';
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

// Configuração do axios para ignorar erros de certificado
const axiosInstance = axios.create({
    httpsAgent: new (require('https').Agent)({  
        rejectUnauthorized: false
    })
});

// Middleware de validação de data
const validateDate = (req, res, next) => {
    const { data } = req.query;
    if (!data) {
        return res.status(400).json({ error: 'Data não fornecida' });
    }
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data)) {
        return res.status(400).json({ error: 'Formato de data inválido. Use YYYY-MM-DD' });
    }
    
    next();
};

// Middleware de validação de ID do restaurante
const validateRestauranteId = (req, res, next) => {
    const { restauranteId } = req.params;
    if (!restauranteId || isNaN(restauranteId)) {
        return res.status(400).json({ error: 'ID do restaurante inválido' });
    }
    next();
};

// Get list of restaurants
app.get('/api/restaurantes', async (req, res) => {
    console.log('[DEBUG] Recebida requisição para /api/restaurantes');
    try {
        console.log('[DEBUG] Lendo arquivo de restaurantes...');
        if (!restaurantesData || !restaurantesData.restaurantes) {
            console.error('[DEBUG] Dados de restaurantes inválidos:', restaurantesData);
            return res.status(500).json({ 
                error: 'Erro ao buscar restaurantes',
                message: 'Dados de restaurantes não encontrados'
            });
        }

        console.log('[DEBUG] Retornando lista de restaurantes:', restaurantesData.restaurantes);
        res.json(restaurantesData.restaurantes);
    } catch (error) {
        console.error('[DEBUG] Erro ao buscar restaurantes:', error);
        res.status(500).json({ 
            error: 'Erro ao buscar restaurantes',
            message: error.message || 'Erro interno do servidor'
        });
    }
});

// Get menu for a specific restaurant
app.get('/api/cardapio/:restauranteId/:tipoRefeicao', 
    validateRestauranteId,
    validateDate,
    async (req, res) => {
        try {
            const { restauranteId, tipoRefeicao } = req.params;
            const { data } = req.query;

            console.log(`[DEBUG] Iniciando busca de cardápio:`, {
                restauranteId,
                tipoRefeicao,
                data,
                timestamp: new Date().toISOString()
            });

            const params = {
                id: restauranteId,
                dataInicio: data,
                dataFim: data
            };

            console.log(`[DEBUG] Fazendo requisição para API da FUMP:`, {
                url: `${baseUrl}/cardapio`,
                params,
                headers
            });

            const response = await axiosInstance.get(`${baseUrl}/cardapio`, { 
                params,
                headers: {
                    ...headers,
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            // Log da resposta completa da API para debug
            console.log(`[DEBUG] Resposta completa da API:`, JSON.stringify(response.data, null, 2));

            const cardapios = response.data.cardapios;
            
            if (!cardapios || !Array.isArray(cardapios) || cardapios.length === 0) {
                console.log(`[DEBUG] Nenhum cardápio retornado pela API`);
                return res.status(404).json({ 
                    error: 'Cardápio não encontrado',
                    message: 'Não há cardápio disponível para esta data'
                });
            }

            // Procura um cardápio válido com a refeição solicitada
            const cardapioValido = cardapios.find(cardapio => {
                const temRefeicoes = Array.isArray(cardapio.refeicoes) && cardapio.refeicoes.length > 0;
                const refeicaoCorreta = cardapio.refeicoes?.some(r => 
                    r.tipoRefeicao === tipoRefeicao && 
                    Array.isArray(r.pratos) && 
                    r.pratos.length > 0
                );

                console.log(`[DEBUG] Validação de cardápio:`, {
                    dataCardapio: cardapio.data,
                    dataSolicitada: data,
                    temRefeicoes,
                    refeicaoCorreta,
                    refeicoes: cardapio.refeicoes?.map(r => ({
                        tipo: r.tipoRefeicao,
                        pratos: r.pratos?.length || 0
                    }))
                });

                return temRefeicoes && refeicaoCorreta;
            });

            if (!cardapioValido) {
                console.log(`[DEBUG] Nenhum cardápio válido encontrado`);
                return res.status(404).json({ 
                    error: 'Cardápio não encontrado',
                    message: 'Não há cardápio disponível para esta data'
                });
            }

            // Pega a refeição específica
            const refeicaoEspecifica = cardapioValido.refeicoes.find(r => 
                r.tipoRefeicao === tipoRefeicao && r.pratos?.length > 0
            );

            if (!refeicaoEspecifica) {
                console.log(`[DEBUG] Refeição específica não encontrada:`, {
                    tipoRefeicao,
                    refeicoes: cardapioValido.refeicoes.map(r => r.tipoRefeicao)
                });
                return res.status(404).json({ 
                    error: 'Cardápio não encontrado',
                    message: `Não há cardápio de ${tipoRefeicao.toLowerCase()} disponível para esta data`
                });
            }

            console.log(`[DEBUG] Cardápio encontrado com sucesso:`, {
                data: cardapioValido.data,
                tipoRefeicao,
                pratosCount: refeicaoEspecifica.pratos.length
            });

            res.json(refeicaoEspecifica);
        } catch (error) {
            console.error('[DEBUG] Erro ao buscar cardápio:', {
                error: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            
            res.status(500).json({ 
                error: 'Erro ao buscar cardápio',
                message: 'Ocorreu um erro ao buscar o cardápio. Tente novamente mais tarde.'
            });
        }
    }
);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
