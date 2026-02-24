import os
from dotenv import load_dotenv

load_dotenv()

BOT_NAME = 'doctorScraping'

SPIDER_MODULES = ['doctorScraping.spiders']
NEWSPIDER_MODULE = 'doctorScraping.spiders'

# Neon PostgreSQL — loaded from .env
DATABASE_URL = os.environ.get('DOCTOR_DB_URL')

# Identify the bot responsibly
USER_AGENT = 'DoctorScraper/1.0 (research project)'

# Obey robots.txt rules
ROBOTSTXT_OBEY = False

# Politeness — avoid hammering the servers
DOWNLOAD_DELAY = 1
CONCURRENT_REQUESTS = 8
CONCURRENT_REQUESTS_PER_DOMAIN = 4

# AutoThrottle adapts the delay based on server load
AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 1
AUTOTHROTTLE_MAX_DELAY = 10
AUTOTHROTTLE_TARGET_CONCURRENCY = 2.0

# Retry failed requests up to 3 times
RETRY_ENABLED = True
RETRY_TIMES = 3
RETRY_HTTP_CODES = [500, 502, 503, 504, 408, 429]

# Request timeout
DOWNLOAD_TIMEOUT = 30

# Default headers
DEFAULT_REQUEST_HEADERS = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en',
}

# Enable the PostgreSQL pipeline
ITEM_PIPELINES = {
    'doctorScraping.pipelines.DoctorscrapingPipeline': 300,
}

# Logging
LOG_LEVEL = 'INFO'
LOG_FORMAT = '%(asctime)s [%(name)s] %(levelname)s: %(message)s'
