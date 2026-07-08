# Utiliza uma imagem oficial do Python, que já vem com pip configurado perfeitamente
FROM python:3.11-slim

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Instala dependências de sistema necessárias (ffmpeg, build-essential, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    ffmpeg \
    libpq-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Caso precise de suporte a GPU AMD (ROCm) ou Chrome/Playwright, adicione os repositórios e pacotes manualmente
# Exemplo (descomente e ajuste quando for usar em ambiente que suporte ROCm):
# RUN apt-get update && apt-get install -y --no-install-recommends rocm-dev rocm-opencl rocm-utils google-chrome-stable && \
#     rm -rf /var/lib/apt/lists/*

# Copia e instala as dependências do Python
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copia o restante do código do projeto
COPY . .

# Expõe a porta interna do container (Render mapeará automaticamente)
EXPOSE 8000

# Comando para iniciar a aplicação usando gunicorn (necessário para Render)
CMD gunicorn --bind 0.0.0.0:$PORT kaelara.app:app
