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

# Copia e instala as dependências do Python
COPY backend_requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r backend_requirements.txt

# Copia o restante do código do projeto
COPY . .

# Expõe a porta interna do container (Render mapeará automaticamente)
EXPOSE 8000

# Comando para iniciar a aplicação usando gunicorn (necessário para Render)
CMD gunicorn --bind 0.0.0.0:$PORT kaelara.app:app
