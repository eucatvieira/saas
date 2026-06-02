# Projeto: Secretária Virtual para Clínicas de Estética

## CONTEXTO E ORIGEM DA IDEIA

O criador do projeto viveu pessoalmente a dor que o produto resolve: tentou agendar um horário em uma clínica de depilação a laser e não conseguiu ser atendido por falta de capacidade da secretaria. Esse é o problema central — clínicas de estética perdem clientes todos os dias porque não conseguem responder rápido, não confirmam agendamentos e não têm processo de reativação de quem sumiu.

O mercado-alvo são pequenas clínicas e profissionais autônomos de estética no Brasil — um mercado com mais de 800 mil estabelecimentos. Esses negócios têm dinheiro para pagar uma solução (ticket entre R$129 e R$399/mês), sentem a dor diariamente e tomam decisões de compra rápido porque são negócios individuais sem burocracia.

## O QUE O PRODUTO FAZ

É uma plataforma SaaS B2B onde cada clínica se cadastra e recebe uma secretária virtual no WhatsApp que funciona 24 horas sem intervenção humana. O produto tem duas partes:

### 1. Bot no WhatsApp da clínica — atende os clientes automaticamente com:
- Agendamento completo via conversa (escolhe serviço, profissional, data e horário)
- Lembrete automático 24h antes com pedido de confirmação
- Reagendamento automático quando cliente cancela
- Reativação de clientes que não voltam há mais de 45 dias
- Respostas automáticas para perguntas frequentes (preço, duração, preparo)
- Transferência para atendimento humano quando necessário

### 2. Painel de gestão — onde a dona da clínica acessa e vê:
- Agendamentos do dia e da semana em calendário
- Histórico de clientes e conversas
- Métricas: taxa de no-show, clientes ativos, receita do mês
- Configurações de serviços, profissionais e horários
- Status da conexão WhatsApp

## PONTO IMPORTANTE: O BOT NÃO SUBSTITUI A SECRETÁRIA

O bot assume o que a secretária não consegue fazer: responder às 22h, mandar lembrete para 80 clientes simultaneamente, reativar quem sumiu há 2 meses. A secretária continua sendo responsável pelo atendimento presencial, reembolsos, situações sensíveis e relacionamento humano.

**Linguagem correta para clientes:** "vai liberar sua equipe para focar no atendimento presencial" — NUNCA "vai substituir funcionário".

## STACK TECNOLÓGICA

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Banco de dados | Supabase (PostgreSQL) com Row Level Security |
| Autenticação | Supabase Auth |
| WhatsApp | Z-API (instância por clínica) |
| Automação de fluxos | n8n (webhooks) |
| Calendário | Google Calendar API |
| Pagamentos | Stripe (assinaturas recorrentes) |
| Painel visual | Lovable |
| Deploy | Vercel (frontend) + Railway (backend) |

## BANCO DE DADOS — TABELAS PRINCIPAIS

- **clinics** — cada cliente do SaaS. Guarda nome, telefone, token Z-API, plano, horários de funcionamento, token Google Calendar e dados do Stripe.
- **services** — serviços oferecidos pela clínica (ex: depilação pernas, limpeza de pele). Tem nome, duração em minutos e preço.
- **professionals** — profissionais da clínica com suas especialidades.
- **clients** — clientes da clínica identificados pelo número de WhatsApp. Guarda nome, último agendamento e total de consultas para identificar inativos.
- **appointments** — agendamentos com status (`pending`, `confirmed`, `cancelled`, `no_show`, `completed`), referência ao serviço, profissional e cliente, e ID do evento no Google Calendar.
- **messages** — histórico completo de todas as mensagens trocadas (inbound e outbound) para auditoria e exibição no painel.
- **bot_sessions** — estado atual da conversa de cada cliente com o bot. Estados possíveis: `idle`, `selecting_service`, `selecting_professional`, `selecting_date`, `selecting_time`, `confirming`, `human_takeover`. Guarda contexto da conversa em JSONB.
- **faq_items** — perguntas e respostas personalizadas que cada clínica cadastra.

