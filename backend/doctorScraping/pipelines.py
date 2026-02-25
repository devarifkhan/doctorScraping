import logging
import os
import psycopg2
from itemadapter import ItemAdapter
from scrapy.exceptions import DropItem

logger = logging.getLogger(__name__)


class DoctorscrapingPipeline:

    def __init__(self, database_url):
        self.database_url = database_url

    @classmethod
    def from_crawler(cls, crawler):
        return cls(database_url=crawler.settings.get('DATABASE_URL'))

    def open_spider(self, spider):
        self.connection = psycopg2.connect(self.database_url)
        self.cursor = self.connection.cursor()
        self._create_table()
        self.item_count = 0
        self.max_items = int(os.environ.get('SCRAPY_ITEM_LIMIT', '0'))
        logger.info("Connected to PostgreSQL database.")

    def _create_table(self):
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS doctors (
                id SERIAL PRIMARY KEY,
                name TEXT,
                specialty TEXT,
                url TEXT UNIQUE,
                image_url TEXT,
                raw_data TEXT,
                source TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
        """)
        self.connection.commit()

    def process_item(self, item, spider):
        # Drop without saving if we've already hit the per-spider limit
        if self.max_items > 0 and self.item_count >= self.max_items:
            raise DropItem(f"Item limit {self.max_items} reached")

        adapter = ItemAdapter(item)
        try:
            self.cursor.execute(
                """
                INSERT INTO doctors (name, specialty, url, image_url, raw_data, source)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (url) DO NOTHING;
                """,
                (
                    adapter.get('name'),
                    adapter.get('specialty'),
                    adapter.get('url'),
                    adapter.get('image_url'),
                    adapter.get('raw_data'),
                    spider.name,
                ),
            )
            self.connection.commit()
            self.item_count += 1
            # Log AFTER the DB commit — server uses this line to count saved items
            logger.info("Scraped doctor: %s", adapter.get('name'))
        except Exception as e:
            self.connection.rollback()
            logger.error("Failed to insert item (url=%s): %s", adapter.get('url'), e)
        return item

    def close_spider(self, spider):
        self.cursor.close()
        self.connection.close()
        logger.info("Database connection closed.")
