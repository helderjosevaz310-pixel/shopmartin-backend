# ShopMartin — Backend

API real (Node.js + Express + PostgreSQL) para a plataforma de criação de lojas virtuais.
Corresponde à mesma lógica do protótipo, mas com dados persistentes reais, autenticação segura,
e limites de plano validados no servidor (não apenas no telemóvel/browser).

## O que já está feito
- Registo e login com password encriptada (bcrypt) e sessão por JWT
- Limite de tentativas de login (protege contra ataques de força-bruta)
- Validação de todos os dados recebidos (express-validator)
- Limites de lojas/produtos por plano, verificados no servidor
- Cabeçalhos de segurança (helmet) e CORS restrito ao teu domínio
- Programa de afiliados: código único por utilizador, rasteio de quem trouxe quem (`GET /api/affiliates/me`)
- Registo de impressões de anúncios por loja (`POST /api/stores/:id/ad-events`, `GET /api/ads/stats`)
- Mudança de plano (`POST /api/users/me/plan`) — **atenção**: esta rota ainda não cobra nada de verdade,
  ver aviso no ficheiro `routes/users.js`

## O que falta ligar (fora do código)
- **Stripe**: criar os 3 planos no dashboard da Stripe, e um endpoint de webhook que confirme o
  pagamento antes de chamar a atualização de plano — hoje `POST /api/users/me/plan` muda o plano
  sem cobrar, o que é só para testar o fluxo
- **Upload de imagens**: hoje `image_url` espera um link já existente; para upload direto,
  usar um serviço como Cloudflare R2 ou AWS S3 (não guardar imagens na própria base de dados)
- **Anúncios reais**: integrar o SDK do Google AdSense/AdMob nas páginas de loja com plano Starter;
  a rota `ad-events` fica pronta para receber os eventos reais desse SDK

## Como correr localmente
1. `npm install`
2. Cria uma base de dados PostgreSQL (local ou em [Railway](https://railway.app)/[Neon](https://neon.tech))
3. Copia `.env.example` para `.env` e preenche `DATABASE_URL` e `JWT_SECRET`
4. Cria as tabelas: `psql $DATABASE_URL -f schema.sql`
5. `npm run dev`
6. Testa: `curl http://localhost:3000/api/health`

## Como publicar (deploy)
1. Sobe este código para um repositório no GitHub
2. Cria um novo projeto em [Railway](https://railway.app) ou [Render](https://render.com), liga o repositório
3. Adiciona as variáveis de ambiente do `.env.example` nas definições do serviço
4. O deploy corre automaticamente a cada `git push`

## Ligar a app/frontend a esta API
O protótipo HTML/React que já tens usa armazenamento local; para ligar à API real, troca as
chamadas a `window.storage` por `fetch("https://a-tua-api.com/api/...")`, enviando o token JWT
no cabeçalho `Authorization: Bearer <token>` em cada pedido autenticado.
