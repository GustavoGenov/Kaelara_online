# -*- coding: utf-8 -*-
"""Root Flask entry point for Render deployment.
It simply imports the application instance defined in ``kaelara.app``.
"""

from kaelara.app import app  # noqa: F401
