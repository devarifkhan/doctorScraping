"""
Entry point for running all scrapers in sequence.
Used by Render Cron Job.

Usage:
    python run_scrapers.py
"""

import logging
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(levelname)s: %(message)s',
)
logger = logging.getLogger(__name__)


def main():
    logger.info("Starting doctor scraping run...")

    settings = get_project_settings()
    process = CrawlerProcess(settings)

    # Queue both spiders — they run sequentially
    process.crawl('bddoctor_spider')
    process.crawl('ibnsina_spider')

    process.start()
    logger.info("Scraping run complete.")


if __name__ == '__main__':
    main()
