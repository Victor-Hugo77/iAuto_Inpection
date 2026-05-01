# iAuto Inspection - Sistema de Visão Computacional

Este é um sistema avançado de inspeção industrial baseado em visão computacional, desenvolvido com **React**, **TensorFlow.js** e **Supabase**. O sistema permite a detecção de objetos, análise de conformidade (OK/FALHA) e medições métricas em tempo real diretamente no navegador.

## 🚀 Tecnologias Utilizadas

- **Frontend:** React.js, Vite, Tailwind CSS.
- **Inteligência Artificial:** TensorFlow.js, MobileNetV2, KNN Classifier.
- **Backend & Banco de Dados:** Supabase (Cloud) e IndexedDB (Local para cache de treinamento).
- **Ícones:** Lucide React.
- **Segurança:** Vite Plugin JavaScript Obfuscator para proteção de código em produção.

## 📋 Funcionalidades Principais

### 1. Detecção e Classificação
- Treinamento em tempo real de novos modelos utilizando a técnica de *Transfer Learning*.
- Definição de múltiplas Regiões de Interesse (ROI).
- Classificação de objetos como "Conforme" ou "Não Conforme".
- Suporte a múltiplos modelos salvos na nuvem.

### 2. Metrologia Digital
- Ferramentas de medição entre pontos na imagem.
- Sistema de calibração para converter pixels em milímetros (ou outras unidades reais).
- Cálculo automático de distâncias e tolerâncias.

### 3. Modo Operador vs. Modo Setup
- **Modo Setup:** Interface administrativa para configurar regiões, treinar a IA, ajustar thresholds e calibrar medidas.
- **Modo Operador:** Interface simplificada para linha de produção, com leitura de código de barras, feedback visual imediato e registro automático de histórico.

### 4. Histórico e Auditoria
- Registro de todas as inspeções realizadas com timestamp, status, detalhes das regiões e imagem capturada.
- Sincronização automática com banco de dados Supabase para acompanhamento remoto.

## 🛠️ Estrutura do Projeto

- `src/App.jsx`: Componente principal contendo a lógica da câmera, loop de processamento de IA e interface.
- `src/db.js`: Gerenciamento do banco de dados local (IndexedDB) para armazenamento rápido de imagens de treinamento.
- `src/supabase.js`: Configuração do cliente Supabase para persistência na nuvem.
- `src/services/MeasurementService.js`: Lógica de processamento de medidas e cálculos geométricos.
- `public/libs/`: Bibliotecas proprietárias do motor de inferência e visão computacional.

## ⚙️ Instalação e Execução

1. Clone o repositório:
   ```bash
   git clone https://github.com/danielmirandajack/iAuto_Inpection.git
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   Crie um arquivo `.env` na raiz do projeto com as credenciais do seu projeto Supabase:
   ```env
   VITE_SUPABASE_URL=seu_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

5. Para gerar a build de produção (com ofuscação):
   ```bash
   npm run build
   ```

## 🔒 Licença

Este projeto é de uso restrito. Todos os direitos reservados a Daniel Miranda Jack.
