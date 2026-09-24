# -*- coding: utf-8 -*-
"""Ponto de Entrada WSGI (Root Entry Point) da Kaelara A.I.

Exporta a instância do aplicativo Flask configurada em `kaelara.app`
para servidores de produção em nuvem (como Render, Gunicorn, Waitress ou Vercel Serverless).
"""

from kaelara.app import app  # noqa: F401