## LÓGICA DO BOT (MÁQUINA DE ESTADOS)

O bot funciona com estados de conversa salvos no banco. Quando chega uma mensagem:
1. Busca o estado atual da conversa daquele cliente naquela clínica
2. Processa a mensagem baseado no estado
3. Retorna resposta e atualiza o estado

### Fluxo de agendamento:
Cliente manda mensagem → bot envia menu com 5 opções → cliente escolhe "Agendar" → bot pergunta o serviço → cliente escolhe → bot pergunta o profissional (se houver mais de um) → cliente escolhe → bot mostra os próximos 7 dias com vagas → cliente escolhe a data → bot mostra os horários disponíveis naquele dia → cliente escolhe → bot exibe resumo completo pedindo confirmação → cliente confirma → bot cria o agendamento no banco e no Google Calendar → envia confirmação com todos os detalhes.

### Fluxo de lembrete (job automático a cada hora):
Busca agendamentos nas próximas 24 horas onde lembrete não foi enviado → envia mensagem "Confirma sua presença amanhã às X para serviço Y?" → cliente responde SIM: status muda para `confirmed` / cliente responde NÃO: status muda para `cancelled` e clínica é notificada.

### Fluxo de reativação (job automático diário às 10h):
Busca clientes sem agendamento há mais de 45 dias → envia mensagem personalizada com oferta de retorno → registra data do envio para não incomodar de novo por 90 dias.

## PLANOS E PREÇOS

| Plano | Preço | Funcionalidades |
|-------|-------|----------------|
| Basic | R$129/mês | Agendamento automático + lembretes + painel básico. Para autônomas e clínicas com 1 profissional. |
| Pro | R$229/mês | Tudo do Basic + reativação de clientes + FAQ personalizado + múltiplos profissionais + relatórios. |
| Elite | R$399/mês | Tudo do Pro + Google Calendar + pagamento antecipado pelo WhatsApp + suporte prioritário + múltiplas unidades. |

Trial gratuito de 14 dias sem cartão de crédito.

## ESTRATÉGIA DE LANÇAMENTO

Antes mesmo do produto estar pronto:
1. Criar conteúdo no Instagram falando da dor das clínicas (clientes que não aparecem, WhatsApp sem resposta, no-show)
2. Abrir lista de espera de um grupo VIP com as primeiras 20 clínicas interessadas
3. Cobrar R$97 de entrada no grupo (simbólico, para filtrar quem é sério e cobrir custos iniciais)
4. Compartilhar o desenvolvimento em tempo real no grupo, colhendo feedback
5. Lançar o produto primeiro para o grupo com 50% de desconto nos primeiros 3 meses
6. Usar os depoimentos das clínicas piloto para vender para os próximos clientes

A estratégia de venda inicial é presencial — visitar clínicas da cidade, mostrar o produto no celular e fechar no mesmo dia.

## ORDEM DE CONSTRUÇÃO DO PRODUTO

1. Setup do projeto (Vite + React + TypeScript + Tailwind)
2. Supabase: criar projeto e rodar o schema SQL das tabelas
3. Autenticação com Supabase Auth (login, cadastro, recuperação de senha)
4. Layout base com sidebar e rotas protegidas
5. Wizard de onboarding (5 passos: clínica → horários → serviços → profissionais → WhatsApp)
6. Página de Configurações completa
7. Página de Agendamentos com calendário
8. Página de Clientes com histórico
9. Dashboard com métricas
10. Backend Node.js com webhook da Z-API
11. Lógica do bot com máquina de estados
12. Jobs automáticos de lembrete e reativação
13. Integração Google Calendar
14. Integração Stripe para cobranças

## COMO ME AJUDAR

Com esse contexto completo, pode ajudar com qualquer parte do projeto: arquitetura, código, lógica do bot, queries SQL, componentes React, fluxos de automação, copy das mensagens do WhatsApp, estratégia de negócio ou qualquer outra dúvida que surgir durante o desenvolvimento.
