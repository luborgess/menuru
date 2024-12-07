# MenuRU 🍽️

Uma aplicação web para consulta de cardápios de restaurantes universitários.

> **Disclaimer**: Esta é uma aplicação não oficial desenvolvida de forma independente. Não possui qualquer vínculo oficial com instituições de ensino. Os dados são obtidos de fontes públicas para facilitar o acesso às informações do cardápio.

## 🌟 Funcionalidades

- Consulta do cardápio dos restaurantes universitários
- Visualização de cardápios por data
- Distinção clara entre pratos veganos, vegetarianos e outros
- Interface intuitiva e responsiva
- Atualização em tempo real

## 🚀 Tecnologias Utilizadas

### Frontend
- React.js
- Chakra UI

### Backend
- Node.js
- Express

## 📦 Instalação

### Pré-requisitos
- Node.js (versão 14 ou superior)
- npm ou yarn

### Configuração do Ambiente

1. Clone o repositório
```bash
git clone <seu-repositorio>
cd menuru
```

2. Configure as variáveis de ambiente

Backend (.env):
```env
PORT=3001
NODE_ENV=development
```

Frontend (.env.local):
```env
VITE_API_URL=http://localhost:3001/api
```

### Instalação e Execução

1. Backend:
```bash
cd backend
npm install
npm run dev
```

2. Frontend:
```bash
cd frontend
npm install
npm run dev
```

O frontend estará disponível em `http://localhost:5173` e o backend em `http://localhost:3001`.

### Deploy

O projeto está configurado para deploy na Vercel. Certifique-se de configurar as seguintes variáveis de ambiente no projeto da Vercel:

- Backend:
  - `NODE_ENV`: "production"

- Frontend:
  - `VITE_API_URL`: URL do seu backend na Vercel

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
