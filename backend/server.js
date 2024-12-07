const express = require('express');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
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

// Configuração CORS
const corsOptions = {
    origin: ['http://localhost:5173', 'https://menuru.vercel.app', 'https://menuru-vuwh-kj28xhsdy-lucas-borges-projects-77da4699.vercel.app'],
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Configuração da API do RU
const baseUrl = 'https://fump.ufmg.br:3003/cardapios';
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

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
    console.log('Recebida requisição para /api/restaurantes');
    try {
        console.log('Tentando acessar:', `${baseUrl}/restaurantes`);
        console.log('Headers:', headers);
        const response = await axios.get(`${baseUrl}/restaurantes`, { headers });
        console.log('Resposta recebida com sucesso');
        res.json(response.data);
    } catch (error) {
        console.error('Erro ao buscar restaurantes:');
        if (error.response) {
            // A requisição foi feita e o servidor respondeu com um status diferente de 2xx
            console.error('Dados do erro:', {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers
            });
        } else if (error.request) {
            // A requisição foi feita mas não houve resposta
            console.error('Sem resposta do servidor');
            console.error(error.request);
        } else {
            // Algo aconteceu na configuração da requisição que causou o erro
            console.error('Erro na configuração:', error.message);
        }
        res.status(500).json({ error: 'Erro ao buscar restaurantes' });
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

            const params = {
                id: restauranteId,
                dataInicio: data,
                dataFim: data
            };

            const response = await axios.get(`${baseUrl}/cardapio`, { 
                params,
                headers 
            });

            const cardapios = response.data.cardapios;
            if (!cardapios || cardapios.length === 0) {
                return res.status(404).json({ error: 'Cardápio não encontrado' });
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
                return res.status(404).json({ error: 'Tipo de refeição não encontrado' });
            }

            res.json(selectedMenu);
        } catch (error) {
            console.error('Error fetching menu:', error);
            res.status(500).json({ error: 'Erro ao buscar cardápio' });
        }
    }
);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
